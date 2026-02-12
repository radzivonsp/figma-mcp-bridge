# Figma MCP Bridge (Extended Fork)

> Forked from [magic-spells/figma-mcp-bridge](https://github.com/magic-spells/figma-mcp-bridge) with additional features.

A Model Context Protocol (MCP) server that enables Claude to read and manipulate Figma documents in real-time through a WebSocket bridge to a Figma plugin.

## Fork Additions

- **`figma_set_properties`** - Set component properties (BOOLEAN, TEXT, VARIANT, INSTANCE_SWAP) on instance nodes via `setProperties()` API
- **`componentProperties` exposed** in `figma_get_nodes` for INSTANCE nodes — shows all available properties with their types, values, and exact names
- **`mainComponentId` exposed** on INSTANCE nodes for tracing back to the source component
- **Empty array support for `figma_set_fills`** — pass `[]` to remove all fills

## Features

- **82 Figma operations** - Create shapes, modify styles, manage components, pages, variables, FigJam elements, and more
- **Real-time bidirectional communication** - Changes appear instantly in Figma
- **Token-optimized queries** - Efficient variable search and node traversal for AI interactions
- **Full Figma API access** - Styles, variables, auto-layout, boolean operations, and more

## Architecture

```
Claude Code ←──stdio──→ MCP Server ←──WebSocket──→ Figma Plugin ←──→ Figma API
                        (Node.js)    localhost:3055    (runs in Figma)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Figma desktop app
- Claude Code CLI or Claude Desktop

### Installation

#### Option A: Claude Code CLI (recommended)

```bash
claude mcp add figma-mcp-bridge -- npx github:radzivonsp/figma-mcp-bridge
```

#### Option B: Claude Desktop

Edit your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

> **Tip (macOS):** The `~/Library` folder is hidden by default. Open Finder, press `Cmd+Shift+G`, and paste `~/Library/Application Support/Claude/` to navigate there. Alternatively, press `Cmd+Shift+.` in Finder to toggle hidden files.

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

Then restart Claude Desktop.

#### Option C: Install from source (for development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/radzivonsp/figma-mcp-bridge.git
   cd figma-mcp-bridge
   npm install
   ```

2. **Add to Claude Code**
   ```bash
   claude mcp add figma-mcp-bridge node /path/to/figma-mcp-bridge/src/index.js
   ```

### Install the Figma Plugin

1. Download or clone this repo
2. In Figma: **Plugins → Development → Import plugin from manifest**
3. Select `plugin/manifest.json` from the repo

### Connect

1. Open a Figma file
2. Run the plugin: **Plugins → Development → Claude Figma Bridge**
3. The status should show "Connected"

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FIGMA_BRIDGE_PORT` | `3055` | WebSocket server port (auto-increments if busy) |

### Auto-approve Figma Tools

Add to `.claude/settings.local.json`:
```json
{
  "permissions": {
    "allow": ["mcp__figma-mcp-bridge__*"]
  }
}
```

---

## Commands Reference

### Server Commands

#### `figma_server_info`
Get information about the MCP server including the WebSocket port and connection status.

| Parameter | Type | Description |
|-----------|------|-------------|
| *(none)* | | |

---

### Query Commands

#### `figma_get_context`
Get the current Figma document context including file info, current page, and selection.

| Parameter | Type | Description |
|-----------|------|-------------|
| *(none)* | | |

#### `figma_list_pages`
List all pages in the current Figma document.

| Parameter | Type | Description |
|-----------|------|-------------|
| *(none)* | | |

#### `figma_get_nodes`
Get detailed information about specific nodes by their IDs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Array of node IDs (e.g., `["1:23", "4:56"]`) |
| `depth` | string | No | Detail level: `minimal`, `compact`, or `full` (default) |

#### `figma_get_local_styles`
List all local styles defined in the document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter: `PAINT`, `TEXT`, `EFFECT`, `GRID`, or `ALL` (default) |

#### `figma_get_local_variables`
Get all local variables and variable collections.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter: `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`, or `ALL` (default) |

> **Note**: Can return 25k+ tokens. Prefer `figma_search_variables` for efficiency.

#### `figma_get_children`
Get immediate children of a node. Efficient for browsing hierarchy one level at a time.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `parentId` | string | Yes | | Node ID to get children of |
| `compact` | boolean | No | `true` | Return minimal data |

#### `figma_search_nodes`
Search for nodes by name within a scope. **Preferred for finding specific frames, sections, or elements.**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `parentId` | string | Yes | | Scope to search (page/frame/section ID) |
| `nameContains` | string | No | | Case-insensitive substring match |
| `namePattern` | string | No | | Glob pattern with wildcards (e.g., `*button*`) |
| `types` | string[] | No | | Filter by node types: `FRAME`, `TEXT`, `SECTION`, `COMPONENT`, `INSTANCE`, `GROUP`, etc. |
| `maxDepth` | number | No | `-1` | Search depth (-1 = unlimited, 1 = immediate children) |
| `compact` | boolean | No | `true` | Return minimal data |
| `limit` | number | No | `50` | Maximum results |

> Returns ~50 tokens/node vs ~500 for full node data.

#### `figma_search_components`
Search local components by name. Use when looking for specific components like "Button", "Header", etc.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nameContains` | string | No | | Case-insensitive substring match |
| `namePattern` | string | No | | Glob pattern with wildcards |
| `includeVariants` | boolean | No | `false` | Include individual variants from component sets |
| `compact` | boolean | No | `true` | Return minimal data |
| `limit` | number | No | `50` | Maximum results |

#### `figma_search_styles`
Search local styles by name. More efficient than `figma_get_local_styles` when looking for specific styles.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nameContains` | string | No | | Case-insensitive substring match |
| `type` | string | No | `"ALL"` | Filter: `PAINT`, `TEXT`, `EFFECT`, `GRID`, `ALL` |
| `compact` | boolean | No | `true` | Return minimal data |
| `limit` | number | No | `50` | Maximum results |

#### `figma_search_variables`
Search for variables by name pattern. More efficient than `figma_get_local_variables` (~500 tokens vs 25k+).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `namePattern` | string | No | | Wildcard pattern (`*` = any chars, e.g., `tailwind/orange/*`) |
| `nameContains` | string | No | | Case-insensitive substring match (e.g., `"orange"` matches `"tailwind/orange/500"`) |
| `type` | string | No | `"ALL"` | Variable type filter: `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`, `ALL` |
| `collectionName` | string | No | | Collection name filter |
| `compact` | boolean | No | `true` | Minimal data (id, name, value only) |
| `limit` | number | No | `50` | Max results |

---

### Creation Commands

#### `figma_create_rectangle`
Create a new rectangle.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `100` | Width in pixels |
| `height` | number | No | `100` | Height in pixels |
| `name` | string | No | `"Rectangle"` | Node name |
| `fills` | color | No | | Fill color |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_ellipse`
Create an ellipse, circle, arc, or ring.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `100` | Width (diameter for circle) |
| `height` | number | No | `100` | Height |
| `name` | string | No | `"Ellipse"` | Node name |
| `fills` | color | No | | Fill color |
| `parentId` | string | No | | Parent node ID |
| `arcData.startingAngle` | number | No | | Starting angle in radians |
| `arcData.endingAngle` | number | No | | Ending angle in radians |
| `arcData.innerRadius` | number | No | | Inner radius ratio (0-1) for rings |

#### `figma_create_line`
Create a line.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `length` | number | No | `100` | Line length |
| `rotation` | number | No | `0` | Rotation in degrees |
| `strokeWeight` | number | No | `1` | Stroke weight |
| `strokes` | color | No | | Stroke color |
| `strokeCap` | string | No | `"NONE"` | Cap: `NONE`, `ROUND`, `SQUARE`, `ARROW_LINES`, `ARROW_EQUILATERAL` |
| `name` | string | No | `"Line"` | Node name |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_polygon`
Create a polygon (triangle, pentagon, hexagon, etc.) or star shape.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `100` | Width in pixels |
| `height` | number | No | `100` | Height in pixels |
| `pointCount` | number | No | `5` | Number of sides (polygon) or points (star). Minimum 3 |
| `innerRadius` | number | No | | Inner radius ratio for stars (0-1). Omit for regular polygon |
| `name` | string | No | | Node name |
| `fills` | color | No | | Fill color |
| `strokes` | color | No | | Stroke color |
| `strokeWeight` | number | No | | Stroke weight in pixels |
| `cornerRadius` | number | No | | Corner radius for vertices |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_vector`
Create a custom vector shape using SVG-style path data.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `data` | string | Yes | | SVG path string (e.g., `"M 0 100 L 100 100 L 50 0 Z"`) |
| `windingRule` | string | No | `"NONZERO"` | Fill rule: `NONZERO`, `EVENODD`, `NONE` |
| `name` | string | No | `"Vector"` | Node name |
| `fills` | color | No | | Fill color |
| `strokes` | color | No | | Stroke color |
| `strokeWeight` | number | No | | Stroke weight in pixels |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_frame`
Create a frame container (supports auto-layout).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `100` | Width |
| `height` | number | No | `100` | Height |
| `name` | string | No | `"Frame"` | Node name |
| `fills` | color | No | | Fill color |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_section`
Create a section node for organizing frames and content.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | No | `"Section"` | Section name |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `400` | Width in pixels |
| `height` | number | No | `300` | Height in pixels |
| `fills` | color | No | | Section fill color |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_text`
Create a text node.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `text` | string | No | `"Text"` | Text content |
| `fontSize` | number | No | `16` | Font size |
| `fontFamily` | string | No | `"Inter"` | Font family |
| `fontStyle` | string | No | `"Regular"` | Font style |
| `fills` | color | No | | Text color |
| `name` | string | No | `"Text"` | Node name |
| `parentId` | string | No | | Parent node ID |

#### `figma_clone_nodes`
Clone (duplicate) nodes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nodeIds` | string[] | Yes | | Node IDs to clone |
| `parentId` | string | No | | Parent for clones |
| `offset.x` | number | No | `20` | X offset from original |
| `offset.y` | number | No | `20` | Y offset from original |

#### `figma_create_node_from_svg`
Parse an SVG string and create a Figma node tree from it. Great for importing icons and illustrations.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `svg` | string | Yes | | SVG markup string (e.g., `"<svg>...</svg>"`) |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `name` | string | No | | Name for the created node |
| `parentId` | string | No | | Parent node ID |

---

### Style Commands

#### `figma_set_fills`
Set fill color on a node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `fills` | color | Yes | Fill color |

**Color formats:**
- Hex: `{ color: "#FF0000" }` or `{ color: "#FF0000AA" }` (with alpha)
- RGB: `{ r: 1, g: 0, b: 0, a: 0.5 }`
- Full array: `[{ type: "SOLID", color: { r, g, b }, opacity: 1 }]`
- Empty: `[]` to remove all fills

#### `figma_set_strokes`
Set stroke color on a node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `strokes` | color | Yes | Stroke color |
| `strokeWeight` | number | No | Stroke weight in pixels |

#### `figma_set_text`
Set text content on a text node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Text node to modify |
| `text` | string | Yes | New text content |

#### `figma_set_text_style`
Set font properties on an existing text node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Text node ID |
| `fontSize` | number | No | Font size in pixels |
| `fontFamily` | string | No | Font family (e.g., `"Inter"`) |
| `fontStyle` | string | No | Font style (e.g., `"Bold"`, `"Regular"`) |
| `textCase` | string | No | `ORIGINAL`, `UPPER`, `LOWER`, `TITLE` |
| `textDecoration` | string | No | `NONE`, `UNDERLINE`, `STRIKETHROUGH` |
| `lineHeight` | object | No | `{ unit: "AUTO" }`, `{ unit: "PIXELS", value: 24 }`, or `{ unit: "PERCENT", value: 150 }` |
| `letterSpacing` | object | No | `{ unit: "PIXELS", value: 1 }` or `{ unit: "PERCENT", value: 5 }` |
| `textAlignHorizontal` | string | No | `LEFT`, `CENTER`, `RIGHT`, `JUSTIFIED` |
| `textAlignVertical` | string | No | `TOP`, `CENTER`, `BOTTOM` |

#### `figma_set_opacity`
Set node transparency.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `opacity` | number | Yes | Opacity (0-1) |

#### `figma_set_corner_radius`
Set corner radius.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `radius` | number | No | Uniform radius for all corners |
| `topLeft` | number | No | Top-left corner radius |
| `topRight` | number | No | Top-right corner radius |
| `bottomLeft` | number | No | Bottom-left corner radius |
| `bottomRight` | number | No | Bottom-right corner radius |

#### `figma_set_effects`
Set effects (shadows, blurs).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `effects` | array | Yes | Array of effect objects |

**Shadow effect:**
```json
{
  "type": "DROP_SHADOW",
  "color": { "color": "#000000" },
  "offset": { "x": 0, "y": 4 },
  "radius": 8,
  "spread": 0,
  "visible": true
}
```

**Blur effect:**
```json
{
  "type": "LAYER_BLUR",
  "radius": 10,
  "visible": true
}
```

#### `figma_set_blend_mode`
Set the blend mode (layer blending) of a node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to modify |
| `blendMode` | string | Yes | `PASS_THROUGH`, `NORMAL`, `DARKEN`, `MULTIPLY`, `LINEAR_BURN`, `COLOR_BURN`, `LIGHTEN`, `SCREEN`, `LINEAR_DODGE`, `COLOR_DODGE`, `OVERLAY`, `SOFT_LIGHT`, `HARD_LIGHT`, `DIFFERENCE`, `EXCLUSION`, `HUE`, `SATURATION`, `COLOR`, `LUMINOSITY` |

#### `figma_apply_style`
Apply a local style to a node.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to apply style to |
| `styleId` | string | Yes | Style ID |
| `property` | string | Yes | Property: `fills`, `strokes`, `text`, `effects`, `grid` |

#### `figma_create_paint_style`
Create a local paint style.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Style name (use `/` for folders, e.g., `"Brand/Primary"`) |
| `fills` | color | Yes | Fill color |
| `description` | string | No | Style description |

#### `figma_create_text_style`
Create a local text style.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | | Style name (use `/` for folders) |
| `fontFamily` | string | No | `"Inter"` | Font family |
| `fontStyle` | string | No | `"Regular"` | Font style |
| `fontSize` | number | No | `16` | Font size in pixels |
| `lineHeight` | object | No | | Line height |
| `letterSpacing` | object | No | | Letter spacing |
| `textCase` | string | No | | `ORIGINAL`, `UPPER`, `LOWER`, `TITLE` |
| `textDecoration` | string | No | | `NONE`, `UNDERLINE`, `STRIKETHROUGH` |
| `description` | string | No | | Style description |

---

### Variable Commands

#### `figma_set_variable`
Set variable value or bind to node property.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `variableId` | string | Yes | Variable ID |
| `modeId` | string | No | Mode ID (for setting value) |
| `value` | any | No | Value to set |
| `nodeId` | string | No | Node ID (for binding) |
| `field` | string | No | Field to bind (`opacity`, `cornerRadius`, `fills`, etc.) |
| `paintIndex` | number | No | Paint array index for fills/strokes (default 0) |

#### `figma_create_variable_collection`
Create a new variable collection to organize variables.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Collection name |
| `modes` | string[] | No | Mode names (defaults to `["Mode 1"]`) |

#### `figma_create_variable`
Create a new variable in a collection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Variable collection ID |
| `name` | string | Yes | Variable name (use `/` for groups, e.g., `"colors/primary"`) |
| `type` | string | Yes | `COLOR`, `FLOAT`, `STRING`, `BOOLEAN` |
| `value` | any | No | Initial value for default mode |
| `aliasOf` | string | No | Variable ID to alias (instead of direct value) |
| `description` | string | No | Variable description |
| `scopes` | string[] | No | Where this variable can be used (e.g., `ALL_SCOPES`, `TEXT_CONTENT`, `ALL_FILLS`, etc.) |

#### `figma_rename_variable`
Rename an existing variable.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `variableId` | string | Yes | Variable ID to rename |
| `name` | string | Yes | New name (use `/` for groups) |

#### `figma_delete_variables`
Delete one or more variables.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `variableIds` | string[] | Yes | Array of variable IDs to delete |

#### `figma_rename_variable_collection`
Rename a variable collection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Collection ID to rename |
| `name` | string | Yes | New name |

#### `figma_delete_variable_collection`
Delete a variable collection and all its variables.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Collection ID to delete |

#### `figma_rename_mode`
Rename a mode in a variable collection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Collection ID containing the mode |
| `modeId` | string | Yes | Mode ID to rename |
| `name` | string | Yes | New name for the mode |

#### `figma_add_mode`
Add a new mode to a variable collection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Collection ID to add mode to |
| `name` | string | Yes | Name for the new mode |

#### `figma_delete_mode`
Delete a mode from a variable collection. Cannot delete the last mode.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collectionId` | string | Yes | Collection ID containing the mode |
| `modeId` | string | Yes | Mode ID to delete |

#### `figma_unbind_variable`
Remove a variable binding from a node property.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node ID to unbind from |
| `field` | string | Yes | Field to unbind (`fills`, `strokes`, `opacity`, `cornerRadius`, etc.) |
| `paintIndex` | number | No | Paint array index for fills/strokes (default 0) |

---

### Layout Commands

#### `figma_set_auto_layout`
Configure auto-layout on a frame.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Frame to configure |
| `layoutMode` | string | No | `NONE`, `HORIZONTAL`, `VERTICAL` |
| `primaryAxisSizingMode` | string | No | `FIXED`, `AUTO` |
| `counterAxisSizingMode` | string | No | `FIXED`, `AUTO` |
| `primaryAxisAlignItems` | string | No | `MIN`, `CENTER`, `MAX`, `SPACE_BETWEEN` |
| `counterAxisAlignItems` | string | No | `MIN`, `CENTER`, `MAX`, `BASELINE` |
| `paddingTop` | number | No | Top padding |
| `paddingRight` | number | No | Right padding |
| `paddingBottom` | number | No | Bottom padding |
| `paddingLeft` | number | No | Left padding |
| `itemSpacing` | number | No | Space between items |
| `counterAxisSpacing` | number | No | Space between rows when wrapped |
| `layoutWrap` | string | No | `NO_WRAP`, `WRAP` |

#### `figma_set_layout_align`
Set child alignment in auto-layout.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Child node to modify |
| `layoutAlign` | string | No | `MIN`, `CENTER`, `MAX`, `STRETCH`, `INHERIT` |
| `layoutGrow` | number | No | Growth factor (0-1) |
| `layoutPositioning` | string | No | `AUTO`, `ABSOLUTE` |

#### `figma_set_layout_grids`
Set layout grids on a frame. Pass an empty array to remove all grids.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Frame node ID |
| `layoutGrids` | array | Yes | Array of grid configurations |

**Grid configuration:**
```json
{
  "pattern": "COLUMNS",
  "sectionSize": 100,
  "visible": true,
  "color": { "r": 1, "g": 0, "b": 0, "a": 0.1 },
  "alignment": "STRETCH",
  "gutterSize": 20,
  "offset": 0,
  "count": 12
}
```

Patterns: `COLUMNS`, `ROWS`, `GRID`. Alignment (for COLUMNS/ROWS): `MIN`, `CENTER`, `MAX`, `STRETCH`.

#### `figma_set_constraints`
Set resize constraints (non-auto-layout frames only).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to configure |
| `horizontal` | string | No | `MIN`, `CENTER`, `MAX`, `STRETCH`, `SCALE` |
| `vertical` | string | No | `MIN`, `CENTER`, `MAX`, `STRETCH`, `SCALE` |

---

### Transform Commands

#### `figma_move_nodes`
Move nodes to a new position.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to move |
| `x` | number | No | X position or offset |
| `y` | number | No | Y position or offset |
| `relative` | boolean | No | If true, x/y are offsets (default false) |

#### `figma_resize_nodes`
Resize nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to resize |
| `width` | number | No | New width |
| `height` | number | No | New height |

#### `figma_set_rotation`
Set the rotation of one or more nodes. Rotation is around the center point.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to rotate |
| `rotation` | number | Yes | Rotation in degrees (-180 to 180) |

#### `figma_delete_nodes`
Delete nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to delete |

#### `figma_group_nodes`
Group multiple nodes.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nodeIds` | string[] | Yes | | Nodes to group |
| `name` | string | No | `"Group"` | Group name |

#### `figma_ungroup_nodes`
Ungroup group nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Group nodes to ungroup |

#### `figma_boolean_operation`
Combine multiple shapes using boolean operations or flatten them into a single vector.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operation` | string | Yes | `UNION` (combine), `SUBTRACT` (cut), `INTERSECT` (overlap only), `EXCLUDE` (non-overlap only), `FLATTEN` (destructive vector) |
| `nodeIds` | string[] | Yes | Array of node IDs to combine (minimum 2) |
| `name` | string | No | Name for the resulting node |

#### `figma_rename_node`
Rename nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | No | Single node ID |
| `nodeIds` | string[] | No | Batch node IDs |
| `name` | string | Yes | New name |

#### `figma_reorder_node`
Change z-order (layer order).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to reorder |
| `position` | string/number | Yes | `"front"`, `"back"`, or index number |

#### `figma_reparent_nodes`
Move nodes to a different parent container.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to move |
| `newParentId` | string | Yes | New parent node ID (frame, group, or page) |
| `index` | number | No | Position within parent (0 = bottom/back, defaults to top/front) |

#### `figma_move_to_page`
Move nodes from their current page to a different page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to move |
| `targetPageId` | string | Yes | Destination page ID |
| `x` | number | No | X position on the target page |
| `y` | number | No | Y position on the target page |

---

### Navigation Commands

#### `figma_set_selection`
Set the current selection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to select (empty to clear) |

#### `figma_set_current_page`
Switch to a different page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID to switch to |

#### `figma_zoom_to_node`
Scroll and zoom the Figma viewport to focus on specific nodes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeIds` | string[] | Yes | Nodes to zoom to (minimum 1) |

---

### Page Management Commands

#### `figma_create_page`
Create a new page in the Figma document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Name for the new page |
| `index` | number | No | Position in the page list (0 = first, defaults to end) |

#### `figma_rename_page`
Rename an existing page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID to rename |
| `name` | string | Yes | New name |

#### `figma_delete_page`
Delete a page. Cannot delete the last remaining page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID to delete |

#### `figma_reorder_page`
Change the position of a page in the page list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID to reorder |
| `index` | number | Yes | New position (0 = first) |

#### `figma_duplicate_page`
Clone an entire page including all its contents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageId` | string | Yes | Page ID to duplicate |
| `name` | string | No | Name for the new page (defaults to "original name + copy") |

---

### Export Commands

#### `figma_export_node`
Export a node as an image.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `nodeId` | string | Yes | | Node to export |
| `format` | string | No | `"PNG"` | Format: `PNG`, `SVG`, `JPG`, `PDF` |
| `scale` | number | No | `1` | Export scale (1 = 100%) |

Returns base64-encoded data.

---

### Component Commands

#### `figma_create_component`
Create a reusable component.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fromNodeId` | string | No | | Convert existing node to component |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `width` | number | No | `100` | Width |
| `height` | number | No | `100` | Height |
| `name` | string | No | `"Component"` | Component name |
| `fills` | color | No | | Fill color |
| `parentId` | string | No | | Parent node ID |
| `description` | string | No | | Component description |

#### `figma_create_instance`
Create an instance of a component.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `componentId` | string | Yes | Component ID to instantiate |
| `x` | number | No | X position |
| `y` | number | No | Y position |
| `parentId` | string | No | Parent node ID |
| `name` | string | No | Instance name |

#### `figma_set_properties`
Set component properties on an instance node. Supports BOOLEAN, TEXT, VARIANT, and INSTANCE_SWAP property types.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Instance node ID |
| `properties` | object | Yes | Property name → value map |

**Usage:**
1. Create an instance with `figma_create_instance`
2. Read its properties with `figma_get_nodes({ nodeIds: ["ID"], depth: "full" })` — the response now includes `componentProperties`
3. Call `figma_set_properties` to toggle/set values

**Property name formats:**
- **BOOLEAN**: `"Show Icon#0:1": false` (name + `#` + ID suffix)
- **TEXT**: `"Label#0:2": "Submit"` (name + `#` + ID suffix)
- **INSTANCE_SWAP**: `"Icon#0:3": "5204:3637"` (name + `#` + ID suffix, value is node ID)
- **VARIANT**: `"Size": "Large"` (name only, no `#` suffix)

#### `figma_swap_instance`
Swap a component instance to use a different component. Preserves position and size.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | Instance to swap |
| `newComponentId` | string | Yes | Component to swap to |

#### `figma_detach_instance`
Detach instance from component (converts to frame).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Instance to detach |

#### `figma_combine_as_variants`
Combine multiple components into a component set with variants.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `componentIds` | string[] | Yes | Component IDs to combine (minimum 2) |

#### `figma_add_component_property`
Add a new property definition to a component.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `componentId` | string | Yes | Component or component set node ID |
| `propertyName` | string | Yes | Name for the new property |
| `type` | string | Yes | `BOOLEAN`, `TEXT`, `INSTANCE_SWAP`, `VARIANT` |
| `defaultValue` | string/boolean | Yes | Default value |
| `preferredValues` | array | No | Preferred values for INSTANCE_SWAP properties |

#### `figma_edit_component_property`
Modify an existing property definition on a component.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `componentId` | string | Yes | Component or component set node ID |
| `propertyName` | string | Yes | Current property name (with `#id` suffix for BOOLEAN/TEXT/INSTANCE_SWAP) |
| `newName` | string | No | New name for the property |
| `newDefaultValue` | string/boolean | No | New default value |
| `newPreferredValues` | array | No | New preferred values for INSTANCE_SWAP properties |

#### `figma_delete_component_property`
Remove a property definition from a component.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `componentId` | string | Yes | Component or component set node ID |
| `propertyName` | string | Yes | Property name to delete (with `#id` suffix for BOOLEAN/TEXT/INSTANCE_SWAP) |

---

### Dev Mode Commands

#### `figma_set_dev_status`
Mark a node as "Ready for Dev" or "Completed" for Dev Mode handoff.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node to set status on |
| `status` | string/null | Yes | `READY_FOR_DEV`, `COMPLETED`, or `null` to clear |

---

### FigJam Commands

#### `figma_create_sticky`
Create a sticky note in FigJam.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | No | `""` | Text content |
| `color` | string | No | `"YELLOW"` | Color: `GRAY`, `ORANGE`, `GREEN`, `BLUE`, `VIOLET`, `PINK`, `LIGHT_GRAY`, `YELLOW`, `TEAL`, `RED`, `LIGHT_GREEN`, `LIGHT_BLUE` |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_connector`
Create a connector line between two nodes in FigJam.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `startNodeId` | string | Yes | | Start node ID |
| `endNodeId` | string | Yes | | End node ID |
| `startMagnet` | string | No | `"AUTO"` | Start position: `AUTO`, `TOP`, `BOTTOM`, `LEFT`, `RIGHT` |
| `endMagnet` | string | No | `"AUTO"` | End position: `AUTO`, `TOP`, `BOTTOM`, `LEFT`, `RIGHT` |
| `connectorType` | string | No | `"ELBOWED"` | Line style: `ELBOWED`, `STRAIGHT` |
| `text` | string | No | | Label text on connector |
| `strokes` | color | No | | Connector line color |

#### `figma_create_table`
Create a table in FigJam.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rows` | number | Yes | | Number of rows (1-100) |
| `columns` | number | Yes | | Number of columns (1-100) |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_shape_with_text`
Create a shape with text in FigJam. Used for flowcharts and diagrams.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `shapeType` | string | No | `"ROUNDED_RECTANGLE"` | Shape: `SQUARE`, `ELLIPSE`, `ROUNDED_RECTANGLE`, `DIAMOND`, `TRIANGLE_UP`, `TRIANGLE_DOWN`, `PARALLELOGRAM_RIGHT`, `PARALLELOGRAM_LEFT`, `ENG_DATABASE`, `ENG_QUEUE`, `ENG_FILE`, `ENG_FOLDER` |
| `text` | string | No | `""` | Text content |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `fills` | color | No | | Shape fill color |
| `parentId` | string | No | | Parent node ID |

#### `figma_create_code_block`
Create a code block in FigJam with syntax highlighting.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `code` | string | Yes | | Code content |
| `language` | string | No | `"PLAIN_TEXT"` | Language: `JAVASCRIPT`, `TYPESCRIPT`, `PYTHON`, `HTML`, `CSS`, `JSON`, `PLAIN_TEXT`, etc. |
| `x` | number | No | `0` | X position |
| `y` | number | No | `0` | Y position |
| `parentId` | string | No | | Parent node ID |

---

## Token Optimization

### Variable Queries

Use `figma_search_variables` instead of `figma_get_local_variables`:

```javascript
// Inefficient (~25k+ tokens)
figma_get_local_variables({ type: 'ALL' })

// Efficient (~500 tokens)
figma_search_variables({
  namePattern: 'tailwind/orange/*',
  type: 'COLOR',
  compact: true,
  limit: 50
})
```

### Node Traversal

Use the `depth` parameter in `figma_get_nodes`:

| Depth | Properties | Use Case |
|-------|------------|----------|
| `minimal` | ~5 | Tree traversal, finding nodes |
| `compact` | ~10 | Layout inspection |
| `full` | ~40 | Detailed node editing |

### Finding Nodes

Use search tools instead of traversing the full tree:

```javascript
// Find nodes by name within a page/frame
figma_search_nodes({
  parentId: '1:2',           // Required scope
  nameContains: 'button',    // Case-insensitive
  types: ['FRAME', 'COMPONENT'],
  compact: true
})

// Browse hierarchy one level at a time
figma_get_children({ parentId: '1:2' })

// Find components by name
figma_search_components({ nameContains: 'Header' })

// Find styles by name
figma_search_styles({ nameContains: 'primary', type: 'PAINT' })
```

| Tool | Use Case | Token Efficiency |
|------|----------|------------------|
| `figma_search_nodes` | Find frames/elements by name | ~50 tokens/node |
| `figma_get_children` | Browse hierarchy level-by-level | ~50 tokens/node |
| `figma_search_components` | Find specific components | ~50 tokens/result |
| `figma_search_styles` | Find specific styles | ~30 tokens/result |

---

## Known Limitations

- **No ES6 spread operator** in plugin code
- **Boolean operations** require nodes with same parent
- **Constraints** don't work on auto-layout children (use `layoutAlign`)
- **Lines** have height=0, use `length` parameter
- **Vectors** only support M, L, Q, C, Z commands (no arcs)
- **`detachInstance()`** also detaches ancestor instances
- **30-second timeout** on all commands

---

## Troubleshooting

### Plugin Not Connecting

1. Ensure the MCP server is running
2. Check the port: default is 3055, or set `FIGMA_BRIDGE_PORT`
3. Restart the plugin in Figma
4. Click "Reconnect" in the plugin UI

### Port Already in Use

The server automatically tries ports 3055-3070. To use a specific port:
```bash
FIGMA_BRIDGE_PORT=3057 node src/index.js
```

### Multiple Claude Code Instances

Each Claude Code instance can work with a different Figma file by using different ports:

1. **First instance:** Use default port 3055
2. **Second instance:** Set `FIGMA_BRIDGE_PORT=3056`
3. **In Figma plugin:** Change the port number in the plugin UI to match

The plugin UI has a port input field - just change it to connect to a different MCP server.

### Commands Timing Out

- Commands have a 30-second timeout
- Large exports may timeout; try smaller scales
- Check plugin is still connected (green status)

### Font Errors

Text operations require font loading. The plugin handles this automatically, but if a font isn't installed, it will fail. Use fonts available on your system.

---

## License

MIT
