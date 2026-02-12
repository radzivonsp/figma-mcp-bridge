# Common Design Recipes

## Card Component

```
// 1. Create card frame
figma_create_frame({ name: "Card", width: 320, height: 400, fills: { color: "#FFFFFF" } })

// 2. Set vertical auto-layout
figma_set_auto_layout({
  nodeId: "<card-id>",
  layoutMode: "VERTICAL",
  itemSpacing: 0,
  primaryAxisSizingMode: "AUTO",     // height hugs content
  counterAxisSizingMode: "FIXED"     // fixed width
})

// 3. Image placeholder (fills card width)
figma_create_rectangle({ name: "Image", width: 320, height: 200, fills: { color: "#E5E7EB" }, parentId: "<card-id>" })
figma_set_layout_align({ nodeId: "<image-id>", layoutAlign: "STRETCH" })

// 4. Content area with padding
figma_create_frame({ name: "Content", parentId: "<card-id>" })
figma_set_auto_layout({
  nodeId: "<content-id>",
  layoutMode: "VERTICAL",
  paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16,
  itemSpacing: 8,
  primaryAxisSizingMode: "AUTO",
  counterAxisSizingMode: "AUTO"
})
figma_set_layout_align({ nodeId: "<content-id>", layoutAlign: "STRETCH", layoutGrow: 1 })
figma_set_fills({ nodeId: "<content-id>", fills: [] })  // transparent

// 5. Add text
figma_create_text({ text: "Card Title", fontSize: 18, fontStyle: "SemiBold", parentId: "<content-id>" })
figma_create_text({ text: "Description text goes here.", fontSize: 14, fills: { color: "#6B7280" }, parentId: "<content-id>" })

// 6. Style the card
figma_set_corner_radius({ nodeId: "<card-id>", radius: 12 })
figma_set_effects({ nodeId: "<card-id>", effects: [
  { type: "DROP_SHADOW", color: { color: "#0000001A" }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true },
  { type: "DROP_SHADOW", color: { color: "#0000001A" }, offset: { x: 0, y: 4 }, radius: 8, spread: -2, visible: true }
] })

// 7. Convert to component
figma_create_component({ fromNodeId: "<card-id>" })
```

## Button Component

```
// 1. Create button frame
figma_create_frame({ name: "Button", fills: { color: "#3B82F6" } })

// 2. Horizontal auto-layout (hug content)
figma_set_auto_layout({
  nodeId: "<button-id>",
  layoutMode: "HORIZONTAL",
  itemSpacing: 8,
  paddingTop: 10, paddingRight: 16, paddingBottom: 10, paddingLeft: 16,
  primaryAxisSizingMode: "AUTO",
  counterAxisSizingMode: "AUTO",
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER"
})

// 3. Add label
figma_create_text({ text: "Button", fontSize: 14, fontStyle: "Medium", fills: { color: "#FFFFFF" }, parentId: "<button-id>" })

// 4. Style
figma_set_corner_radius({ nodeId: "<button-id>", radius: 8 })

// 5. Convert to component
figma_create_component({ fromNodeId: "<button-id>" })
```

## Navigation Bar

```
// 1. Create nav frame (full width)
figma_create_frame({ name: "Nav", width: 1440, height: 64, fills: { color: "#FFFFFF" } })

// 2. Horizontal layout, space-between
figma_set_auto_layout({
  nodeId: "<nav-id>",
  layoutMode: "HORIZONTAL",
  primaryAxisAlignItems: "SPACE_BETWEEN",
  counterAxisAlignItems: "CENTER",
  paddingLeft: 24, paddingRight: 24,
  counterAxisSizingMode: "FIXED"
})

// 3. Logo
figma_create_text({ text: "Logo", fontSize: 20, fontStyle: "Bold", parentId: "<nav-id>" })

// 4. Links container
figma_create_frame({ name: "Links", parentId: "<nav-id>" })
figma_set_auto_layout({ nodeId: "<links-id>", layoutMode: "HORIZONTAL", itemSpacing: 24, counterAxisAlignItems: "CENTER" })
figma_set_fills({ nodeId: "<links-id>", fills: [] })

// 5. Add nav links
figma_create_text({ text: "Home", fontSize: 14, fontStyle: "Medium", parentId: "<links-id>" })
figma_create_text({ text: "About", fontSize: 14, parentId: "<links-id>" })
figma_create_text({ text: "Contact", fontSize: 14, parentId: "<links-id>" })

// 6. Bottom border
figma_set_strokes({ nodeId: "<nav-id>", strokes: { color: "#E5E7EB" }, strokeWeight: 1 })
```

