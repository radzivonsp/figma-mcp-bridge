# Auto-Layout Patterns

## Enabling Auto-Layout

```
figma_set_auto_layout({
  nodeId: "<frame-id>",
  layoutMode: "VERTICAL",         // HORIZONTAL | VERTICAL | NONE (disable)
  primaryAxisSizingMode: "AUTO",  // AUTO (hug content) | FIXED
  counterAxisSizingMode: "AUTO",  // AUTO (hug content) | FIXED
  itemSpacing: 16,
  paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24
})
```

## Sizing Modes

| Primary | Counter | Behavior | Use Case |
|---------|---------|----------|----------|
| FIXED | FIXED | Exact dimensions, children may overflow | Fixed-size containers |
| AUTO | AUTO | Hugs children on both axes | Buttons, tags, badges |
| FIXED | AUTO | Fixed width, height wraps content | Cards, list items |
| AUTO | FIXED | Width wraps, fixed height | Horizontal scrolling rows |

**Figma terminology:**
- AUTO = "Hug contents" in the UI
- FIXED = explicit width/height set on the frame
- layoutGrow=1 on a child = "Fill container" on the primary axis
- layoutAlign="STRETCH" on a child = "Fill container" on the counter axis

## Alignment

```
primaryAxisAlignItems:  MIN | CENTER | MAX | SPACE_BETWEEN
counterAxisAlignItems:  MIN | CENTER | MAX | BASELINE
```

### Common combos

| Pattern | Primary | Counter |
|---------|---------|---------|
| Top-left (default) | MIN | MIN |
| Centered | CENTER | CENTER |
| Space between (nav bar) | SPACE_BETWEEN | CENTER |
| Bottom-right | MAX | MAX |
| Baseline text alignment | MIN | BASELINE |

## Child Behavior

Use `figma_set_layout_align` to control how a child behaves inside an auto-layout parent:

```
figma_set_layout_align({
  nodeId: "<child-id>",
  layoutAlign: "STRETCH",  // Fill container on the counter axis
  layoutGrow: 1            // Fill available space on the primary axis (0=fixed, 1=fill)
})
```

### Fill container

- `layoutAlign: "STRETCH"` -- child fills the **counter-axis** dimension (e.g., full width in a VERTICAL layout)
- `layoutGrow: 1` -- child fills remaining **primary-axis** space (e.g., stretches vertically in a VERTICAL layout)
- Combine both for a child that fills all available space

### Absolute positioning inside auto-layout

```
figma_set_layout_align({
  nodeId: "<child-id>",
  layoutPositioning: "ABSOLUTE"
})
```

Then use `figma_move_nodes` to position it manually. The child is removed from the flow but stays inside the frame. Useful for badges, close buttons, or overlays.

## Wrap Layout (flex-wrap)

```
figma_set_auto_layout({
  nodeId: "<frame-id>",
  layoutMode: "HORIZONTAL",
  layoutWrap: "WRAP",
  itemSpacing: 12,           // gap between items in a row
  counterAxisSpacing: 12     // gap between wrapped rows
})
```

## Common Patterns

### Vertical stack (card content)
```
layoutMode: "VERTICAL"
itemSpacing: 12
paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16
primaryAxisSizingMode: "AUTO"    // height hugs content
counterAxisSizingMode: "FIXED"   // fixed width
```

### Horizontal row (button group, tabs)
```
layoutMode: "HORIZONTAL"
itemSpacing: 8
primaryAxisSizingMode: "AUTO"    // width hugs content
counterAxisSizingMode: "AUTO"    // height hugs content
counterAxisAlignItems: "CENTER"
```

### Full-width container (page section)
```
layoutMode: "VERTICAL"
counterAxisSizingMode: "FIXED"   // set width explicitly
```
Then on each child: `layoutAlign: "STRETCH"` so they fill the width.

### Centered content (hero section)
```
layoutMode: "VERTICAL"
primaryAxisAlignItems: "CENTER"
counterAxisAlignItems: "CENTER"
```

### Space-between header
```
layoutMode: "HORIZONTAL"
primaryAxisAlignItems: "SPACE_BETWEEN"
counterAxisAlignItems: "CENTER"
paddingLeft: 24, paddingRight: 24
```

### Grid of items (wrap)
```
layoutMode: "HORIZONTAL"
layoutWrap: "WRAP"
itemSpacing: 24
counterAxisSpacing: 24
paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24
```

## Nested Auto-Layout

Most UI designs use nested auto-layout frames. Example: a card is a VERTICAL stack, containing a HORIZONTAL header row, a VERTICAL content area, and a HORIZONTAL button row. Each nested frame has its own layout settings.

Build from the inside out:
1. Create the innermost content first
2. Wrap in auto-layout frames
3. Set sizing and alignment at each level
