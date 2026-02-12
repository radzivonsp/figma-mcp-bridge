#!/usr/bin/env node

/**
 * Figma MCP Bridge - Entry Point
 *
 * Starts the WebSocket server for Figma plugin communication
 * and the MCP server for Claude communication.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FigmaBridge } from './websocket.js';
import { createServer } from './server.js';
import { execSync } from 'child_process';

const PORT = parseInt(process.env.FIGMA_BRIDGE_PORT || '3055', 10);

function killStaleProcess(port) {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (output) {
      const pids = output.split('\n').filter(p => p && p !== String(process.pid));
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid, 10), 'SIGTERM');
          console.error(`[FigmaMCP] Killed stale process ${pid} on port ${port}`);
        } catch (e) { /* already dead */ }
      }
      // Brief wait for port to be released
      if (pids.length > 0) {
        execSync('sleep 0.5');
      }
    }
  } catch (e) { /* no process on port — good */ }
}

async function main() {
  console.error('[FigmaMCP] Starting Figma MCP Bridge...');

  // Kill any stale process holding our configured port
  killStaleProcess(PORT);

  // Create and start WebSocket bridge
  const bridge = new FigmaBridge(PORT);
  await bridge.start();

  // Log connection events
  bridge.on('connected', (info) => {
    console.error(`[FigmaMCP] Figma connected: ${info.fileName}`);
  });

  bridge.on('disconnected', () => {
    console.error('[FigmaMCP] Figma disconnected');
  });

  // Create MCP server
  const server = createServer(bridge);

  // Connect to stdio transport (Claude communication)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[FigmaMCP] MCP server running on port ${PORT}. Waiting for Figma plugin connection...`);

  // Graceful shutdown helper
  const shutdown = async (reason) => {
    console.error(`[FigmaMCP] Shutting down (${reason})...`);
    await bridge.stop();
    process.exit(0);
  };

  // Handle graceful shutdown
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle stdio close (when Claude closes the connection)
  process.stdin.on('close', () => shutdown('stdin closed'));
  transport.onclose = () => shutdown('transport closed');
}

main().catch((error) => {
  console.error('[FigmaMCP] Fatal error:', error);
  process.exit(1);
});
