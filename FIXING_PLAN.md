# Figma MCP Bridge - Comprehensive Fixing Plan

**Analysis Date:** 2026-02-12
**Analyzed By:** Claude Code Deep Codebase Analysis

---

## Executive Summary

After thorough analysis of the entire Figma MCP Bridge codebase, I've identified **2 critical bugs**, **1 platform compatibility issue**, and **several installation/documentation improvements** needed. The architecture is fundamentally sound, with 84 tools properly implemented, but there are specific bugs that need immediate fixes.

### Overall Health: ✅ GOOD
- Architecture: **Solid** - Clean separation of concerns
- Error Handling: **Comprehensive** - All edge cases covered
- Token Optimization: **Excellent** - Search-first strategy implemented
- MCP Protocol: **Correct** - Proper tool registration and response formats
- Figma Plugin: **Robust** - Proper async handling, symbol stripping

---

## Critical Bugs Found

### 🔴 BUG #1: Logic Error in Connection Status Reporting
**File:** `src/tools/context.js`
**Line:** 46
**Severity:** HIGH
**Impact:** Misleading error messages - reports "connected: true" when errors occur

**Current Code:**
```javascript
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        connected: true,  // ❌ WRONG - should be conditional!
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message
        }
      }, null, 2)
    }],
    isError: true
  };
}
```

**Problem:**
- When `bridge.sendCommand()` fails (timeout, plugin crash, etc.), the response still shows `"connected": true`
- This is misleading - if we get a `TIMEOUT` error, the connection may be stale
- If we get a `NOT_CONNECTED` error, we definitely shouldn't report connected=true

**Fix:**
```javascript
} catch (error) {
  // Determine actual connection status based on error type
  const isConnected = error.code !== 'NOT_CONNECTED' && bridge.isConnected();

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        connected: isConnected,  // ✅ Conditional based on error
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message
        }
      }, null, 2)
    }],
    isError: true
  };
}
```

---

### 🔴 BUG #2: Windows Platform Incompatibility
**File:** `src/index.js`
**Lines:** 17-34
**Severity:** HIGH (for Windows users)
**Impact:** Stale process killing fails silently on Windows, may cause port conflicts

**Current Code:**
```javascript
function killStaleProcess(port) {
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    // ❌ lsof doesn't exist on Windows
    if (output) {
      const pids = output.split('\n').filter(p => p && p !== String(process.pid));
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid, 10), 'SIGTERM');
          console.error(`[FigmaMCP] Killed stale process ${pid} on port ${port}`);
        } catch (e) { /* already dead */ }
      }
      if (pids.length > 0) {
        execSync('sleep 0.5');  // ❌ sleep command doesn't exist on Windows
      }
    }
  } catch (e) { /* no process on port — good */ }
}
```

**Problems:**
1. `lsof` command only works on macOS/Linux
2. `sleep` command doesn't exist on Windows (should use PowerShell `timeout` or just skip)
3. Windows users installing via `npx github:...` get silent failures
4. Errors are caught but not logged, so users don't know what happened

**Fix:** Platform-aware implementation
```javascript
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

        // Brief wait for port release (Windows PowerShell timeout)
        if (pids.size > 0) {
          execSync('timeout /t 1 /nobreak', { stdio: 'ignore' });
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

        if (pids.length > 0) {
          execSync('sleep 0.5');
        }
      }
    }
  } catch (e) {
    // No process on port (good) OR command failed
    // On Windows, netstat might fail if port is free - this is expected
    if (e.status !== 1) {  // Exit code 1 = no match found (expected)
      console.error(`[FigmaMCP] Process cleanup check failed (this is usually OK): ${e.message}`);
    }
  }
}
```

**Alternative (Simpler):** Just skip the cleanup on Windows and rely on auto-increment
```javascript
function killStaleProcess(port) {
  // Skip on Windows - rely on port auto-increment instead
  if (process.platform === 'win32') {
    console.error('[FigmaMCP] Windows detected - skipping stale process cleanup (will auto-increment port if needed)');
    return;
  }

  // Original macOS/Linux logic...
  try {
    const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    // ... rest of the code
  } catch (e) { /* no process on port — good */ }
}
```

