/**
 * MCP Server setup
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools/index.js';

/**
 * Create and configure the MCP server
 * @param {FigmaBridge} bridge - Figma bridge instance
 * @param {Object} config - Configuration options (e.g. figmaPat)
 * @returns {McpServer} Configured MCP server
 */
export function createServer(bridge, config = {}) {
  const server = new McpServer({
    name: 'figma-mcp-bridge',
    version: '0.1.0',
    instructions: `# Figma MCP Bridge - Usage Guide

## IMPORTANT: Always Use Search Tools First

When working with Figma documents, ALWAYS prefer search tools over bulk retrieval:

### For Variables
- **USE**: \`figma_search_variables\` (~500 tokens) - Filter by name pattern, type, collection
- **AVOID**: \`figma_get_local_variables\` (25k+ tokens, may truncate)

Example:
\`\`\`
figma_search_variables({ namePattern: "colors/*", type: "COLOR", compact: true })
\`\`\`

### For Nodes
- **USE**: \`figma_search_nodes\` - Find frames/elements by name within a scope
- **USE**: \`figma_get_children\` - Browse hierarchy one level at a time
- **AVOID**: Repeated \`figma_get_nodes\` calls to traverse the tree

Example:
\`\`\`
figma_search_nodes({ parentId: "0:1", nameContains: "Button", types: ["FRAME", "COMPONENT"] })
\`\`\`

### For Components
- **USE**: \`figma_search_components\` - Find by name pattern
- Returns compact results with component metadata

### For Styles
- **USE**: \`figma_search_styles\` - Find by name and type
- **AVOID**: \`figma_get_local_styles\` for large documents

## Workflow

1. **Start with context**: Call \`figma_get_context\` to understand the current document and selection
2. **Search first**: Use search tools to find specific elements by name
3. **Get details only when needed**: Use \`figma_get_nodes\` with \`depth: "minimal"\` or \`"compact"\` for efficiency
4. **Use full depth sparingly**: Only use \`depth: "full"\` when you need all node properties

## Token Optimization

| Tool | Tokens | Use Case |
|------|--------|----------|
| \`figma_search_*\` | ~50/result | Finding specific elements |
| \`figma_get_children\` | ~50/node | Browsing hierarchy |
| \`figma_get_nodes\` (minimal) | ~100/node | Tree traversal |
| \`figma_get_nodes\` (full) | ~500/node | Detailed inspection |
| \`figma_get_local_variables\` | 25k+ | AVOID - use search instead
`
  });

  // Register all Figma tools
  registerTools(server, bridge, config);

  return server;
}
