#!/bin/bash
# Shell wrapper to run the MCP server with system Node.js
# This avoids Claude desktop's built-in Node.js which has issues with WebSocket servers

# Find system node - check common locations
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [ -x /usr/local/bin/node ]; then
  NODE_BIN=/usr/local/bin/node
elif [ -x /opt/homebrew/bin/node ]; then
  NODE_BIN=/opt/homebrew/bin/node
elif [ -x "$HOME/.nvm/current/bin/node" ]; then
  NODE_BIN="$HOME/.nvm/current/bin/node"
else
  echo "Error: Node.js not found. Please install Node.js >= 18." >&2
  exit 1
fi

# Resolve script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec "$NODE_BIN" "$SCRIPT_DIR/index.js"