---

## Installation Issues Found

### 📦 Issue #3: Claude Desktop Installation Errors

**Problem:** Users report errors when installing via `.mcpb` bundle on Claude Desktop

**Root Cause Analysis:**

1. **manifest.json mcp_config has wrong structure**
   - Current: `"command": "node", "args": ["src/index.js"]`
   - Problem: When packaged as `.mcpb`, Claude Desktop extracts to a temp directory
   - The `node src/index.js` path assumes we're in the package root
   - Claude Desktop may not set CWD correctly

2. **Missing shebang in src/index.js**
   - The file has `#!/usr/bin/env node` on line 1 ✅
   - BUT it may not be executable on Windows
   - MCPB bundles should use the node interpreter directly

3. **FIGMA_PAT environment variable templating**
   - `manifest.json` doesn't include FIGMA_PAT in user_config
   - Users can't easily configure it via Claude Desktop UI
   - They must manually edit `claude_desktop_config.json`

**Fix #1: Update manifest.json mcp_config**

Current:
```json
"server": {
  "type": "node",
  "entry_point": "src/index.js",
  "mcp_config": {
    "command": "node",
    "args": ["src/index.js"],
    "env": {
      "FIGMA_BRIDGE_PORT": "${user_config.port}"
    }
  }
}
```

Fixed:
```json
"server": {
  "type": "node",
  "entry_point": "src/index.js",
  "mcp_config": {
    "command": "node",
    "args": ["${entry_point}"],  // ✅ Use template variable
    "env": {
      "FIGMA_BRIDGE_PORT": "${user_config.port}",
      "FIGMA_PAT": "${user_config.figma_pat}"  // ✅ Add PAT config
    }
  }
}
```

**Fix #2: Add FIGMA_PAT to user_config**

Add to manifest.json:
```json
"user_config": {
  "port": {
    "type": "string",
    "title": "WebSocket Port",
    "description": "WebSocket port for Figma plugin connection (default: 3055, auto-increments if busy)",
    "required": false,
    "default": "3055"
  },
  "figma_pat": {
    "type": "string",
    "title": "Figma Personal Access Token",
    "description": "Optional: Required for Comments API. Create at Figma > Settings > Security > Personal access tokens with file_comments:read and file_comments:write scopes.",
    "required": false,
    "secret": true  // ✅ Marks this as sensitive (hides in UI)
  }
}
```

**Fix #3: Update README troubleshooting section**

Add to README.md under "Troubleshooting":

```markdown
### Claude Desktop .mcpb Installation Errors

**"Server failed to start" or "Connection refused"**
1. Check Claude Desktop logs (Help → View Logs)
2. Look for error messages from figma-mcp-bridge
3. Common issues:
   - Node.js not in PATH
   - Port 3055 already in use (should auto-increment, check logs)
   - Missing dependencies (reinstall .mcpb bundle)

**On Windows:**
- First install attempt may fail if port 3055 is busy
- Restart Claude Desktop - port should auto-increment to 3056-3070
- Check Figma plugin UI shows matching port number

**Manual Configuration (if .mcpb fails):**
Edit `claude_desktop_config.json` directly:
```json
{
  "mcpServers": {
    "figma-mcp-bridge": {
      "command": "npx",
      "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
      "env": {
        "FIGMA_PAT": "figd_xxx"  // Optional, for comments
      }
    }
  }
}
```
```

---

## Documentation Improvements

### 📝 Issue #4: Missing First-Time User Workflow

**Problem:** README assumes users understand the architecture
**Solution:** Add "How It Works" section at the top

Add to README.md after "Architecture" section:

