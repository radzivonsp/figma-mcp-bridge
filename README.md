# Figma MCP Bridge (Extended Fork)

> Forked from [magic-spells/figma-mcp-bridge](https://github.com/magic-spells/figma-mcp-bridge) with additional features.

MCP server that lets Claude read and manipulate Figma documents in real-time through a WebSocket bridge to a Figma plugin.

## Fork Additions

- **`figma_set_properties`** - Set component properties (BOOLEAN, TEXT, VARIANT, INSTANCE_SWAP) on instance nodes
- **`componentProperties` exposed** in `figma_get_nodes` for INSTANCE nodes
- **`mainComponentId` exposed** on INSTANCE nodes
- **Empty array support for `figma_set_fills`** — pass `[]` to remove all fills

## Features

- **84 Figma operations** - Create shapes, modify styles, manage components, pages, variables, FigJam elements, comments
- **Real-time bidirectional communication** - Changes appear instantly in Figma
- **Token-optimized queries** - Efficient variable search and node traversal
- **Design skills** - `/figma-design` and `/figjam-design` slash commands that teach Claude best practices

## Architecture

```
Claude Code ←──stdio──→ MCP Server ←──WebSocket──→ Figma Plugin ←──→ Figma API
                        (Node.js)    localhost:3055    (runs in Figma)
```

---

## How It Works (First-Time User Guide)

### The Big Picture

This tool has **two parts** that work together to let Claude control Figma:

1. **MCP Server** (runs on your computer) - Node.js server that lets Claude communicate with Figma
2. **Figma Plugin** (runs inside Figma) - Executes commands in your Figma file

They talk to each other via WebSocket on `localhost:3055` (or 3056-3070 if port 3055 is busy).

### How The Connection Works

```
You ask Claude to create a button
         ↓
Claude calls MCP tool (figma_create_rectangle)
         ↓
MCP Server sends command via WebSocket
         ↓
Figma Plugin receives command
         ↓
Figma Plugin executes Figma API calls
         ↓
Result sent back through the same chain
         ↓
Claude shows you the result
```

### Installation Flow (What You Need to Do)

**Step 1:** Install the **MCP server**
- Via Claude Code CLI: `claude mcp add figma-mcp-bridge -- npx -y github:radzivonsp/figma-mcp-bridge`
- Via Claude Desktop: Download `.mcpb` bundle and double-click
- This runs automatically when you use Claude

**Step 2:** Install the **Figma plugin** (one-time setup)
- You need the `plugin/manifest.json` file from this repo
- Clone the repo OR download just the `plugin/` folder
- In Figma: **Plugins → Development → Import plugin from manifest**
- Select the `plugin/manifest.json` file
- Now "Claude Figma Bridge" appears in your plugins menu

**Step 3:** Connect them (every time you use Figma)
1. Open any Figma file
2. Run: **Plugins → Development → Claude Figma Bridge**
3. Wait for **green "Connected"** status in the plugin UI
4. Now ask Claude to design! Try: "Create a login form with email and password fields"

**Step 4 (optional):** Install design skills for `/figma-design` and `/figjam-design` slash commands

### Common Questions

**Q: Do I need to clone the entire repo?**
- **For MCP server:** No (if using `npx github:...` or `.mcpb` bundle)
- **For Figma plugin:** Yes, you need the `plugin/` folder with `manifest.json`

**Q: Why two separate installations?**
- The MCP server runs in Claude's process (Node.js)
- The Figma plugin runs in Figma's process (sandboxed JavaScript environment)
- They're two different runtime environments that need separate installation

**Q: Do I need to keep the Figma plugin UI open?**
- **Yes** - The plugin must be running for Claude to send commands
- You can minimize the UI window, but don't close it
- If you close it, Claude will get "NOT_CONNECTED" errors

**Q: Can multiple people use this at once?**
- Each person needs their own MCP server + Figma plugin running
- The plugin is per-Figma-file, so each file needs the plugin running
- Multiple Claude instances can run on different ports (3055, 3056, etc.)

**Q: What if I restart Figma or Claude?**
- **Figma restart:** Reopen the file, run the plugin again
- **Claude restart:** MCP server auto-restarts, plugin reconnects automatically
- **Both restart:** Run the plugin again after both are open

**Q: How do I know it's working?**
- Figma plugin shows **green "Connected"** status
- Claude Code: `/mcp list` shows `figma-mcp-bridge` as connected
- Try asking Claude: "What Figma file is currently open?" (uses `figma_get_context`)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Figma desktop app
- Claude Code CLI or Claude Desktop

### Step 1: Install the MCP server

Pick one option:

**Claude Code CLI (recommended)**
```bash
claude mcp add figma-mcp-bridge -e FIGMA_PAT=figd_xxx -- npx -y github:radzivonsp/figma-mcp-bridge
```
Replace `figd_xxx` with your Figma Personal Access Token (see [Step 5](#step-5-optional-enable-comments-api)). If you don't need comments, omit the `-e` flag:
```bash
claude mcp add figma-mcp-bridge -- npx -y github:radzivonsp/figma-mcp-bridge
```

**Claude Desktop (via `.mcpb` bundle)**

Download [`figma-mcp-bridge.mcpb`](bundle/figma-mcp-bridge.mcpb) and double-click to install. Or configure manually:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma-mcp-bridge": {
      "command": "npx",
      "args": ["-y", "github:radzivonsp/figma-mcp-bridge"]
    }
  }
}
```

**From source (for development)**
```bash
git clone https://github.com/radzivonsp/figma-mcp-bridge.git
cd figma-mcp-bridge && npm install
claude mcp add figma-mcp-bridge node /path/to/figma-mcp-bridge/src/index.js
```

### Step 2: Install the Figma plugin

1. Download or clone this repo
2. In Figma: **Plugins → Development → Import plugin from manifest**
3. Select `plugin/manifest.json` from the repo

### Step 3: Connect

1. Open a Figma file
2. Run the plugin: **Plugins → Development → Claude Figma Bridge**
3. Wait for green **"Connected"** status

### Step 4 (optional): Install design skills

Design skills teach Claude best practices for layout, typography, components, design systems, and FigJam diagramming. They add `/figma-design` and `/figjam-design` slash commands.

**Claude Code (CLI)**
```bash
claude plugin add --from github:radzivonsp/figma-mcp-bridge
```

**Claude Desktop / Claude Web (claude.ai)**

Download the `.skill` files and upload them via **Settings → Capabilities → Add → Upload a skill**:

- [`figma-design.skill`](bundle/figma-design.skill) — UI design, auto-layout, components, design systems
- [`figjam-design.skill`](bundle/figjam-design.skill) — FigJam stickies, connectors, flowcharts, diagrams

**From source (cloned repo)**

If you cloned this repo, copy skills into your local Claude Code config:
```bash
mkdir -p .claude/skills
cp -r skills/figma-design skills/figjam-design .claude/skills/
```

### Step 5 (optional): Enable Comments API

Lets Claude read and reply to Figma comments. Create a token at **Figma > Settings > Security > Personal access tokens** with `file_comments:read` and `file_comments:write` scopes.

**Claude Code CLI** — one command:
```bash
claude mcp add figma-mcp-bridge -e FIGMA_PAT=figd_xxx -- npx -y github:radzivonsp/figma-mcp-bridge
```

**Claude Desktop** — add `env` to your config:
```json
{
  "mcpServers": {
    "figma-mcp-bridge": {
      "command": "npx",
      "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
      "env": {
        "FIGMA_PAT": "figd_xxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Without `FIGMA_PAT`, all other tools work normally — only comment tools will return an error with setup instructions.

### Step 6 (optional): Auto-approve tools

Add to `.claude/settings.local.json` to skip permission prompts:
```json
{
  "permissions": {
    "allow": ["mcp__figma-mcp-bridge__*"]
  }
}
```

### Step 7: Start designing

Type `/figma-design` then describe what you want — or just ask Claude directly:
> "Create a login form with email and password fields"

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FIGMA_BRIDGE_PORT` | `3055` | WebSocket server port (auto-increments up to 3070 if busy) |
| `FIGMA_PAT` | — | Figma Personal Access Token for Comments API (scopes: `file_comments:read`, `file_comments:write`) |

### Port Auto-Increment Behavior

The MCP server automatically finds an available port to avoid conflicts:

**How it works:**
1. Tries to start on `FIGMA_BRIDGE_PORT` (default: `3055`)
2. If port is busy, kills stale processes from previous runs (platform-aware: `lsof` on macOS/Linux, `netstat` on Windows)
3. If still busy, auto-increments: `3056`, `3057`, ... up to `3070`
4. Logs which port it actually started on: `[FigmaMCP] MCP server running on port XXXX`

**Important:** The Figma plugin UI has a **port input field**. If the server uses a different port (e.g., 3056), you **must**:
1. Look at the server logs to see which port it chose
2. Enter that port number in the Figma plugin UI
3. Click **"Reconnect"**

**Setting a fixed port:**

Sometimes you want to force a specific port (running multiple instances, port conflicts, etc.):

```bash
# Claude Code CLI
claude mcp add figma-mcp-bridge -e FIGMA_BRIDGE_PORT=3057 -- npx -y github:radzivonsp/figma-mcp-bridge

# Claude Desktop - edit config file manually
{
  "mcpServers": {
    "figma-mcp-bridge": {
      "command": "npx",
      "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
      "env": {
        "FIGMA_BRIDGE_PORT": "3057"
      }
    }
  }
}

# From source
FIGMA_BRIDGE_PORT=3057 node src/index.js
```

**Running multiple Claude instances:**

Each instance needs its own port:

```bash
# Terminal 1 - Instance A
FIGMA_BRIDGE_PORT=3055 claude

# Terminal 2 - Instance B
FIGMA_BRIDGE_PORT=3056 claude
```

Then:
- Open Figma file A → Run plugin → Set port to `3055` → Connect to Instance A
- Open Figma file B → Run plugin → Set port to `3056` → Connect to Instance B

Each Claude instance can control its own Figma file independently!

---

## Skills

| Skill | Use case | What it teaches |
|-------|----------|-----------------|
| `/figma-design` | Design UI, build layouts, create components | Auto-layout, typography scales, color systems, component architecture, design system rules, responsive frames |
| `/figjam-design` | Brainstorm, diagram, create flowcharts | Sticky notes, connectors, flowchart shapes, tables, code blocks, grid layout math |

Skills directory:
```
skills/
├── figma-design/
│   ├── SKILL.md              # Workflow, design system rules
│   ├── auto-layout.md        # Sizing modes, alignment, nesting
│   ├── typography.md          # Text creation, font styles, heading scales
│   ├── color-and-fills.md     # Color formats, paint styles, opacity
│   ├── components.md          # Components, instances, variants, properties
│   ├── variables.md           # Variable collections, modes, binding, theming
│   ├── effects.md             # Shadows, blurs, blend modes
│   └── recipes.md             # Common UI patterns (card, button, nav, etc.)
└── figjam-design/
    ├── SKILL.md               # Layout rules, spacing constants
    └── shapes.md              # FigJam shape types for flowcharts
```

See [Step 4](#step-4-optional-install-design-skills) for installation instructions.

---

## Commands (84 tools)

All tools have full parameter descriptions built-in — Claude discovers them automatically via MCP. Below is a quick reference grouped by category.

### Query & Search
| Tool | Description |
|------|-------------|
| `figma_server_info` | Server status and WebSocket port |
| `figma_get_context` | Current file info, page, and selection |
| `figma_list_pages` | All pages in the document |
| `figma_get_nodes` | Node details by ID (supports `minimal`/`compact`/`full` depth) |
| `figma_get_children` | Immediate children of a node |
| `figma_get_local_styles` | All local styles (paint, text, effect, grid) |
| `figma_get_local_variables` | All local variables (can be 25k+ tokens — prefer search) |
| `figma_search_nodes` | Find nodes by name/type within a scope |
| `figma_search_components` | Find components by name |
| `figma_search_styles` | Find styles by name/type |
| `figma_search_variables` | Find variables by name pattern (~500 tokens vs 25k+) |

### Create
| Tool | Description |
|------|-------------|
| `figma_create_rectangle` | Rectangle with position, size, fill |
| `figma_create_ellipse` | Ellipse, circle, arc, or ring |
| `figma_create_line` | Line with length, rotation, stroke cap |
| `figma_create_polygon` | Polygon or star (via `innerRadius`) |
| `figma_create_vector` | Custom shape from SVG path data |
| `figma_create_frame` | Frame container (supports auto-layout) |
| `figma_create_section` | Section for organizing frames |
| `figma_create_text` | Text node with font and color |
| `figma_create_component` | Reusable component (or convert existing node) |
| `figma_create_instance` | Instance of a component |
| `figma_clone_nodes` | Duplicate nodes with offset |
| `figma_create_node_from_svg` | Import SVG markup as Figma nodes |

### Style
| Tool | Description |
|------|-------------|
| `figma_set_fills` | Set fill color (hex, RGB, or full paint array) |
| `figma_set_strokes` | Set stroke color and weight |
| `figma_set_text` | Set text content |
| `figma_set_text_style` | Set font, size, alignment, spacing, decoration |
| `figma_set_opacity` | Set transparency (0-1) |
| `figma_set_corner_radius` | Uniform or per-corner radius |
| `figma_set_effects` | Shadows, blurs |
| `figma_set_blend_mode` | Layer blending mode |
| `figma_set_rotation` | Rotate nodes (-180 to 180 degrees) |
| `figma_apply_style` | Apply a local style to a node |
| `figma_create_paint_style` | Create a local paint style |
| `figma_create_text_style` | Create a local text style |

### Layout
| Tool | Description |
|------|-------------|
| `figma_set_auto_layout` | Configure auto-layout (direction, padding, spacing, wrap) |
| `figma_set_layout_align` | Child alignment in auto-layout |
| `figma_set_layout_grids` | Column/row/grid overlays |
| `figma_set_constraints` | Resize constraints (non-auto-layout only) |

### Transform
| Tool | Description |
|------|-------------|
| `figma_move_nodes` | Move to absolute or relative position |
| `figma_resize_nodes` | Resize width/height |
| `figma_delete_nodes` | Delete nodes |
| `figma_group_nodes` | Group multiple nodes |
| `figma_ungroup_nodes` | Ungroup |
| `figma_boolean_operation` | Union, subtract, intersect, exclude, flatten |
| `figma_rename_node` | Rename single or batch |
| `figma_reorder_node` | Change z-order (front, back, index) |
| `figma_reparent_nodes` | Move to different parent |
| `figma_move_to_page` | Move nodes to another page |

### Navigation
| Tool | Description |
|------|-------------|
| `figma_set_selection` | Set or clear selection |
| `figma_set_current_page` | Switch page |
| `figma_zoom_to_node` | Zoom viewport to nodes |

### Pages
| Tool | Description |
|------|-------------|
| `figma_create_page` | Create page |
| `figma_rename_page` | Rename page |
| `figma_delete_page` | Delete page (not the last one) |
| `figma_reorder_page` | Change page position |
| `figma_duplicate_page` | Clone page with contents |

### Components
| Tool | Description |
|------|-------------|
| `figma_set_properties` | Set instance properties (BOOLEAN, TEXT, VARIANT, INSTANCE_SWAP) |
| `figma_swap_instance` | Swap to different component |
| `figma_detach_instance` | Detach to frame (cascades to ancestors) |
| `figma_combine_as_variants` | Combine components into variant set |
| `figma_add_component_property` | Add property definition |
| `figma_edit_component_property` | Modify property definition |
| `figma_delete_component_property` | Remove property definition |

### Variables
| Tool | Description |
|------|-------------|
| `figma_set_variable` | Set value or bind to node property |
| `figma_create_variable_collection` | Create collection with modes |
| `figma_create_variable` | Create variable (COLOR, FLOAT, STRING, BOOLEAN) |
| `figma_rename_variable` | Rename variable |
| `figma_delete_variables` | Delete variables |
| `figma_rename_variable_collection` | Rename collection |
| `figma_delete_variable_collection` | Delete collection and all variables |
| `figma_rename_mode` | Rename mode |
| `figma_add_mode` | Add mode to collection |
| `figma_delete_mode` | Delete mode (not the last one) |
| `figma_unbind_variable` | Remove variable binding from node |

### Export & Dev
| Tool | Description |
|------|-------------|
| `figma_export_node` | Export as PNG/SVG/JPG/PDF (base64) |
| `figma_set_dev_status` | Mark as "Ready for Dev" or "Completed" |

### FigJam
| Tool | Description |
|------|-------------|
| `figma_create_sticky` | Sticky note with color |
| `figma_create_connector` | Connector between nodes (elbowed, straight) |
| `figma_create_table` | Table with rows and columns |
| `figma_create_shape_with_text` | Flowchart shape (diamond, ellipse, etc.) |
| `figma_create_code_block` | Code block with syntax highlighting |

### Comments (requires `FIGMA_PAT`)
| Tool | Description |
|------|-------------|
| `figma_get_comments` | Read all comments on the file (filter by node, resolved status) |
| `figma_post_comment` | Post a new comment on a node or reply to a thread |

---

## Token Optimization

| Instead of | Use | Savings |
|------------|-----|---------|
| `figma_get_local_variables` | `figma_search_variables` with `namePattern` | ~25k → ~500 tokens |
| `figma_get_nodes` with `depth: "full"` | `depth: "minimal"` or `"compact"` | ~40 → ~5-10 props/node |
| Repeated `figma_get_children` traversal | `figma_search_nodes` with `nameContains` | N calls → 1 call |

---

## Known Limitations

- **Boolean operations** require nodes with same parent
- **Constraints** don't work on auto-layout children (use `layoutAlign`)
- **Lines** have height=0 — use `length` parameter
- **Vectors** only support M, L, Q, C, Z commands (no arcs)
- **`detachInstance()`** cascades to ancestor instances
- **30-second timeout** on all commands

---

## Distribution & Updates

### How users get updates

| Install method | Update mechanism |
|----------------|------------------|
| `claude plugin add github:...` | Run `/plugin marketplace update` in Claude Code, or enable auto-update |
| `.mcpb` bundle (Desktop) | Download updated `.mcpb` from repo and reinstall |
| `npx github:...` (Desktop JSON) | Automatically fetches latest on each launch |
| From source | `git pull && npm install` |

**Claude Code auto-update:** After installing the plugin, run `/plugin` in Claude Code, go to Marketplaces, and enable auto-update. Plugins will refresh at each session start.

### Packaging a new release (for maintainers)

After updating skills, tools, or server code:

```bash
# 1. Bump version in package.json and manifest.json
# 2. Validate the mcpb manifest
npm run pack:validate

# 3. Rebuild the .mcpb bundle
npm run pack:mcpb

# 4. Commit and push (the .mcpb is tracked in git)
git add -A && git commit -m "Release vX.X.X"
git push
```

Claude Code plugin users get the update automatically (via git). Desktop users download the updated `bundle/figma-mcp-bridge.mcpb` from the repo.

---

## Troubleshooting

### Plugin Not Connecting

**Symptoms:** Figma plugin shows "Disconnected" (red status)

**Solutions:**
1. **Check MCP server is running:**
   - Claude Code: Run `/mcp list` to see if `figma-mcp-bridge` is listed and connected
   - Claude Desktop: Restart the app (the MCP server auto-starts)
2. **Check the port matches:**
   - Look at MCP server logs for `[FigmaMCP] MCP server running on port XXXX`
   - In Figma plugin UI, enter that port number and click "Reconnect"
3. **Restart the plugin:**
   - Close and reopen: Plugins → Development → Claude Figma Bridge
4. **Check firewall/network:**
   - The connection is `localhost` only, but some firewalls block WebSocket on non-standard ports
   - Try the default port 3055 first

### Claude Desktop .mcpb Installation Errors

**Symptoms:** "Server failed to start" or MCP server shows "Disconnected"

**Solutions:**

1. **Check Claude Desktop logs:**
   - Help → View Logs (or Console in Dev Tools)
   - Look for errors from `figma-mcp-bridge`

2. **Common errors and fixes:**

   **"Node.js not found" or "command not found"**
   - Ensure Node.js 18+ is installed and in your PATH
   - Test: Open Terminal and run `node --version`
   - If missing: Download from [nodejs.org](https://nodejs.org/)

   **"Port already in use"**
   - The server auto-increments from 3055 to 3070
   - Restart Claude Desktop to retry with next available port
   - Check Figma plugin UI and update the port number if needed

   **"Cannot find module" or dependency errors**
   - The .mcpb bundle is self-contained, but may need to reinstall
   - Delete and reinstall the .mcpb file
   - OR manually configure with `npx` method (see below)

3. **Manual configuration (if .mcpb fails):**

   Edit your Claude Desktop config file directly:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "figma-mcp-bridge": {
         "command": "npx",
         "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
         "env": {
           "FIGMA_PAT": "figd_xxx"  // Optional: only for Comments API
         }
       }
     }
   }
   ```

   Restart Claude Desktop after saving.

### Port Configuration Issues

**The server tries ports in this order:** 3055, 3056, 3057... up to 3070

**Important:** If the server uses a different port than 3055, you **must** update the port number in the Figma plugin UI and click "Reconnect".

**How to find which port is being used:**
- **Claude Code:** Look at terminal output when starting Claude Code
- **Claude Desktop:** Help → View Logs, search for `[FigmaMCP] MCP server running on port`

**Force a specific port:**
```bash
# Claude Code
claude mcp add figma-mcp-bridge -e FIGMA_BRIDGE_PORT=3057 -- npx -y github:radzivonsp/figma-mcp-bridge

# Claude Desktop (edit config manually)
{
  "mcpServers": {
    "figma-mcp-bridge": {
      "command": "npx",
      "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
      "env": {
        "FIGMA_BRIDGE_PORT": "3057"
      }
    }
  }
}
```

**Running multiple Claude instances:**
- Each instance auto-selects a different port (3055, 3056, etc.)
- Start separate Figma plugin instances
- Configure each plugin to match its Claude instance's port

### Commands Timing Out

**Symptoms:** Tools return timeout errors after 60 seconds

**Solutions:**
1. Check the Figma plugin is still connected (green "Connected" status)
2. For very large files or complex operations:
   - Try processing in smaller batches
   - For exports, use smaller scales or export fewer nodes at once
   - For searches, narrow the scope (search within specific pages/frames)
3. Restart the plugin if it's frozen or unresponsive
4. For extremely large files, consider increasing the timeout in `src/websocket.js` (line 5)

### Font Errors

**Symptoms:** "Cannot load font" errors when creating/modifying text

**Solutions:**
- Text operations require fonts installed on your system
- The plugin auto-loads fonts but fails if unavailable
- Use system fonts (Inter, Helvetica, Arial, etc.)
- Or install the required font on your machine first

### Comments Not Working

**Symptoms:** `figma_get_comments` or `figma_post_comment` return "PAT_NOT_CONFIGURED" error

**Solution (Step-by-Step):**

#### Step 1: Get Your Figma Personal Access Token

1. Open Figma (web or desktop)
2. Click your profile picture → **Settings**
3. Click **Security** in left sidebar
4. Scroll to **Personal access tokens**
5. Click **"Create new token"**
6. Name: `Claude MCP Bridge`
7. Select scopes:
   - ✅ `file_comments:read`
   - ✅ `file_comments:write`
8. Click **"Create token"**
9. **Copy the token** (looks like `figd_xxxxxxxxxxxxxxxxxxxx`)
   - ⚠️ Save it - you won't see it again!

#### Step 2: Add Token to Configuration

**For Claude Desktop:**

1. Open your config file:
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. Find the `figma-mcp-bridge` section

3. Add `FIGMA_PAT` to the `env` block:

   ```json
   {
     "mcpServers": {
       "figma-mcp-bridge": {
         "command": "npx",
         "args": ["-y", "github:radzivonsp/figma-mcp-bridge"],
         "env": {
           "FIGMA_BRIDGE_PORT": "3055",
           "FIGMA_PAT": "figd_xxxxxxxxxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

   **Important:**
   - Add a comma `,` after `"3055"`
   - Replace `figd_xxx...` with your actual token
   - The `FIGMA_PAT` line goes **inside** the `"env": { }` block

4. **Save the file** and **restart Claude Desktop**

**For Claude Code CLI:**
```bash
claude mcp add figma-mcp-bridge -e FIGMA_PAT=figd_xxx -- npx -y github:radzivonsp/figma-mcp-bridge
```

#### Step 3: Test It

In Claude, try:
```
Get all comments on the current Figma file
```

Expected: Claude uses `figma_get_comments` and shows comments.

**Note:** The Figma plugin must be connected for comments to work (file key comes from handshake).

### Platform-Specific Issues

**macOS:**
- Port cleanup uses `lsof` - should work out of the box
- If permission errors, the server will auto-increment to next port

**Windows:**
- Port cleanup uses `netstat` and `taskkill`
- First run may show process cleanup messages - this is normal
- If port conflict persists, manually set `FIGMA_BRIDGE_PORT` to unused port

**Linux:**
- Same as macOS (uses `lsof`)
- Ensure Node.js is in PATH

### Still Having Issues?

1. **Check versions:**
   - Node.js 18+ (`node --version`)
   - Latest Figma desktop app
   - Latest Claude Code/Desktop

2. **Try the source installation:**
   ```bash
   git clone https://github.com/radzivonsp/figma-mcp-bridge.git
   cd figma-mcp-bridge
   npm install
   node src/index.js  # Test if server starts
   claude mcp add figma-mcp-bridge node /full/path/to/figma-mcp-bridge/src/index.js
   ```

3. **File an issue:**
   - [GitHub Issues](https://github.com/radzivonsp/figma-mcp-bridge/issues)
   - Include: OS, Node version, error logs, installation method

---

## License

MIT
