---
name: figma-design
description: Creates and edits Figma design files -- frames, auto-layout, typography, colors, components, design systems, and responsive layouts. Use when the user asks to design UI, create components, build layouts, style elements, or work with a Figma design file.
allowed-tools: mcp__figma-mcp-bridge__*, mcp__figma-desktop__get_screenshot, mcp__figma-desktop__get_metadata, mcp__figma-desktop__get_design_context
---

# Figma Design Builder

## References

- @auto-layout.md -- Auto-layout patterns, sizing modes, alignment, padding, wrap
- @typography.md -- Text styling, font scales, text styles
- @color-and-fills.md -- Color formats, fills, strokes, paint styles, opacity
- @components.md -- Components, instances, variants, component properties
- @variables.md -- Variable collections, modes, light/dark theming
- @effects.md -- Shadows, blurs, blend modes
- @recipes.md -- Common UI patterns: card, button, nav, responsive frame

## Workflow

1. Call `figma_server_info`. If not connected, tell user to run the plugin. Note: the MCP server port can change on restart -- if connected shows false but user says plugin is running, ask them to update the port in the plugin UI to match.
2. Confirm the open file is a Figma design file (editorType: figma). If it is a FigJam file, tell the user to use the `/figjam-design` skill instead.
3. Use `figma_get_context` to understand current page, selection, and document structure.
4. Build content using Figma tools (see tool map below).
5. Screenshot with `mcp__figma-desktop__get_screenshot` after each major step.
6. Iterate based on visual feedback.

## Search-First Strategy (CRITICAL)

NEVER traverse the tree with repeated `figma_get_children` calls. Always search first:

- `figma_search_nodes({ parentId, nameContains, types, compact: true })` -- find any element by name
- `figma_search_components({ nameContains })` -- find components
- `figma_search_styles({ nameContains, type })` -- find styles
- `figma_search_variables({ namePattern, type, compact: true })` -- find variables
- Only use `figma_get_children` when browsing unknown structure at one level
- Only use `figma_get_nodes` with depth `"full"` when you actually need all properties

## Token Optimization

| Depth | Props | Use |
|-------|-------|-----|
| `minimal` | ~5 | Tree traversal, listing |
| `compact` | ~10 | Layout inspection |
| `full` | ~40 | Detailed editing |

Use `figma_search_variables` not `figma_get_local_variables` (~500 vs 25k+ tokens).

## Tool Map

### Query & Navigation

| Tool | Use |
|------|-----|
| `figma_server_info` | Check connection status and port |
| `figma_get_context` | Get document info, current page, selection |
| `figma_list_pages` | List all pages |
| `figma_get_nodes` | Get node details by ID (use depth param!) |
| `figma_get_children` | Browse hierarchy one level |
| `figma_search_nodes` | Find nodes by name (PREFERRED) |
| `figma_search_components` | Find components by name |
| `figma_search_styles` | Find styles by name |
| `figma_search_variables` | Find variables by pattern |
| `figma_set_selection` | Select nodes |
| `figma_set_current_page` | Switch page |
| `figma_zoom_to_node` | Focus viewport on nodes |

### Create

| Tool | Use |
|------|-----|
| `figma_create_frame` | Frames (containers, artboards) |
| `figma_create_rectangle` | Rectangles |
| `figma_create_ellipse` | Circles, ellipses, arcs, rings |
| `figma_create_line` | Lines, arrows |
| `figma_create_polygon` | Polygons, stars |
| `figma_create_text` | Text nodes |
| `figma_create_vector` | Custom SVG paths |
| `figma_create_node_from_svg` | Import full SVG markup |
| `figma_create_section` | Sections for organization |
| `figma_create_component` | Reusable components |
| `figma_create_instance` | Component instances |
| `figma_clone_nodes` | Duplicate existing nodes |

### Style

