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
3. **Plan the layout on a grid BEFORE creating anything.** Calculate all x/y positions upfront using the sizing and spacing rules below. Write down the coordinates for every element.
4. Build content using FigJam-specific tools: stickies, shapes, connectors, tables, code blocks, sections.
5. Screenshot with `mcp__figma-desktop__get_screenshot` after each major step.
6. Iterate based on visual feedback.

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
- `figma_create_text` — standalone text nodes (for titles, labels, annotations)
- `figma_create_rectangle`, `figma_create_ellipse`, `figma_create_line` — basic shapes
- `figma_move_nodes`, `figma_resize_nodes`, `figma_delete_nodes` — manipulation
- `figma_set_fills`, `figma_set_strokes`, `figma_set_text` — styling
- `figma_rename_node`, `figma_group_nodes` — organization

## Layout Rules (CRITICAL — prevents overlapping)

FigJam has NO auto-layout. Every element is placed with absolute x/y coordinates. You MUST calculate positions carefully.

### Default Element Sizes

| Element | Default Width | Default Height | Notes |
|---|---|---|---|
| Sticky | 240 | 240 | Fixed, cannot resize. Expands vertically for long text |
| Shape with text | 200 | 200 | Varies by shape type. Diamonds are ~200x200 |
| Code block | 300 | varies | Height depends on code length |
| Table | varies | varies | ~160px per column, ~48px per row |

### Spacing Constants

Use these consistently. NEVER place elements without calculating gaps.

| Constant | Value | Use |
|---|---|---|
| **ELEMENT_GAP** | 60 | Minimum gap between any two unrelated elements |
| **STICKY_PITCH** | 300 | Distance between sticky centers (240 + 60 gap) |
| **SHAPE_PITCH** | 260 | Distance between shape centers (200 + 60 gap) |
| **ROW_PITCH** | 300 | Distance between flowchart rows |
| **SECTION_PADDING** | 40 | Padding inside sections |
| **LABEL_OFFSET** | -40 | Y offset for title text above a group of elements |

### Grid Layout Patterns

#### Stickies in a row

```
x = startX + (columnIndex * 300)    // STICKY_PITCH = 300
y = startY
```

Example: 4 stickies in a row starting at (100, 100):

| Sticky | x | y |
|--------|---|---|
| 1 | 100 | 100 |
| 2 | 400 | 100 |
| 3 | 700 | 100 |
| 4 | 1000 | 100 |

#### Stickies in a grid (rows + columns)

```
x = startX + (col * 300)    // STICKY_PITCH
y = startY + (row * 300)    // STICKY_PITCH
```

#### Flowchart shapes vertically (top to bottom)

```
x = centerX - 100           // center the 200px-wide shape
y = startY + (rowIndex * 300)  // ROW_PITCH = 300
```

#### Flowchart shapes horizontally (left to right)

```
x = startX + (colIndex * 260)  // SHAPE_PITCH = 260
y = centerY - 100              // center the 200px-tall shape
```

#### Decision branch (diamond with yes/no paths)

```
Diamond:       x=400, y=0
"Yes" shape:   x=700, y=0      (right of diamond, same y)
"No" shape:    x=400, y=300    (below diamond, same x)
```

### Positioning Title/Label Text

Place titles ABOVE their group, not on top of elements:

```
// Title for a section of stickies starting at y=200
figma_create_text({ text: "Ideas", fontSize: 24, fontStyle: "Bold", x: startX, y: 150 })
// Then stickies at y=200+
```

Use `LABEL_OFFSET = -40` from the top edge of the first element:

```
titleY = firstElementY - 40 - textHeight   // typically firstElementY - 70
```

### Section Sizing

Sections must be large enough to contain all children with padding:

```
sectionWidth  = (numColumns * STICKY_PITCH) - ELEMENT_GAP + (2 * SECTION_PADDING)
sectionHeight = (numRows * STICKY_PITCH) - ELEMENT_GAP + (2 * SECTION_PADDING) + titleSpace

// Children inside the section use offsets relative to section position:
childX = SECTION_PADDING
childY = SECTION_PADDING + titleSpace   // ~60px for the section title
```

Example: section for 3x2 stickies:

```
figma_create_section({ name: "Topic A", x: 0, y: 0, width: 960, height: 720 })
// Stickies inside:
// (40, 60), (340, 60), (640, 60)     — row 1
// (40, 360), (340, 360), (640, 360)  — row 2
```

## Patterns

### Sticky note

```
figma_create_sticky({ text: "Idea here", color: "YELLOW", x: 0, y: 0 })
```

### Flowchart (vertical, top to bottom)

Calculate ALL positions first, then create all shapes, then connect:

