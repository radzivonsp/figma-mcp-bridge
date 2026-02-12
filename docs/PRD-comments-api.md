# PRD: Figma Comments API Integration

**Status:** Draft
**Author:** Radzivon / Claude
**Date:** 2026-02-12
**Project:** figma-mcp-bridge

---

## 1. Problem statement

When collaborating on Figma/FigJam files, team members leave comments using Figma's native comment functionality (pinned to nodes, threaded replies, reactions). Currently the MCP bridge has no access to these comments — Claude cannot read, respond to, or act on feedback left directly in the design file.

This creates a broken workflow: the user must manually copy-paste comment text into the chat for Claude to process it. For discovery boards, design reviews, and async collaboration this is a significant friction point.

## 2. Goal

Enable Claude to read and reply to Figma comments directly through the MCP bridge, so that:

- Claude can read all comments on the current file (including thread structure and which node they're attached to)
- Claude can reply to existing comment threads
- Claude can post new comments pinned to specific nodes
- The workflow of "leave a comment in Figma, ask Claude to respond" becomes seamless

## 3. User stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| US-1 | Designer | Ask Claude to read my Figma comments | I don't have to copy-paste feedback into chat |
| US-2 | Product manager | Leave questions as comments on a FigJam board and have Claude answer them inline | The answers live next to the content they reference |
| US-3 | Designer | Ask Claude to summarize all unresolved comments | I get a quick overview of open feedback |
| US-4 | Team lead | Have Claude reply to design review comments with explanations | Async design review becomes faster |
| US-5 | Designer | Ask Claude to list comments attached to a specific node/section | I can focus on feedback for a particular area |

## 4. Proposed solution

### 4.1 Architecture

The Figma Plugin API does **not** expose comments. Comments are only accessible via the Figma REST API (`https://api.figma.com/v1/files/:key/comments`). This means the bridge needs a second communication channel:

```
Claude (stdio) <-> MCP Server <-> Figma REST API (comments)
                              <-> WebSocket <-> Plugin (nodes, mutations)
```

The MCP server will make direct HTTP calls to the Figma REST API for comment operations, using the file key obtained from the plugin connection.

### 4.2 Authentication

A Figma Personal Access Token (PAT) is required with these scopes:
- `file_comments:read` — to read comments
- `file_comments:write` — to post/reply to comments

The token will be provided via environment variable: `FIGMA_PAT`

### 4.3 New MCP tools

#### `figma_get_comments`

Read all comments on the current file.

**Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `node_id` | string | No | — | Filter comments attached to this node ID |
| `unresolved_only` | boolean | No | `false` | Only return unresolved comments |
| `include_replies` | boolean | No | `true` | Include threaded replies |

**Returns:**

```json
{
  "success": true,
  "comments": [
    {
      "id": "123",
      "message": "Can we validate this assumption?",
      "author": "Radzivon",
      "created_at": "2026-02-12T10:30:00Z",
      "resolved": false,
      "node_id": "9:901",
      "node_name": "Unified cTrader ID...",
      "replies": [
        {
          "id": "124",
          "message": "Good point, let me research this.",
          "author": "Radzivon",
          "created_at": "2026-02-12T10:35:00Z"
        }
      ]
    }
  ],
  "total": 1
}
```

**Implementation notes:**
- Calls `GET /v1/files/:key/comments?as_md=true`
- Enriches with node names by cross-referencing `client_meta.node_id` against the plugin's node data
- Groups replies under parent comments using `parent_id`
- Filters by `node_id` and `resolved_at` client-side (the API doesn't support server-side filtering)

#### `figma_post_comment`

Post a new comment or reply to an existing thread.

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | The comment text (supports markdown) |
| `node_id` | string | No* | Node to pin the comment to (required for new top-level comments) |
| `reply_to` | string | No* | Comment ID to reply to (mutually exclusive with `node_id`) |

*One of `node_id` or `reply_to` must be provided.

**Returns:**

```json
{
  "success": true,
  "comment": {
    "id": "125",
    "message": "Based on research, cTID is used by ~40% of active traders...",
    "created_at": "2026-02-12T11:00:00Z"
  }
}
```

**Implementation notes:**
- Calls `POST /v1/files/:key/comments`
- For `node_id`: constructs `client_meta` as `FrameOffset` with `node_offset: { x: 0, y: 0 }`
- For `reply_to`: passes as `comment_id` in the request body
- Validates that the target node exists before posting

## 5. Technical design

### 5.1 New file: `src/tools/comments.js`

Registers the two new tools with the MCP server. Contains:
- `fetchComments(fileKey, token)` — GET wrapper with error handling
- `postComment(fileKey, token, params)` — POST wrapper
- `enrichWithNodeNames(comments, bridge)` — cross-references node IDs
- Tool registration functions for `figma_get_comments` and `figma_post_comment`

### 5.2 Changes to existing files

| File | Change |
|------|--------|
| `src/tools/index.js` | Import and register comment tools |
| `src/index.js` | Read `FIGMA_PAT` from env, pass to server factory |
| `src/server.js` | Accept and forward PAT config to tool registration |

### 5.3 File key resolution

The plugin connection already provides the file name. To get the file key:

**Option A (preferred):** The plugin sends the file key as part of the connection handshake. Requires a small plugin-side change to include `figma.fileKey` in the `init` message.

**Option B (fallback):** User provides file key via environment variable `FIGMA_FILE_KEY` or as a tool parameter.

### 5.4 Error handling

| Scenario | Behavior |
|----------|----------|
| `FIGMA_PAT` not set | Tools return `{ success: false, error: "FIGMA_PAT not configured" }` with setup instructions |
| Invalid/expired token | Return `{ success: false, error: "Authentication failed" }` |
| Rate limited (429) | Return `{ success: false, error: "Rate limited", retry_after: N }` |
| File key unavailable | Return `{ success: false, error: "File key not available" }` with instructions |

### 5.5 Rate limits

Comments endpoints are Tier 2:
- Full/Dev seats: 25-100 req/min depending on plan
- Viewer seats: 5 req/min

No caching needed for initial implementation — comment reads are infrequent (user-triggered).

## 6. Scope and phases

### Phase 1 (MVP)

- `figma_get_comments` — read all comments, filter by node/resolved status
- `figma_post_comment` — reply to existing threads
- PAT-based auth via env variable
- File key from plugin handshake

### Phase 2 (follow-up)

- `figma_post_comment` with new top-level comments pinned to nodes
- Comment summary tool (aggregate unresolved comments by section/area)
- Webhook listener for real-time comment notifications (`FILE_COMMENT` event)

### Phase 3 (future)

- OAuth flow for multi-user setups
- Reaction support (read/post emoji reactions)
- Comment-driven workflows (e.g., "resolve all comments Claude has replied to")

## 7. Configuration

```bash
# Required for comments functionality
FIGMA_PAT=figd_xxxxxxxxxxxxxxxxxxxx

# Existing
FIGMA_BRIDGE_PORT=3055
```

The PAT is created at: Figma > Settings > Security > Personal access tokens. Required scopes: `file_comments:read`, `file_comments:write`.

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PAT expires or gets revoked | Comments tools stop working | Clear error message with re-auth instructions |
| Rate limiting on free/starter plans | Only 5 req/min for viewer seats | Document plan requirements; batch reads |
| File key not available from plugin | Cannot call REST API | Fallback to env variable; add to plugin handshake |
| Comments pinned to deleted nodes | Orphaned `node_id` references | Gracefully handle missing nodes in enrichment |
| Large files with 1000+ comments | Slow response, high token usage | Add pagination params and `limit` option |

## 9. Success metrics

- Claude can read comments without user copy-pasting: **eliminates manual step**
- Reply-to-comment latency: **< 3 seconds** end-to-end
- Zero auth failures after initial setup

## 10. Open questions

1. Should the plugin send `figma.fileKey` in the handshake, or should we parse it from the file URL?
2. Do we need to support branch-specific comments (file branches have different keys)?
3. Should comment replies from Claude be visually distinguishable (e.g., prefixed with "[Claude]")?
