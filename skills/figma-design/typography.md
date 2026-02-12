# Typography

## Creating Text

```
figma_create_text({
  text: "Heading",
  fontSize: 32,
  fontFamily: "Inter",
  fontStyle: "Bold",
  fills: { color: "#111827" },
  parentId: "<frame-id>"
})
```

## Styling Existing Text

```
figma_set_text_style({
  nodeId: "<text-id>",
  fontSize: 16,
  fontFamily: "Inter",
  fontStyle: "Regular",
  lineHeight: { unit: "PIXELS", value: 24 },
  letterSpacing: { unit: "PERCENT", value: 0 },
  textAlignHorizontal: "LEFT",
  textAlignVertical: "TOP",
  textCase: "ORIGINAL",
  textDecoration: "NONE"
})
```

## Changing Text Content

```
figma_set_text({ nodeId: "<text-id>", text: "New content" })
```

Note: Font loading is automatic. The bridge loads the current font before changing text.

## Font Style Values

Common `fontStyle` strings (must match what's installed):
- Weight: `"Thin"`, `"ExtraLight"`, `"Light"`, `"Regular"`, `"Medium"`, `"SemiBold"`, `"Bold"`, `"ExtraBold"`, `"Black"`
- Italic: `"Italic"`, `"Bold Italic"`, `"Medium Italic"`, etc.

## Line Height

| Format | Example | Behavior |
|--------|---------|----------|
| Auto | `{ unit: "AUTO" }` | Font default (usually ~1.2) |
| Pixels | `{ unit: "PIXELS", value: 24 }` | Exact pixel value |
| Percent | `{ unit: "PERCENT", value: 150 }` | Percentage of font size |

## Letter Spacing

| Format | Example | Behavior |
|--------|---------|----------|
| Pixels | `{ unit: "PIXELS", value: 0.5 }` | Fixed pixel amount |
| Percent | `{ unit: "PERCENT", value: 2 }` | Percentage of font size |

## Text Alignment

Horizontal: `LEFT`, `CENTER`, `RIGHT`, `JUSTIFIED`
Vertical: `TOP`, `CENTER`, `BOTTOM`

## Text Case

`ORIGINAL`, `UPPER`, `LOWER`, `TITLE`

## Text Decoration

`NONE`, `UNDERLINE`, `STRIKETHROUGH`

## Heading Scale

| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Display | 48-64px | Bold | 1.1x | -2% |
| H1 | 36-40px | Bold | 1.2x | -1% |
| H2 | 28-32px | SemiBold | 1.25x | -0.5% |
| H3 | 22-24px | SemiBold | 1.3x | 0% |
| H4 | 18-20px | Medium | 1.4x | 0% |
| Body | 14-16px | Regular | 1.5x | 0% |
| Caption | 12px | Regular | 1.4x | 0% |
| Overline | 10-12px | Medium + UPPER | 1.5x | 5% |

## Creating Text Styles

```
figma_create_text_style({
  name: "Heading/H1",          // "/" creates folders in the styles panel
  fontFamily: "Inter",
  fontStyle: "Bold",
  fontSize: 36,
  lineHeight: { unit: "PIXELS", value: 44 },
  letterSpacing: { unit: "PERCENT", value: -1 },
  description: "Page title"
})
```

## Applying Text Styles

1. Find the style:
   ```
   figma_search_styles({ nameContains: "H1", type: "TEXT" })
   ```
2. Apply to a text node:
   ```
   figma_apply_style({ nodeId: "<text-id>", styleId: "<style-id>", property: "text" })
   ```

## Text in Auto-Layout

Text nodes inside auto-layout frames:
- Use `layoutAlign: "STRETCH"` to make text fill the container width (enables text wrapping)
- Set `textAlignHorizontal` to control alignment within the text box
- Text auto-height is the default behavior (hugs content vertically)
