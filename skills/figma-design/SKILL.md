---
name: figma-design
description: Creates Figma designs by REUSING existing design tokens (variables, styles, components) from the current file or linked libraries. Enforces design system consistency - never hardcodes values, always uses variables for spacing/colors/radius, text styles for typography, and component instances for UI elements.
allowed-tools: mcp__figma-mcp-bridge__*, mcp__figma-desktop__get_screenshot, mcp__figma-desktop__get_metadata, mcp__figma-desktop__get_design_context
---

# Figma Design System Enforcer

**CORE MISSION:** Generate Figma designs that REUSE existing design tokens and components. NEVER hardcode values. ALWAYS discover and apply the existing design system.

---

## Workflow (MANDATORY - Follow Every Time)

### 1. Connection Check

```
figma_server_info
```

If `connected: false`, tell user to run the Figma plugin. If port mismatch, ask them to update the port in plugin UI.

Confirm `editorType: "figma"` (not FigJam). For FigJam files, use `/figjam-design` instead.

---

### 2. Discover Design System (CRITICAL STEP)

**Before building ANYTHING, you MUST discover what design tokens exist:**

#### A. Check for External Libraries

Most professional Figma files use **external design system libraries**. Check first:

```
figma_get_context
```

Look at the response for library information. External libraries are usually linked for:
- Design tokens (color/spacing variables)
- Text styles (typography)
- Reusable components (Button, Card, Input, etc.)

**If libraries are found:**
- Tell the user: "I found these linked libraries: [list names]"
- Ask: "Which library should I use for components and design tokens? Or should I use multiple?"
- Wait for user confirmation before proceeding

**If NO libraries are found:**
- Ask user: "I don't see any linked design system libraries. Which page(s) contain the components and design tokens I should reuse?"
- User will tell you the page name (e.g., "Design System", "Components", "Tokens")

#### B. Search for Design Tokens

Once you know where to look, search for existing design tokens:

**Variables (spacing, colors, radius):**
```
figma_search_variables({ type: "COLOR", compact: true, limit: 100 })
figma_search_variables({ type: "FLOAT", compact: true, limit: 100 })
```

**Text Styles (typography):**
```
figma_search_styles({ type: "TEXT", compact: true })
```

**Paint Styles (if used instead of variables):**
```
figma_search_styles({ type: "PAINT", compact: true })
```

**Components (Button, Card, Input, etc.):**
```
figma_search_components({ compact: true, limit: 100 })
```

**SAVE THESE RESULTS** - You'll reference them constantly while building.

---

### 3. Build Using Design System (RULES)

Now build the UI following these **NON-NEGOTIABLE RULES:**

⚠️ **GOLDEN RULE: NEVER EVER USE RAW NUMERIC VALUES**

Before setting ANY property (colors, spacing, padding, gap, margin, radius, font size), you MUST:
1. Search for the corresponding variable/style
2. Find the exact value from that variable
3. Use that exact value (not a similar number, THE EXACT NUMBER)