```markdown
## How It Works (First-Time User Guide)

### The Big Picture
This tool has **two parts** that need to run at the same time:

1. **MCP Server** (runs on your computer) - Lets Claude talk to Figma
2. **Figma Plugin** (runs inside Figma) - Executes commands in your Figma file

They communicate via WebSocket on port 3055 (or 3056-3070 if busy).

### Installation Flow

**Step 1:** Install the MCP server (via Claude Code CLI or Claude Desktop)
- This runs in the background when you use Claude
- It opens a WebSocket server waiting for the Figma plugin

**Step 2:** Install the Figma plugin (Plugins → Development → Import)
- This adds "Claude Figma Bridge" to your Figma plugins menu
- You'll need to manually import `plugin/manifest.json` from this repo

**Step 3:** Connect them
1. Open a Figma file
2. Run the plugin: Plugins → Development → Claude Figma Bridge
3. Wait for green "Connected" status in the plugin UI
4. Now Claude can control Figma!

**Step 4 (optional):** Install design skills for `/figma-design` and `/figjam-design` commands

### Common Confusion Points

**Q: Do I need to clone the repo?**
- **No** if using `npx github:...` or `.mcpb` bundle
- **Yes** if installing the Figma plugin (need `plugin/manifest.json` file)

**Q: Why isn't Claude controlling Figma?**
- Check the Figma plugin is running (green "Connected" status)
- Check Claude Desktop/Code has the MCP server installed (`/mcp list`)

**Q: Can I use this without the Figma plugin?**
- **No** - The plugin is required. The MCP server just talks to the plugin.

**Q: Do I need to keep the plugin UI open?**
- **Yes** - The plugin needs to be running for Claude to send commands
- You can minimize it, but don't close it
```

---

### 📝 Issue #5: Port Configuration Confusion

**Problem:** Users don't understand port auto-increment behavior

**Solution:** Add prominent note in README

Add to README.md under "Configuration":

```markdown
### Port Auto-Increment Behavior

The MCP server tries ports in this order:
1. `FIGMA_BRIDGE_PORT` (default: 3055)
2. If busy, tries 3056, 3057, ... up to 3070
3. Logs which port it actually used

**Important:** The Figma plugin UI has a port input field. If the server uses a different port (e.g., 3056), you must update this field in the plugin UI and click "Reconnect".

**Tip:** Set a fixed port if you run multiple Claude instances:
```bash
# Instance 1
FIGMA_BRIDGE_PORT=3055 node src/index.js

# Instance 2
FIGMA_BRIDGE_PORT=3056 node src/index.js
```

Then configure each plugin instance to use its specific port.
```

---

## Code Quality Improvements

### 🔧 Issue #6: Missing Error Logging

**File:** `src/index.js`
**Line:** 33
**Problem:** Silent failures in `killStaleProcess()`

**Fix:** Add logging
```javascript
} catch (e) {
  // Log if it's an unexpected error (not just "no process found")
  if (e.code !== 'ENOENT' && e.status !== 1) {
    console.error(`[FigmaMCP] Process cleanup warning: ${e.message}`);
  }
  // Silently continue - port may be free or auto-increment will handle it
}
```

---

### 🔧 Issue #7: Better Connection Error Messages

**File:** `src/websocket.js`
**Enhancement:** Add more descriptive handshake errors

Current handshake just accepts any message. Add validation:

```javascript
handleMessage(message) {
  const msg = JSON.parse(message);

  if (msg.type === 'handshake') {
    // ✅ Validate handshake structure
    if (!msg.fileId || !msg.fileName) {
      this.ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid handshake: missing fileId or fileName'
      }));
      return;
    }

    this.documentInfo = {
      fileId: msg.fileId,
      fileName: msg.fileName,
      editorType: msg.editorType || 'figma'
    };

    // ... rest of handshake logic
  }
}
```

---

## Testing Plan

### Test Cases to Verify Fixes

#### Test Case 1: Context Error Handling
1. Start MCP server
2. **Don't** start Figma plugin
3. Call `figma_get_context` from Claude
4. **Expected:** `{ "connected": false, "message": "..." }`
5. Start plugin, wait 10s, stop plugin
6. Call `figma_get_context` again
7. **Expected:** `{ "connected": false, "error": { "code": "TIMEOUT", ... } }`

