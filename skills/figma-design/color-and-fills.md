# Color & Fills

## Color Formats

### Hex (simplest, preferred)

```
figma_set_fills({ nodeId: "<id>", fills: { color: "#3B82F6" } })
figma_set_fills({ nodeId: "<id>", fills: { color: "#3B82F680" } })  // with alpha (50%)
```

### RGB (0-1 range, NOT 0-255)

```
figma_set_fills({ nodeId: "<id>", fills: { r: 0.231, g: 0.51, b: 0.965 } })
figma_set_fills({ nodeId: "<id>", fills: { r: 0.231, g: 0.51, b: 0.965, a: 0.5 } })
```

### Full fills array (for multiple fills or advanced control)

```
figma_set_fills({ nodeId: "<id>", fills: [
  { type: "SOLID", color: { r: 1, g: 0, b: 0 }, opacity: 0.5 }
] })
```

### Remove all fills

```
figma_set_fills({ nodeId: "<id>", fills: [] })
```

## Strokes

```
figma_set_strokes({ nodeId: "<id>", strokes: { color: "#E5E7EB" }, strokeWeight: 1 })
```

Same color formats as fills. Use `strokeWeight` for border thickness.

## Opacity (node-level)

```
figma_set_opacity({ nodeId: "<id>", opacity: 0.8 })
```

This affects the entire node including children. For transparent fills only, use fill alpha instead.

## Creating Paint Styles

```
figma_create_paint_style({
  name: "Brand/Primary",         // "/" creates folders in the styles panel
  fills: { color: "#3B82F6" },
  description: "Primary brand blue"
})
```

## Applying Paint Styles

1. Find the style:
   ```
   figma_search_styles({ nameContains: "Primary", type: "PAINT" })
   ```
2. Apply to fills or strokes:
   ```
   figma_apply_style({ nodeId: "<id>", styleId: "<style-id>", property: "fills" })
   figma_apply_style({ nodeId: "<id>", styleId: "<style-id>", property: "strokes" })
   ```

## Common Color Scales

### Light/Dark theme pairs

| Role | Light | Dark |
|------|-------|------|
| Background | `#FFFFFF` | `#1A1A2E` |
| Surface | `#F9FAFB` | `#252542` |
| Border | `#E5E7EB` | `#3D3D5C` |
| Text Primary | `#111827` | `#F9FAFB` |
| Text Secondary | `#6B7280` | `#9CA3AF` |
| Primary | `#3B82F6` | `#60A5FA` |
| Error | `#EF4444` | `#F87171` |
| Success | `#10B981` | `#34D399` |
| Warning | `#F59E0B` | `#FBBF24` |

### Neutral scale (gray)

| Weight | Hex |
|--------|-----|
| 50 | `#F9FAFB` |
| 100 | `#F3F4F6` |
| 200 | `#E5E7EB` |
| 300 | `#D1D5DB` |
| 400 | `#9CA3AF` |
| 500 | `#6B7280` |
| 600 | `#4B5563` |
| 700 | `#374151` |
| 800 | `#1F2937` |
| 900 | `#111827` |

## Color on Text Nodes

Text fill colors work the same way:

```
figma_set_fills({ nodeId: "<text-id>", fills: { color: "#6B7280" } })
```

Or set during creation:

```
figma_create_text({ text: "Secondary", fills: { color: "#6B7280" }, parentId: "<id>" })
```
