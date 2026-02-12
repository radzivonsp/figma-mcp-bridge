# Effects: Shadows, Blurs, Blend Modes

## Drop Shadow

```
figma_set_effects({
  nodeId: "<id>",
  effects: [{
    type: "DROP_SHADOW",
    color: { color: "#00000026" },    // black at ~15% opacity
    offset: { x: 0, y: 4 },
    radius: 8,
    spread: 0,
    visible: true
  }]
})
```

## Shadow Presets

| Name | Offset (x,y) | Radius | Spread | Use |
|------|---------------|--------|--------|-----|
| sm | 0, 1 | 2 | 0 | Subtle lift (buttons, inputs) |
| md | 0, 4 | 6 | -1 | Cards, elevated surfaces |
| lg | 0, 10 | 15 | -3 | Dropdowns, popovers |
| xl | 0, 20 | 25 | -5 | Modals, dialogs |

All use color `#00000026` (~15% black) for a natural look.

## Layered Shadows (more realistic)

Combine two shadows for depth:

```
figma_set_effects({
  nodeId: "<id>",
  effects: [
    { type: "DROP_SHADOW", color: { color: "#0000001A" }, offset: { x: 0, y: 1 }, radius: 3, spread: 0, visible: true },
    { type: "DROP_SHADOW", color: { color: "#0000001A" }, offset: { x: 0, y: 4 }, radius: 8, spread: -2, visible: true }
  ]
})
```

## Inner Shadow

```
{ type: "INNER_SHADOW", color: { color: "#00000026" }, offset: { x: 0, y: 2 }, radius: 4, spread: 0, visible: true }
```

Used for inset effects (pressed buttons, input fields).

## Layer Blur

```
{ type: "LAYER_BLUR", radius: 10, visible: true }
```

Blurs the entire node.

## Background Blur (frosted glass)

```
{ type: "BACKGROUND_BLUR", radius: 16, visible: true }
```

Blurs content behind the node. Combine with a semi-transparent fill for a glass effect:

```
// 1. Set semi-transparent fill
figma_set_fills({ nodeId: "<id>", fills: { color: "#FFFFFF80" } })

// 2. Add background blur
figma_set_effects({ nodeId: "<id>", effects: [
  { type: "BACKGROUND_BLUR", radius: 16, visible: true }
] })
```

## Removing Effects

Pass an empty array:

```
figma_set_effects({ nodeId: "<id>", effects: [] })
```

## Blend Modes

```
figma_set_blend_mode({ nodeId: "<id>", blendMode: "MULTIPLY" })
```

### Available modes

| Category | Modes |
|----------|-------|
| Normal | `PASS_THROUGH`, `NORMAL` |
| Darken | `DARKEN`, `MULTIPLY`, `LINEAR_BURN`, `COLOR_BURN` |
| Lighten | `LIGHTEN`, `SCREEN`, `LINEAR_DODGE`, `COLOR_DODGE` |
| Contrast | `OVERLAY`, `SOFT_LIGHT`, `HARD_LIGHT` |
| Inversion | `DIFFERENCE`, `EXCLUSION` |
| Component | `HUE`, `SATURATION`, `COLOR`, `LUMINOSITY` |

Common ones:
- `MULTIPLY` -- darkens (good for overlaying on images)
- `SCREEN` -- lightens
- `OVERLAY` -- increases contrast
- `SOFT_LIGHT` -- subtle contrast
- `PASS_THROUGH` -- default for groups/frames (children blend independently)