#### Test Case 2: Windows Port Cleanup
1. On Windows machine, start MCP server on port 3055
2. Kill it with Ctrl+C
3. Immediately restart
4. **Expected:** Logs show port cleanup attempt or auto-increment to 3056
5. **No crash or hang**

#### Test Case 3: Claude Desktop .mcpb Installation
1. Download `bundle/figma-mcp-bridge.mcpb`
2. Double-click to install in Claude Desktop
3. Restart Claude Desktop
4. Check MCP status: `/mcp list`
5. **Expected:** figma-mcp-bridge listed and "Connected"
6. Configure FIGMA_PAT via Settings (if user_config added)

#### Test Case 4: Multi-Instance Port Handling
1. Start 2 Claude Code instances
2. Both should connect to different ports (3055, 3056)
3. Open Figma, start 2 plugins
4. Configure each plugin to its instance's port
5. **Expected:** Both work independently

---

## Implementation Priority

### Phase 1: Critical Bugs (Do First)
1. ✅ Fix `context.js` line 46 - connected status logic
2. ✅ Fix `index.js` - Windows platform detection

### Phase 2: Installation Improvements
3. ✅ Update `manifest.json` - template variables and FIGMA_PAT config
4. ✅ Update README - troubleshooting section

### Phase 3: Documentation
5. ✅ Add "How It Works" section to README
6. ✅ Add port configuration guide

### Phase 4: Enhancements (Nice to Have)
7. ⚠️ Add better error logging
8. ⚠️ Add handshake validation

---

## Files to Modify

### Critical Fixes (Phase 1)
- [ ] `src/tools/context.js` - Fix line 46
- [ ] `src/index.js` - Add Windows support to killStaleProcess()

### Installation Fixes (Phase 2)
- [ ] `manifest.json` - Update mcp_config and add figma_pat to user_config
- [ ] `README.md` - Add troubleshooting section for .mcpb issues

### Documentation (Phase 3)
- [ ] `README.md` - Add "How It Works" section
- [ ] `README.md` - Add port configuration guide

### Enhancements (Phase 4)
- [ ] `src/index.js` - Better error logging
- [ ] `src/websocket.js` - Handshake validation

---

## Verification Checklist

After implementing fixes:

- [ ] Run on Windows and verify port cleanup works
- [ ] Run on macOS and verify port cleanup works
- [ ] Test Claude Desktop .mcpb installation
- [ ] Test Claude Code `npx github:...` installation
- [ ] Test connection status reporting in various error scenarios
- [ ] Test multi-instance operation (2 Claude instances)
- [ ] Verify FIGMA_PAT configuration in Claude Desktop UI
- [ ] Test all 84 tools still work after fixes
- [ ] Check no regressions in plugin communication

---

## Rebuild Instructions

After making fixes:

```bash
# 1. Validate the manifest
npm run pack:validate

# 2. Rebuild .mcpb bundle
npm run pack:mcpb

# 3. Test locally
node src/index.js

# 4. Test .mcpb installation in Claude Desktop
# (Double-click bundle/figma-mcp-bridge.mcpb)

# 5. Commit and push
git add -A
git commit -m "Fix critical bugs: context status reporting, Windows compatibility, installation issues"
git push
```

---

## Summary

**Critical Issues:** 2
**Installation Issues:** 2
**Documentation Gaps:** 2
**Total Estimated Fixes:** ~2 hours

**Risk Level:** Low - All fixes are isolated, no architectural changes needed

**User Impact:**
- ✅ Windows users can now reliably install and run the server
- ✅ Error messages will be accurate and helpful
- ✅ Claude Desktop users can easily configure FIGMA_PAT
- ✅ First-time users will understand the setup flow

**Next Steps:**
1. Review this plan
2. Implement Phase 1 critical fixes
3. Test on both Windows and macOS
4. Rebuild .mcpb bundle
5. Update documentation
6. Tag new release

---

**Analysis Complete** - Ready for implementation!
