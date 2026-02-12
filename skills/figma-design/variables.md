# Variables & Theming

## Variable Collections

### Create a collection

```
figma_create_variable_collection({
  name: "Tokens",
  modes: ["Light", "Dark"]
})
```

### Manage modes

```
// Add a mode
figma_add_mode({ collectionId: "<id>", name: "High Contrast" })

// Rename a mode
figma_rename_mode({ collectionId: "<id>", modeId: "<mode-id>", name: "Dark" })

// Delete a mode (cannot delete last one)
figma_delete_mode({ collectionId: "<id>", modeId: "<mode-id>" })
```

### Rename / delete collections

```
figma_rename_variable_collection({ collectionId: "<id>", name: "Design Tokens" })
figma_delete_variable_collection({ collectionId: "<id>" })  // deletes all variables inside
```

## Creating Variables

### Color variable

```
figma_create_variable({
  collectionId: "<id>",
  name: "colors/primary",      // "/" creates groups in the variables panel
  type: "COLOR",
  value: { color: "#3B82F6" },
  scopes: ["ALL_FILLS", "STROKE_COLOR"],
  description: "Primary brand color"
})
```

### Number variable (spacing, sizing, radius)

```
figma_create_variable({
  collectionId: "<id>",
  name: "spacing/md",
  type: "FLOAT",
  value: 16,
  scopes: ["GAP", "WIDTH_HEIGHT"]
})
```

### String and boolean variables

```
figma_create_variable({ collectionId: "<id>", name: "labels/cta", type: "STRING", value: "Get Started" })
figma_create_variable({ collectionId: "<id>", name: "flags/show-banner", type: "BOOLEAN", value: true })
```

### Variable scopes

Scopes control where a variable can be used:

| Scope | Where It Applies |
|-------|-----------------|
| `ALL_SCOPES` | Everywhere |
| `ALL_FILLS` | All fill properties |
| `FRAME_FILL` | Frame fills only |
| `SHAPE_FILL` | Shape fills only |
| `TEXT_FILL` | Text fills only |
| `STROKE_COLOR` | Strokes |
| `TEXT_CONTENT` | Text content |
| `CORNER_RADIUS` | Corner radius |
| `WIDTH_HEIGHT` | Width and height |
| `GAP` | Auto-layout spacing |
| `OPACITY` | Opacity |
| `FONT_FAMILY`, `FONT_STYLE`, `FONT_SIZE` | Typography |
| `LINE_HEIGHT`, `LETTER_SPACING` | Text spacing |
| `EFFECT_FLOAT`, `EFFECT_COLOR` | Effects |

## Setting Values Per Mode

```
figma_set_variable({
  variableId: "<id>",
  modeId: "<dark-mode-id>",
  value: { color: "#60A5FA" }
})
```

## Binding Variables to Nodes

### Bind to fills

```
figma_set_variable({
  variableId: "<color-var-id>",
  nodeId: "<node-id>",
  field: "fills",
  paintIndex: 0          // index in the fills array (usually 0)
})
```

### Bind to strokes

```
figma_set_variable({
  variableId: "<color-var-id>",
  nodeId: "<node-id>",
  field: "strokes",
  paintIndex: 0
})
```

### Bind to other properties

```
figma_set_variable({
  variableId: "<float-var-id>",
  nodeId: "<node-id>",
  field: "cornerRadius"
})
```

Bindable fields: `fills`, `strokes`, `opacity`, `cornerRadius`, and more.

### Unbind a variable

```
figma_unbind_variable({ nodeId: "<id>", field: "fills", paintIndex: 0 })
```

## Searching Variables

### By name pattern (PREFERRED -- ~500 tokens vs 25k+)

```
figma_search_variables({
  namePattern: "colors/*",
  type: "COLOR",
  compact: true,
  limit: 50
})
```

### By substring

```
figma_search_variables({ nameContains: "primary" })
```

### By collection

```
figma_search_variables({ collectionName: "Tokens", type: "ALL" })
```

## Variable Aliases

Aliases let a variable reference another variable instead of a direct value. This is how semantic tokens work.

```
figma_create_variable({
  collectionId: "<id>",
  name: "semantic/bg-primary",
  type: "COLOR",
  aliasOf: "<primitive-color-var-id>"
})
```

## Light/Dark Theme Pattern

1. **Create collection** with Light and Dark modes
2. **Create primitive variables** (the raw palette):
   - `colors/blue-500` = #3B82F6
   - `colors/gray-100` = #F3F4F6
   - `colors/gray-900` = #111827
3. **Create semantic variables** that alias primitives:
   - `bg/primary` → aliases `colors/white` in Light mode, `colors/gray-900` in Dark mode
   - `text/primary` → aliases `colors/gray-900` in Light, `colors/gray-100` in Dark
   - `accent/primary` → aliases `colors/blue-500` in both modes
4. **Set per-mode values** using `figma_set_variable` with different `modeId` values
5. **Bind semantic variables** to node properties (fills, strokes, etc.)

When the mode changes in Figma, all bound properties update automatically.

## Rename / Delete Variables

```
figma_rename_variable({ variableId: "<id>", name: "colors/brand-blue" })
figma_delete_variables({ variableIds: ["<id1>", "<id2>"] })
```
