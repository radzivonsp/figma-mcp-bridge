/**
 * Figma Comments API tools
 *
 * These tools call the Figma REST API directly (not through the plugin bridge)
 * to read and post comments on Figma files.
 *
 * Requires FIGMA_PAT environment variable with file_comments:read and file_comments:write scopes.
 */

const FIGMA_API_BASE = 'https://api.figma.com';

function errorResponse(code, message) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: { code, message } }, null, 2) }],
    isError: true
  };
}

function successResponse(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
}

/**
 * Thin wrapper around fetch for the Figma REST API
 */
async function figmaApiFetch(method, path, token, body) {
  const url = FIGMA_API_BASE + path;
  const headers = {
    'X-Figma-Token': token
  };

  const options = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after') || 'unknown';
    const err = new Error('Rate limited by Figma API. Retry after ' + retryAfter + ' seconds.');
    err.code = 'RATE_LIMITED';
    err.retryAfter = retryAfter;
    throw err;
  }

  if (response.status === 403) {
    const err = new Error('Authentication failed. Check that FIGMA_PAT is valid and has file_comments scopes.');
    err.code = 'AUTH_FAILED';
    throw err;
  }

  if (!response.ok) {
    const text = await response.text();
    const err = new Error('Figma API error (' + response.status + '): ' + text);
    err.code = 'API_ERROR';
    throw err;
  }

  return response.json();
}

/**
 * Validate PAT and bridge connection, return fileKey or an error response
 */
function getFileKey(bridge, config) {
  if (!config.figmaPat) {
    return {
      error: errorResponse('PAT_NOT_CONFIGURED',
        'FIGMA_PAT environment variable is not set. ' +
        'Create a Personal Access Token at Figma > Settings > Security > Personal access tokens ' +
        'with file_comments:read and file_comments:write scopes, then set FIGMA_PAT=figd_xxx in your environment.')
    };
  }

  if (!bridge.isConnected()) {
    return {
      error: errorResponse('NOT_CONNECTED',
        'Figma plugin is not connected. Plugin connection is required to determine the file key.')
    };
  }

  const docInfo = bridge.getDocumentInfo();
  const fileKey = docInfo && docInfo.fileId;
  if (!fileKey || fileKey === 'unknown') {
    return {
      error: errorResponse('FILE_KEY_UNAVAILABLE',
        'File key not available from plugin. Ensure you have the file open in Figma.')
    };
  }

  return { fileKey };
}

/**
 * Read all comments on the current Figma file
 */
export async function handleGetComments(bridge, config, args) {
  const resolved = getFileKey(bridge, config);
  if (resolved.error) return resolved.error;

  const { fileKey } = resolved;
  const { node_id, unresolved_only, include_replies } = args;

  try {
    const data = await figmaApiFetch('GET', '/v1/files/' + fileKey + '/comments?as_md=true', config.figmaPat);

    // Group replies under parent comments
    var comments = [];
    const repliesMap = new Map();

    for (const c of (data.comments || [])) {
      if (c.parent_id) {
        if (!repliesMap.has(c.parent_id)) {
          repliesMap.set(c.parent_id, []);
        }
        repliesMap.get(c.parent_id).push({
          id: c.id,
          message: c.message,
          author: c.user ? c.user.handle : 'Unknown',
          created_at: c.created_at
        });
      } else {
        const nodeId = c.client_meta ? c.client_meta.node_id : null;
        comments.push({
          id: c.id,
          message: c.message,
          author: c.user ? c.user.handle : 'Unknown',
          created_at: c.created_at,
          resolved: !!c.resolved_at,
          node_id: nodeId,
          order_id: c.order_id || null,
          replies: []
        });
      }
    }

    // Attach replies to parents
    for (const comment of comments) {
      if (repliesMap.has(comment.id)) {
        comment.replies = repliesMap.get(comment.id);
      }
    }

    // Filter: unresolved only
    if (unresolved_only) {
      comments = comments.filter(function(c) { return !c.resolved; });
    }

    // Filter: by node_id
    if (node_id) {
      comments = comments.filter(function(c) { return c.node_id === node_id; });
    }

    // Strip replies if not requested
    if (!include_replies) {
      for (const comment of comments) {
        delete comment.replies;
      }
    }

    // Best-effort node name enrichment
    const nodeIds = [];
    const seen = new Set();
    for (const c of comments) {
      if (c.node_id && !seen.has(c.node_id)) {
        seen.add(c.node_id);
        nodeIds.push(c.node_id);
      }
    }

    if (nodeIds.length > 0 && bridge.isConnected()) {
      try {
        const nodesResult = await bridge.sendCommand('get_nodes', { nodeIds: nodeIds, depth: 'minimal' });
        const nodeNameMap = new Map();
        if (nodesResult && nodesResult.nodes) {
          for (const node of nodesResult.nodes) {
            nodeNameMap.set(node.id, node.name);
          }
        }
        for (const comment of comments) {
          if (comment.node_id && nodeNameMap.has(comment.node_id)) {
            comment.node_name = nodeNameMap.get(comment.node_id);
          }
        }
      } catch (e) {
        // Enrichment failed — continue without node names
      }
    }

    return successResponse({
      success: true,
      comments: comments,
      total: comments.length
    });

  } catch (error) {
    return errorResponse(
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Failed to fetch comments'
    );
  }
}

/**
 * Post a new comment or reply to an existing thread
 */
export async function handlePostComment(bridge, config, args) {
  const resolved = getFileKey(bridge, config);
  if (resolved.error) return resolved.error;

  const { fileKey } = resolved;
  const { message, node_id, reply_to } = args;

  if (!node_id && !reply_to) {
    return errorResponse('INVALID_PARAMS',
      'Either node_id (to pin comment to a node) or reply_to (to reply to an existing comment) must be provided.');
  }

  if (node_id && reply_to) {
    return errorResponse('INVALID_PARAMS',
      'Provide either node_id or reply_to, not both. Use node_id for new comments pinned to a node, or reply_to for replying to an existing thread.');
  }

  try {
    const body = { message: message };

    if (reply_to) {
      body.comment_id = reply_to;
    } else if (node_id) {
      body.client_meta = {
        node_id: node_id,
        node_offset: { x: 0, y: 0 }
      };
    }

    const result = await figmaApiFetch('POST', '/v1/files/' + fileKey + '/comments', config.figmaPat, body);

    return successResponse({
      success: true,
      comment: {
        id: result.id,
        message: result.message,
        created_at: result.created_at
      }
    });

  } catch (error) {
    return errorResponse(
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Failed to post comment'
    );
  }
}
