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

// Catch all uncaught errors and write to stderr (never stdout, which is the MCP channel)
process.on('uncaughtException', (error) => {
  console.error('[FigmaMCP] Uncaught exception:', error.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FigmaMCP] Unhandled rejection:', reason);
});

function killStaleProcess(port) {
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: Use netstat to find process, taskkill to terminate
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' }).trim();
      if (output) {
        // Parse PID from netstat output (last column)
        const lines = output.split('\n');
        const pids = new Set();

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== String(process.pid) && /^\d+$/.test(pid)) {
            pids.add(pid);
          }
        }

        for (const pid of pids) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.error(`[FigmaMCP] Killed stale process ${pid} on port ${port}`);
          } catch (e) { /* already dead or access denied */ }
        }

        // Brief wait for port release (Windows timeout command)
        if (pids.size > 0) {
          try {
            execSync('timeout /t 1 /nobreak', { stdio: 'ignore' });
          } catch (e) { /* timeout command may not be available */ }
        }
      }
    } else {
      // macOS/Linux: Use lsof
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
    }
  } catch (e) {
    // No process on port (good) OR command failed
    // Exit code 1 typically means "no match found" which is expected
    if (e.status !== 1 && e.code !== 'ENOENT') {
      console.error(`[FigmaMCP] Process cleanup check completed (${e.message})`);
    }
  }
}

async function main() {
  console.error('[FigmaMCP] Starting Figma MCP Bridge...');

  // Create the bridge (does not start the WebSocket server yet)
  const bridge = new FigmaBridge(PORT);

  // Log connection events
  bridge.on('connected', (info) => {
    console.error(`[FigmaMCP] Figma connected: ${info.fileName}`);
  });

  bridge.on('disconnected', () => {
    console.error('[FigmaMCP] Figma disconnected');
  });

  // Config from environment
  const config = {
    figmaPat: process.env.FIGMA_PAT || null
  };

  if (config.figmaPat) {
    console.error('[FigmaMCP] FIGMA_PAT configured - Comments API enabled');
  } else {
    console.error('[FigmaMCP] FIGMA_PAT not set - Comments API will be unavailable');
  }

  // Create MCP server
  const server = createServer(bridge, config);

  // Connect MCP stdio transport FIRST — this must succeed for Claude to communicate
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[FigmaMCP] MCP server connected to stdio transport');

  // Now start the WebSocket bridge (non-fatal — if it fails, MCP still works)
  try {
    killStaleProcess(PORT);
  } catch (e) {
    console.error(`[FigmaMCP] Could not clean stale processes: ${e.message}`);
  }

  try {
    await bridge.start();
    console.error(`[FigmaMCP] WebSocket server running on port ${bridge.port}. Waiting for Figma plugin...`);
  } catch (e) {
    console.error(`[FigmaMCP] WebSocket server failed to start: ${e.message}`);
    console.error('[FigmaMCP] MCP server is still running — tools will report "not connected" until WebSocket is available');
  }

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
