# Figma MCP Bridge (Extended Fork)

> Forked from [magic-spells/figma-mcp-bridge](https://github.com/magic-spells/figma-mcp-bridge) with additional features.

MCP server that lets Claude read and manipulate Figma documents in real-time through a WebSocket bridge to a Figma plugin.

## Fork Additions

- **`figma_set_properties`** - Set component properties (BOOLEAN, TEXT, VARIANT, INSTANCE_SWAP) on instance nodes
- **`componentProperties` exposed** in `figma_get_nodes` for INSTANCE nodes
- **`mainComponentId` exposed** on INSTANCE nodes
- **Empty array support for `figma_set_fills`** — pass `[]` to remove all fills

## Features

- **82 Figma operations** - Create shapes, modify styles, manage components, pages, variables, FigJam elements
- **Real-time bidirectional communication** - Changes appear instantly in Figma
- **Token-optimized queries** - Efficient variable search and node traversal
- **Design skills** - `/figma-design` and `/figjam-design` slash commands that teach Claude best practices

## Architecture

```
Claude Code ←──stdio──→ MCP Server ←──WebSocket──→ Figma Plugin ←──→ Figma API
                        (Node.js)    localhost:3055    (runs in Figma)
```

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
claude mcp add figma-mcp-bridge -- npx github:radzivonsp/figma-mcp-bridge
```

**Claude Desktop (via `.mcpb` bundle)**

Download [`figma-mcp-bridge.mcpb`](dist/figma-mcp-bridge.mcpb) and double-click to install. Or configure manually:
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

Skills aren't directly installable as plugins in these environments. Instead, paste the skill content into your project instructions or system prompt:

1. Copy the contents of [skills/figma-design/SKILL.md](skills/figma-design/SKILL.md) (and/or [skills/figjam-design/SKILL.md](skills/figjam-design/SKILL.md))
2. In **Claude Desktop**: add it to your project's custom instructions
3. In **Claude Web**: paste it at the start of your conversation or into a project's instructions

**From source (cloned repo)**

If you cloned this repo, copy skills into your local Claude Code config:
```bash
mkdir -p .claude/skills
cp -r skills/figma-design skills/figjam-design .claude/skills/
```

### Step 5 (optional): Auto-approve tools

Add to `.claude/settings.local.json` to skip permission prompts:
```json
{
  "permissions": {
    "allow": ["mcp__figma-mcp-bridge__*"]
  }
}
```

### Step 6: Start designing

Type `/figma-design` then describe what you want — or just ask Claude directly:
> "Create a login form with email and password fields"

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FIGMA_BRIDGE_PORT` | `3055` | WebSocket server port (auto-increments up to 3070 if busy) |

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

## Commands (82 tools)

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

Claude Code plugin users get the update automatically (via git). Desktop users download the updated `dist/figma-mcp-bridge.mcpb` from the repo.

---

## Troubleshooting

**Plugin not connecting?**
1. Check the MCP server is running
2. Default port is 3055 — set `FIGMA_BRIDGE_PORT` if needed
3. Restart the plugin in Figma or click "Reconnect"

**Port already in use?**
The server auto-tries ports 3055-3070. Force a specific port:
```bash
FIGMA_BRIDGE_PORT=3057 node src/index.js
```

**Multiple Claude instances?**
Each uses a different port automatically. Match the port in the Figma plugin UI.

**Commands timing out?**
Commands have a 30s timeout. Try smaller export scales. Check the plugin is still connected (green status).

**Font errors?**
Text operations require fonts to be installed on your system. The plugin loads fonts automatically but will fail if the font isn't available.

---

## License

MIT
