# Components & Instances

## Creating a Component

### From scratch (empty component frame)

```
figma_create_component({
  name: "Button",
  x: 0, y: 0, width: 120, height: 40,
  fills: { color: "#3B82F6" },
  description: "Primary action button"
})
```

### From existing node (PREFERRED -- build the frame first, then convert)

```
figma_create_component({ fromNodeId: "<frame-id>" })
```

## Creating Instances

```
figma_create_instance({
  componentId: "<component-id>",
  x: 200, y: 0,
  parentId: "<frame-id>"
})
```

Find components first with: `figma_search_components({ nameContains: "Button" })`

## Component Properties

### Reading properties on an instance

```
figma_get_nodes({ nodeIds: ["<instance-id>"], depth: "full" })
```

Look for `componentProperties` in the response. Each property has a name, type, value, and for BOOLEAN/TEXT/INSTANCE_SWAP an `#id` suffix.

### Adding properties to a component

```
// Boolean toggle
figma_add_component_property({
  componentId: "<id>",
  propertyName: "Show Icon",
  type: "BOOLEAN",
  defaultValue: true
})

// Text override
figma_add_component_property({
  componentId: "<id>",
  propertyName: "Label",
  type: "TEXT",
  defaultValue: "Button"
})

// Variant property (for component sets)
figma_add_component_property({
  componentId: "<id>",
  propertyName: "Size",
  type: "VARIANT",
  defaultValue: "Medium"
})

// Instance swap
figma_add_component_property({
  componentId: "<id>",
  propertyName: "Icon",
  type: "INSTANCE_SWAP",
  defaultValue: "<default-component-id>"
})
```

### Setting properties on an instance

```
figma_set_properties({
  nodeId: "<instance-id>",
  properties: {
    "Size": "Large",              // VARIANT: name only (no #id suffix)
    "Show Icon#0:1": false,       // BOOLEAN: name#id
    "Label#0:2": "Submit",        // TEXT: name#id
    "Icon#0:3": "<component-id>"  // INSTANCE_SWAP: name#id, value is component ID
  }
})
```

**Important:** VARIANT properties use just the name. BOOLEAN, TEXT, and INSTANCE_SWAP use `name#id` format. Get the exact names from `figma_get_nodes` with `depth: "full"`.

### Editing property definitions

```
figma_edit_component_property({
  componentId: "<id>",
  propertyName: "Label#0:2",      // current name with #id suffix
  newName: "Button Text",
  newDefaultValue: "Click me"
})
```

### Deleting a property

```
figma_delete_component_property({
  componentId: "<id>",
  propertyName: "Show Icon#0:1"
})
```

## Variants

### Creating a variant set

1. Create multiple components with variant naming convention (`Property=Value`):
   ```
   figma_create_component({ name: "Size=Small", ... })
   figma_create_component({ name: "Size=Medium", ... })
   figma_create_component({ name: "Size=Large", ... })
   ```

2. Combine into a component set:
   ```
   figma_combine_as_variants({ componentIds: ["<id1>", "<id2>", "<id3>"] })
   ```

This creates a component set where each original component becomes a variant.

### Multi-axis variants

Use comma-separated naming: `Size=Small, State=Default`

## Instance Operations

### Swap to a different component

```
figma_swap_instance({ instanceId: "<id>", newComponentId: "<new-component-id>" })
```

Preserves position and size.

### Detach from component

```
figma_detach_instance({ nodeId: "<id>" })
```

**WARNING:** This cascades -- also detaches ancestor instances. The node becomes a regular frame.

## Finding Components

```
// By name
figma_search_components({ nameContains: "Button" })

// Including variants
figma_search_components({ nameContains: "Button", includeVariants: true })

// By pattern
figma_search_components({ namePattern: "Icons/*" })
```