## Responsive Frame Setup

### Standard breakpoints

```
// Desktop
figma_create_frame({ name: "Desktop - 1440", width: 1440, height: 900 })

// Tablet
figma_create_frame({ name: "Tablet - 768", width: 768, height: 1024 })

// Mobile
figma_create_frame({ name: "Mobile - 375", width: 375, height: 812 })
```

### Adding a layout grid to a frame

```
figma_set_layout_grids({
  nodeId: "<desktop-frame-id>",
  layoutGrids: [{
    pattern: "COLUMNS",
    alignment: "STRETCH",
    count: 12,
    gutterSize: 24,
    offset: 64,
    visible: true,
    color: { r: 1, g: 0, b: 0, a: 0.1 }
  }]
})
```

### Common grid configurations

| Breakpoint | Columns | Gutter | Margin |
|------------|---------|--------|--------|
| Desktop 1440 | 12 | 24px | 64px |
| Tablet 768 | 8 | 16px | 32px |
| Mobile 375 | 4 | 16px | 16px |

## Grid of Cards (wrap layout)

```
// 1. Create container
figma_create_frame({ name: "Card Grid", width: 1200 })

// 2. Wrap auto-layout
figma_set_auto_layout({
  nodeId: "<grid-id>",
  layoutMode: "HORIZONTAL",
  layoutWrap: "WRAP",
  itemSpacing: 24,
  counterAxisSpacing: 24,
  paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24,
  primaryAxisSizingMode: "FIXED",
  counterAxisSizingMode: "AUTO"
})

// 3. Add card instances
figma_create_instance({ componentId: "<card-component-id>", parentId: "<grid-id>" })
figma_create_instance({ componentId: "<card-component-id>", parentId: "<grid-id>" })
figma_create_instance({ componentId: "<card-component-id>", parentId: "<grid-id>" })
```

## Input Field

```
// 1. Create input frame
figma_create_frame({ name: "Input", width: 320, height: 40, fills: { color: "#FFFFFF" } })

// 2. Horizontal auto-layout
figma_set_auto_layout({
  nodeId: "<input-id>",
  layoutMode: "HORIZONTAL",
  paddingTop: 8, paddingRight: 12, paddingBottom: 8, paddingLeft: 12,
  counterAxisAlignItems: "CENTER",
  primaryAxisSizingMode: "FIXED",
  counterAxisSizingMode: "FIXED"
})

// 3. Placeholder text
figma_create_text({ text: "Enter text...", fontSize: 14, fills: { color: "#9CA3AF" }, parentId: "<input-id>" })
figma_set_layout_align({ nodeId: "<text-id>", layoutGrow: 1 })

// 4. Border and radius
figma_set_strokes({ nodeId: "<input-id>", strokes: { color: "#D1D5DB" }, strokeWeight: 1 })
figma_set_corner_radius({ nodeId: "<input-id>", radius: 6 })
```

## Page Section (hero, feature block)

```
// 1. Full-width section
figma_create_frame({ name: "Hero Section", width: 1440, fills: { color: "#F9FAFB" } })

// 2. Vertical layout, centered
figma_set_auto_layout({
  nodeId: "<section-id>",
  layoutMode: "VERTICAL",
  primaryAxisAlignItems: "CENTER",
  counterAxisAlignItems: "CENTER",
  paddingTop: 96, paddingRight: 64, paddingBottom: 96, paddingLeft: 64,
  itemSpacing: 24,
  primaryAxisSizingMode: "AUTO",
  counterAxisSizingMode: "FIXED"
})

// 3. Content
figma_create_text({ text: "Welcome to Our Product", fontSize: 48, fontStyle: "Bold", parentId: "<section-id>" })
figma_create_text({ text: "A short description of what this product does and why it matters.", fontSize: 18, fills: { color: "#6B7280" }, parentId: "<section-id>" })
```