```
Step 1: Plan positions
  Start:     x=0, y=0       (ELLIPSE)
  Process A: x=0, y=300     (ROUNDED_RECTANGLE)
  Decision:  x=0, y=600     (DIAMOND)
  Process B: x=0, y=900     (ROUNDED_RECTANGLE)  — "yes" path, below
  Process C: x=300, y=600   (ROUNDED_RECTANGLE)  — "no" path, right
  End:       x=0, y=1200    (ELLIPSE)

Step 2: Create shapes
  figma_create_shape_with_text({ shapeType: "ELLIPSE", text: "Start", x: 0, y: 0 })
  figma_create_shape_with_text({ shapeType: "ROUNDED_RECTANGLE", text: "Process A", x: 0, y: 300 })
  figma_create_shape_with_text({ shapeType: "DIAMOND", text: "Valid?", x: 0, y: 600 })
  figma_create_shape_with_text({ shapeType: "ROUNDED_RECTANGLE", text: "Process B", x: 0, y: 900 })
  figma_create_shape_with_text({ shapeType: "ROUNDED_RECTANGLE", text: "Process C", x: 300, y: 600 })
  figma_create_shape_with_text({ shapeType: "ELLIPSE", text: "End", x: 0, y: 1200 })

Step 3: Connect
  figma_create_connector({ startNodeId: "<start>", endNodeId: "<processA>", startMagnet: "BOTTOM", endMagnet: "TOP" })
  figma_create_connector({ startNodeId: "<processA>", endNodeId: "<decision>", startMagnet: "BOTTOM", endMagnet: "TOP" })
  figma_create_connector({ startNodeId: "<decision>", endNodeId: "<processB>", text: "Yes", startMagnet: "BOTTOM", endMagnet: "TOP" })
  figma_create_connector({ startNodeId: "<decision>", endNodeId: "<processC>", text: "No", startMagnet: "RIGHT", endMagnet: "LEFT" })
  figma_create_connector({ startNodeId: "<processB>", endNodeId: "<end>", startMagnet: "BOTTOM", endMagnet: "TOP" })
```

### Brainstorm cluster with section

```
// 1. Section sized for 3 stickies in a row
figma_create_section({ name: "Topic A", x: 0, y: 0, width: 960, height: 420 })

// 2. Stickies inside (offset by section padding + title space)
figma_create_sticky({ text: "Idea 1", color: "YELLOW", x: 40, y: 60, parentId: "<section>" })
figma_create_sticky({ text: "Idea 2", color: "YELLOW", x: 340, y: 60, parentId: "<section>" })
figma_create_sticky({ text: "Idea 3", color: "YELLOW", x: 640, y: 60, parentId: "<section>" })
```

### Multiple brainstorm sections (side by side)

```
// Section A: x=0
figma_create_section({ name: "Pros", x: 0, y: 0, width: 960, height: 420 })

// Section B: x = 960 + 60 (ELEMENT_GAP) = 1020
figma_create_section({ name: "Cons", x: 1020, y: 0, width: 960, height: 420 })
```

### Table

```
figma_create_table({ rows: 4, columns: 3, x: 0, y: 0 })
```

### Code block

```
figma_create_code_block({ code: "const x = 1;", language: "JAVASCRIPT", x: 0, y: 0 })
```

### Standalone label / annotation

```
figma_create_text({ text: "System Architecture", fontSize: 32, fontStyle: "Bold", x: 0, y: 0 })
// First element starts below: y = 60 (text height ~32 + gap ~28)
```

## Connector Reference

**Connector types:**
- `ELBOWED` — right-angle lines (default, best for flowcharts)
- `STRAIGHT` — direct line between endpoints
- `CURVED` — smooth curved line

**Magnet positions** (where the connector attaches):
- `AUTO` — Figma picks the closest edge (default)
- `TOP`, `BOTTOM`, `LEFT`, `RIGHT` — specific edge
- `CENTER`, `NONE` — center point or unattached

**Use explicit magnets for flowcharts:**
- Vertical flow: start=`BOTTOM`, end=`TOP`
- Horizontal branch: start=`RIGHT`, end=`LEFT` (or `LEFT`→`RIGHT`)
- Use `AUTO` only when the direction is ambiguous

**STRAIGHT connector constraint:** STRAIGHT connectors only accept `CENTER` or `NONE` magnets. Other values are auto-corrected to `CENTER` by the bridge.

## FigJam Limitations & Gotchas

- **No auto-layout** — you MUST calculate all x/y positions manually
- Cannot create multiple pages
- Cannot create new components (use existing only)
- Cannot manage local styles
- **Stickies cannot be edited** — `figma_set_text` does NOT work on stickies (they are STICKY nodes, not TEXT nodes). To change sticky text, delete and recreate.
- **Stickies cannot be resized** — default is 240x240px. They auto-expand vertically for long text but cannot be manually sized.
- **FigJam-only tools fail in Figma design files** — `create_sticky`, `create_connector`, `create_table`, `create_shape_with_text`, `create_code_block` throw errors in regular Figma files. Always verify `editorType: "figjam"` first.
- **Deleting connector endpoints cascades** — deleting a node also deletes connectors attached to it.
- **Shapes inside sections** — when placing elements inside a section (via `parentId`), x/y are relative to the section's top-left corner, NOT the canvas.
