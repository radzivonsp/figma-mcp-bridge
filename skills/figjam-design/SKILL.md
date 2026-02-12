---
name: figjam-design
description: Creates and edits FigJam boards — stickies, connectors, flowcharts, tables, code blocks, and diagrams. Use when user asks to brainstorm, diagram, create flowcharts, or whiteboard in FigJam.
allowed-tools: mcp__figma-mcp-bridge__*, mcp__figma-desktop__get_screenshot, mcp__figma-desktop__get_metadata, mcp__figma-desktop__get_design_context
---

# FigJam Design Builder

## References

- @shapes.md — FigJam shape types for flowcharts and diagrams

## Workflow

1. Call `figma_server_info`. If not connected, tell user to run the plugin. Note: the MCP server port can change on restart — if connected shows false but user says plugin is running, ask them to update the port in the plugin to match.
2. Confirm the open file is a FigJam file (editorType: figjam).
3. Build content using FigJam-specific tools: stickies, shapes, connectors, tables, code blocks, sections.
4. Screenshot with `mcp__figma-desktop__get_screenshot` after each major step.
5. Iterate based on visual feedback.

## FigJam Tools

| Tool | Description |
|---|---|
| `figma_create_sticky` | Sticky notes with color and text |
| `figma_create_shape_with_text` | Flowchart shapes (diamond, rectangle, ellipse, etc.) with text |
| `figma_create_connector` | Lines connecting two nodes at endpoints |
| `figma_create_table` | Tables with rows and columns |
| `figma_create_code_block` | Code snippets with syntax highlighting |
| `figma_create_section` | Sections to organize groups of items |

## Also Available

These standard tools work in FigJam too:

- `figma_create_frame` — container frames
- `figma_create_text` — standalone text nodes
- `figma_create_rectangle`, `figma_create_ellipse`, `figma_create_line` — basic shapes
- `figma_move_nodes`, `figma_resize_nodes`, `figma_delete_nodes` — manipulation
- `figma_set_fills`, `figma_set_strokes`, `figma_set_text` — styling
- `figma_rename_node`, `figma_group_nodes` — organization

## FigJam Limitations & Gotchas

- Cannot create multiple pages
- Cannot create new components (use existing only)
- Cannot manage local styles
- No auto-layout support on FigJam nodes
- **Stickies cannot be edited** — `figma_set_text` does NOT work on stickies (they are STICKY nodes, not TEXT nodes). To change sticky text, delete and recreate the sticky.
- **Stickies cannot be resized** — `figma_resize_nodes` does not work on stickies. Default size is 240x240px. They auto-expand for long text but cannot be manually sized via API.
- **FigJam-only tools fail in Figma design files** — `create_sticky`, `create_connector`, `create_table`, `create_shape_with_text`, `create_code_block` throw "not a function" errors in regular Figma files. Always verify `editorType: "figjam"` first.
- **Deleting connector endpoints cascades** — deleting a node also deletes any connectors attached to it.

## Patterns

### Sticky note
```
figma_create_sticky({ text: "Idea here", color: "YELLOW", x: 0, y: 0 })
```

### Flowchart
1. Create shapes: `figma_create_shape_with_text({ shapeType: "ROUNDED_RECTANGLE", text: "Start" })`
2. Create decision: `figma_create_shape_with_text({ shapeType: "DIAMOND", text: "Condition?" })`
3. Connect them: `figma_create_connector({ startNodeId: "...", endNodeId: "...", text: "Yes" })`

### Brainstorm cluster
1. Create section: `figma_create_section({ name: "Topic A", width: 600, height: 400 })`
2. Add stickies inside, spacing them ~260px apart (sticky default is 240x240px)

### Table
```
figma_create_table({ rows: 4, columns: 3, x: 0, y: 0 })
```

### Code block
```
figma_create_code_block({ code: "const x = 1;", language: "JAVASCRIPT" })
```

### Connector reference

**Connector types:**
- `ELBOWED` — right-angle lines (default, best for flowcharts)
- `STRAIGHT` — direct line between endpoints
- `CURVED` — smooth curved line

**Magnet positions** (where the connector attaches):
- `AUTO` — Figma picks the closest edge (default)
- `TOP`, `BOTTOM`, `LEFT`, `RIGHT` — specific edge
- `CENTER`, `NONE` — center point or unattached

**STRAIGHT connector constraint:** STRAIGHT connectors only accept `CENTER` or `NONE` magnets. Other values are auto-corrected to `CENTER` by the bridge.