**Examples of FORBIDDEN practices:**
- Using padding: 15 when your spacing tokens are 8, 16, 24 (where did 15 come from?)
- Using color: "#3B82F7" when your primary color is "#3B82F6" (close but wrong!)
- Using radius: 6 when your radius tokens are 4, 8, 16 (arbitrary value)
- Using fontSize: 17 when your text styles use 16, 18, 20 (doesn't match scale)

**If you can't find a matching token:** STOP and ASK THE USER before proceeding.

#### Rule 1: NEVER Hardcode Colors

❌ **WRONG:**
```
figma_set_fills({ nodeId: "123", fills: [{ color: "#3B82F6" }] })
```

✅ **CORRECT:**
```
// Find the color variable first
figma_search_variables({ namePattern: "*primary*", type: "COLOR" })
// Result: { id: "VariableID:123", name: "color/primary", value: "#3B82F6" }

// Bind it to the node
figma_set_variable({
  nodeId: "123",
  variableId: "VariableID:123",
  field: "fills",
  paintIndex: 0
})
```

If no matching color variable exists, **ASK THE USER** before creating a new one.

---

#### Rule 2: NEVER Hardcode Spacing/Padding/Gap - ALWAYS Use Variables

❌ **WRONG:**
```
figma_set_auto_layout({
  nodeId: "123",
  paddingLeft: 16,     // Random hardcoded value - NO!
  paddingRight: 16,
  itemSpacing: 8
})
```

✅ **CORRECT - Two Steps Required:**

**Step 1: Find spacing variables FIRST**
```
figma_search_variables({ namePattern: "*spacing*", type: "FLOAT" })
```

Result example:
```json
[
  { "id": "VariableID:1", "name": "spacing/xs", "value": 4 },
  { "id": "VariableID:2", "name": "spacing/sm", "value": 8 },
  { "id": "VariableID:3", "name": "spacing/md", "value": 16 },
  { "id": "VariableID:4", "name": "spacing/lg", "value": 24 },
  { "id": "VariableID:5", "name": "spacing/xl", "value": 32 }
]
```

**Step 2: Use the EXACT values from those variables**
```
// Look at the search results - spacing/md is 16, spacing/sm is 8
figma_set_auto_layout({
  nodeId: "123",
  paddingLeft: 16,     // ✅ This value comes from spacing/md variable
  paddingRight: 16,    // ✅ This value comes from spacing/md variable
  itemSpacing: 8       // ✅ This value comes from spacing/sm variable
})
```

**CRITICAL:** You MUST search for variables first and use their EXACT values. NEVER use arbitrary numbers like 15, 17, 20, etc. that don't match your design system tokens.

**Common spacing scale to look for:**
- `spacing/xs` → 4px
- `spacing/sm` → 8px
- `spacing/md` → 16px
- `spacing/lg` → 24px
- `spacing/xl` → 32px
- `spacing/2xl` → 48px
- `spacing/3xl` → 64px

**If you need 24px padding:** Search for spacing variables → find `spacing/lg = 24` → use 24
**If you need 12px gap:** Search for spacing variables → if none = 12, **ASK USER** which token to use or if you should create `spacing/sm-md`

---

#### Rule 3: NEVER Hardcode Border Radius

❌ **WRONG:**
```
figma_set_corner_radius({ nodeId: "123", radius: 8 })
```

✅ **CORRECT:**
```
// Find radius variables first
figma_search_variables({ namePattern: "*radius*", type: "FLOAT" })
// Result: { id: "VAR:5", name: "radius/md", value: 8 }

// Use the value from the variable
figma_set_corner_radius({ nodeId: "123", radius: 8 })  // radius/md
```

Common radius tokens:
- `radius/sm` (4px)
- `radius/md` (8px)
- `radius/lg` (16px)
- `radius/full` (9999px for pills)

---

#### Rule 4: NEVER Style Text Inline - Use Text Styles

❌ **WRONG:**
```
figma_set_text_style({
  nodeId: "123",
  fontSize: 16,
  fontWeight: "Bold",
  lineHeight: { value: 24, unit: "PIXELS" }
})
```

✅ **CORRECT:**
```
// Find existing text styles first
figma_search_styles({ type: "TEXT" })
// Result: { id: "S:123", name: "Heading/H3", fontSize: 16, fontWeight: "Bold", ... }

// Apply the style
figma_apply_style({
  nodeId: "123",
  styleId: "S:123",
  property: "text"
})
```

Common text styles to look for:
- Headings: `H1`, `H2`, `H3`, `H4`, `H5`, `H6`
- Body text: `Body/Large`, `Body/Default`, `Body/Small`
- UI text: `Label`, `Caption`, `Overline`

**If no matching style exists:** Ask user before creating a new one.

---

#### Rule 5: NEVER Build Raw Frames - Use Component Instances

❌ **WRONG:**
```
// Building a button from scratch
figma_create_frame({ name: "Button", ... })
figma_create_text({ text: "Click me", parentId: "..." })
figma_set_fills({ ... })
```

✅ **CORRECT:**
```
// Find existing button component first
figma_search_components({ nameContains: "Button" })
// Result: { id: "COMP:123", name: "Button/Primary", type: "COMPONENT", ... }

// Create instance and customize via properties
figma_create_instance({ componentId: "COMP:123", parentId: "..." })
figma_set_properties({
  nodeId: "instance-id",
  properties: {
    "label": "Click me",      // Component property for text
    "size": "medium"          // Component variant property
  }
})
```

Common components to look for:
- `Button` (with variants: Primary, Secondary, Ghost)
- `Input`, `TextField`, `TextArea`
- `Card`, `Panel`, `Container`
- `Icon`, `Avatar`, `Badge`
- `Checkbox`, `Radio`, `Switch`, `Toggle`

**NEVER detach instances** unless the user explicitly requests it. Use component properties to customize.

---

#### Rule 6: Always Use Auto-Layout (No Manual Positioning)

✅ **CORRECT:**
```
// Create frame and immediately enable auto-layout
figma_create_frame({ name: "Container", width: 300, height: 200, parentId: "..." })
figma_set_auto_layout({
  nodeId: "frame-id",
  mode: "VERTICAL",          // or "HORIZONTAL"
  paddingTop: 16,            // Use spacing tokens
  paddingBottom: 16,
  paddingLeft: 16,
  paddingRight: 16,
  itemSpacing: 8,            // Gap between children
  primaryAxisAlignItems: "MIN",  // or "CENTER", "MAX", "SPACE_BETWEEN"
  counterAxisAlignItems: "MIN"   // or "CENTER", "MAX"
})
```

**NEVER use `figma_move_nodes` for children inside auto-layout frames.** Position is controlled by alignment and spacing.

**Use `layoutAlign: "STRETCH"`** for children that should fill container width:
```
figma_set_layout_align({
  nodeId: "child-id",
  layoutAlign: "STRETCH"
})
```

**Use `layoutGrow: 1`** for children that should fill remaining space:
```
figma_set_layout_align({
  nodeId: "child-id",
  layoutGrow: 1
})
```

---

#### Rule 7: Always Name Everything Descriptively

❌ **WRONG:** `"Frame 1"`, `"Rectangle 23"`, `"Text 5"`

✅ **CORRECT:** `"LoginForm"`, `"SubmitButton"`, `"EmailInput"`, `"HeaderContainer"`

```
figma_rename_node({ nodeId: "123", name: "LoginForm" })
```

Use semantic names that describe **what** the element is, not **how** it looks.

---

### 4. Screenshot & Iterate

After each major step, take a screenshot:

```
mcp__figma-desktop__get_screenshot
```

Review the visual result and iterate based on feedback.

---

## Search-First Strategy (Token Optimization)

**NEVER traverse the tree with repeated `figma_get_children` calls.**

Always search first:

| Tool | Use |
|------|-----|
| `figma_search_nodes({ parentId, nameContains, types, compact: true })` | Find any element by name |
| `figma_search_components({ nameContains })` | Find components |
| `figma_search_styles({ nameContains, type })` | Find text/paint styles |
| `figma_search_variables({ namePattern, type, compact: true })` | Find variables |

Only use `figma_get_children` when browsing unknown structure at ONE level.

Only use `figma_get_nodes` with depth `"full"` when you actually need ALL properties.

**Depth guide:**

| Depth | Props per node | Use |
|-------|----------------|-----|
| `minimal` | ~5 | Listing, tree traversal |
| `compact` | ~10 | Layout inspection (DEFAULT) |
| `full` | ~40 | Detailed editing (only when needed) |

---

## Example Workflow

**User request:** "Create a login form with email and password fields"

### Step 1: Check Connection
```
figma_server_info
→ { connected: true, editorType: "figma" }
```

### Step 2: Discover Design System

```
figma_search_variables({ type: "COLOR", compact: true, limit: 50 })
→ Found: color/primary, color/background, color/text, ...

figma_search_variables({ type: "FLOAT", compact: true, limit: 50 })
→ Found: spacing/xs, spacing/sm, spacing/md, spacing/lg, radius/sm, radius/md, ...

figma_search_styles({ type: "TEXT", compact: true })
→ Found: Heading/H1, Heading/H2, Body/Default, Label, ...

figma_search_components({ nameContains: "Input", compact: true })
→ Found: Input/Text (component with "label" and "placeholder" properties)

figma_search_components({ nameContains: "Button", compact: true })
→ Found: Button/Primary, Button/Secondary
```

### Step 3: Build the Form

```javascript
// 1. Create container frame with auto-layout
figma_create_frame({ name: "LoginForm", width: 400, height: 300, x: 0, y: 0 })

figma_set_auto_layout({
  nodeId: "<frame-id>",
  mode: "VERTICAL",
  paddingTop: 32,      // spacing/lg
  paddingBottom: 32,
  paddingLeft: 24,     // spacing/md
  paddingRight: 24,
  itemSpacing: 16,     // spacing/md
  primaryAxisAlignItems: "MIN",
  counterAxisAlignItems: "STRETCH"
})

// 2. Add heading using text style
figma_create_text({ text: "Login", fontSize: 24, parentId: "<frame-id>" })
figma_apply_style({ nodeId: "<heading-id>", styleId: "<H2-style-id>", property: "text" })

// 3. Add email input using component
figma_create_instance({ componentId: "<Input-component-id>", parentId: "<frame-id>" })
figma_set_properties({
  nodeId: "<email-input-id>",
  properties: {
    "label": "Email",
    "placeholder": "you@example.com"
  }
})

// 4. Add password input using component
figma_create_instance({ componentId: "<Input-component-id>", parentId: "<frame-id>" })
figma_set_properties({
  nodeId: "<password-input-id>",
  properties: {
    "label": "Password",
    "placeholder": "••••••••"
  }
})

// 5. Add submit button using component
figma_create_instance({ componentId: "<Button-Primary-id>", parentId: "<frame-id>" })
figma_set_properties({
  nodeId: "<button-id>",
  properties: {
    "label": "Sign In",
    "size": "large"
  }
})

// 6. Screenshot to verify
mcp__figma-desktop__get_screenshot
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding Values
```javascript
figma_set_fills({ nodeId: "123", fills: [{ color: "#3B82F6" }] })  // WRONG!
```

**Fix:** Search for variables first, use existing color tokens.

---

### ❌ Mistake 2: Building Instead of Reusing
```javascript
// Building a button from scratch - WRONG!
figma_create_frame(...)
figma_create_text(...)
figma_set_fills(...)
```

**Fix:** Search for Button component, create instance.

---

### ❌ Mistake 3: Not Applying Text Styles
```javascript
figma_set_text_style({ nodeId: "123", fontSize: 16, fontWeight: "Bold" })  // WRONG!
```

**Fix:** Search for text styles first, apply existing style.

---

### ❌ Mistake 4: Manual Positioning in Auto-Layout
```javascript
figma_set_auto_layout({ nodeId: "container", mode: "VERTICAL", ... })
figma_move_nodes({ nodeIds: ["child"], x: 10, y: 20 })  // WRONG! Children can't be positioned manually
```

**Fix:** Use alignment and spacing properties instead.

---

## Tool Reference (Essential Tools Only)

### Discovery
- `figma_server_info` - Check connection
- `figma_get_context` - Get current page/selection/libraries
- `figma_search_variables` - Find color/spacing/radius tokens
- `figma_search_styles` - Find text/paint styles
- `figma_search_components` - Find reusable components
- `figma_search_nodes` - Find elements by name

### Create
- `figma_create_frame` - Container frames (always enable auto-layout after)
- `figma_create_text` - Text (then apply text style)
- `figma_create_instance` - Component instance (PREFERRED over building from scratch)
- `figma_create_rectangle` / `figma_create_ellipse` - Basic shapes (rare, components preferred)

### Style & Layout
- `figma_set_auto_layout` - Enable auto-layout with spacing tokens
- `figma_set_layout_align` - Child alignment (STRETCH, layoutGrow)
- `figma_apply_style` - Apply text/paint style
- `figma_set_variable` - Bind color/spacing variable to node property
- `figma_set_fills` - Set fills (use variables when possible)
- `figma_set_corner_radius` - Set radius (use radius variables)

### Customize Components
- `figma_set_properties` - Change component instance properties (label, size, variant)

### Utility
- `figma_rename_node` - Rename to semantic names
- `figma_set_selection` - Select nodes
- `figma_zoom_to_node` - Focus viewport
- `mcp__figma-desktop__get_screenshot` - Visual verification

---

## Key Constraints

- **Font loading is automatic** - fonts must be installed on system (Inter is default)
- **Constraints vs layoutAlign** - use `figma_set_layout_align` for auto-layout children
- **Boolean operations require same parent**
- **Export returns base64** - `figma_export_node` returns base64 data
- **Variable paint binding** - use `figma_set_variable` with `field: "fills"` and `paintIndex: 0`
- **Reordering** - use `figma_reorder_node`, not manual array manipulation

---

## Summary: Your Job

1. **Discover** existing design tokens (variables, styles, components)
2. **Reuse** them - NEVER hardcode values
3. **Ask** the user if you can't find a matching token
4. **Build** using auto-layout, component instances, and design system tokens
5. **Screenshot** and iterate

**You are not a designer. You are a design system enforcer.** Your job is to ensure every design uses the existing tokens and components consistently.
