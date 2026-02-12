/**
 * figma_get_context tool
 * Returns current document context including connection status, file info, and selection
 */

export const contextTool = {
  name: 'figma_get_context',
  description: 'Get the current Figma document context including file info, current page, and selection. Use this to understand what document is open and what the user has selected.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export async function handleGetContext(bridge) {
  if (!bridge.isConnected()) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          connected: false,
          message: 'Figma plugin is not connected. Please open Figma and run the Claude Bridge plugin.'
        }, null, 2)
      }]
    };
  }

  try {
    const result = await bridge.sendCommand('get_context', {});

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          connected: true,
          ...result
        }, null, 2)
      }]
    };
  } catch (error) {
    // Determine actual connection status based on error type
    // NOT_CONNECTED = definitely disconnected
    // TIMEOUT = connection may be stale, check bridge status
    // Other errors = bridge reports connected but command failed
    const isConnected = error.code !== 'NOT_CONNECTED' && bridge.isConnected();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          connected: isConnected,
          error: {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message
          }
        }, null, 2)
      }],
      isError: true
    };
  }
}