| Tool | Use |
|------|-----|
| `figma_set_fills` | Fill colors (hex, rgb, array, or `[]` to clear) |
| `figma_set_strokes` | Stroke colors and weight |
| `figma_set_opacity` | Node transparency (0-1) |
| `figma_set_corner_radius` | Rounded corners (uniform or per-corner) |
| `figma_set_effects` | Shadows, blurs |
| `figma_set_blend_mode` | Layer blending (MULTIPLY, SCREEN, OVERLAY, etc.) |
| `figma_set_text` | Change text content |
| `figma_set_text_style` | Font size, weight, case, decoration, alignment, spacing |

### Layout

| Tool | Use |
|------|-----|
| `figma_set_auto_layout` | Enable/configure auto-layout on a frame |
| `figma_set_layout_align` | Child alignment in auto-layout (STRETCH, layoutGrow) |
| `figma_set_constraints` | Resize constraints (non-auto-layout only) |
| `figma_set_layout_grids` | Column/row/pixel grids |

### Transform

| Tool | Use |
|------|-----|
| `figma_move_nodes` | Position nodes (absolute or relative offset) |
| `figma_resize_nodes` | Resize nodes |
| `figma_set_rotation` | Rotate nodes (degrees) |
| `figma_reorder_node` | Z-order: `"front"`, `"back"`, or index |
| `figma_reparent_nodes` | Move to different parent container |
| `figma_group_nodes` | Group nodes |
| `figma_ungroup_nodes` | Ungroup nodes |
| `figma_boolean_operation` | UNION, SUBTRACT, INTERSECT, EXCLUDE, FLATTEN |
| `figma_rename_node` | Rename nodes |
| `figma_delete_nodes` | Remove nodes |

### Design System

| Tool | Use |
|------|-----|
| `figma_create_paint_style` | Create color styles (use `/` for folders) |
| `figma_create_text_style` | Create typography styles |
| `figma_apply_style` | Apply a style to a node |
| `figma_create_variable_collection` | Create variable groups with modes |
| `figma_create_variable` | Create COLOR/FLOAT/STRING/BOOLEAN variables |
| `figma_set_variable` | Set value or bind variable to node property |
| `figma_unbind_variable` | Remove variable binding |
| `figma_rename_variable` | Rename a variable |
| `figma_delete_variables` | Delete variables |
| `figma_combine_as_variants` | Merge components into a variant set |
| `figma_add_component_property` | Add BOOLEAN/TEXT/VARIANT/INSTANCE_SWAP property |
| `figma_edit_component_property` | Modify property definition |
| `figma_delete_component_property` | Remove property definition |

### Page Management

| Tool | Use |
|------|-----|
| `figma_create_page` | New page |
| `figma_rename_page` | Rename page |
| `figma_delete_page` | Remove page |
| `figma_reorder_page` | Change page order |
| `figma_duplicate_page` | Clone entire page |
| `figma_move_to_page` | Move nodes between pages |

### Export

| Tool | Use |
|------|-----|
| `figma_export_node` | Export as PNG/SVG/JPG/PDF (returns base64) |
| `figma_set_dev_status` | Mark READY_FOR_DEV or COMPLETED |

## Gotchas & Constraints

- **Font loading is automatic** -- the bridge loads fonts before text operations, but fonts must be installed on the system. Inter is the default and ships with Figma.
- **Lines have height=0** -- use `length` parameter, not width/height.
- **Constraints vs layoutAlign** -- use `figma_set_layout_align` for auto-layout children, `figma_set_constraints` only for non-auto-layout frames.
- **Boolean operations require same parent** -- all nodes must share the same parent frame.
- **`detachInstance()` cascades** -- also detaches ancestor instances. Use with caution.
- **Vectors: no arc commands** -- only M, L, Q, C, Z supported in SVG path data.
- **Export returns base64** -- `figma_export_node` returns base64-encoded data.
- **Variable paint binding** -- for fills/strokes use `figma_set_variable` with `field: "fills"` and `paintIndex: 0`.
- **Polygons vs stars** -- use `innerRadius` (0-1) on `figma_create_polygon` for star shapes. Omit for regular polygons.
- **Reordering** -- use `figma_reorder_node` with `"front"`, `"back"`, or index. Children array is read-only.
- **Stickies, connectors, tables, shape_with_text, code_block** -- FigJam-only tools. They throw errors in Figma design files.
