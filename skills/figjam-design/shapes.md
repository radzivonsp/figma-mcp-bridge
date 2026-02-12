# FigJam Shape Types

Use with `figma_create_shape_with_text({ shapeType: "...", text: "..." })`.

## Standard Shapes

| Shape Type | Description | Common Use |
|---|---|---|
| `SQUARE` | Square / rectangle | Generic process step |
| `ELLIPSE` | Circle / oval | Start/end terminal |
| `ROUNDED_RECTANGLE` | Rounded rectangle | Default process step |
| `DIAMOND` | Diamond / rhombus | Decision point (yes/no) |
| `TRIANGLE_UP` | Triangle pointing up | Direction / hierarchy |
| `TRIANGLE_DOWN` | Triangle pointing down | Direction / hierarchy |
| `PARALLELOGRAM_RIGHT` | Parallelogram (right lean) | Input/output |
| `PARALLELOGRAM_LEFT` | Parallelogram (left lean) | Input/output |

## Engineering / Tech Shapes

| Shape Type | Description | Common Use |
|---|---|---|
| `ENG_DATABASE` | Database cylinder | Database / data store |
| `ENG_QUEUE` | Horizontal cylinder | Message queue / buffer |
| `ENG_FILE` | File document | File / document |
| `ENG_FOLDER` | Folder | Directory / collection |

## Additional Shapes

| Shape Type | Description | Common Use |
|---|---|---|
| `TRAPEZOID` | Trapezoid | Manual operation |
| `PREDEFINED_PROCESS` | Double-bordered rectangle | Subroutine / predefined process |
| `SHIELD` | Shield | Security / protection |
| `DOCUMENT_SINGLE` | Single document | Document output |
| `DOCUMENT_MULTIPLE` | Stacked documents | Multiple documents |
| `MANUAL_INPUT` | Sloped-top quadrilateral | Manual input |
| `HEXAGON` | Hexagon | Preparation step |
| `CHEVRON` | Chevron / arrow shape | Process flow direction |
| `PENTAGON` | Pentagon | General shape |
| `OCTAGON` | Octagon | Stop / attention |
| `STAR` | Star | Highlight / favorite |
| `PLUS` | Plus / cross | Add / medical |
| `ARROW_LEFT` | Left arrow | Back / previous |
| `ARROW_RIGHT` | Right arrow | Forward / next |
| `SUMMING_JUNCTION` | Circle with X | Merge point |
| `OR` | Circle with + | Or junction |
| `SPEECH_BUBBLE` | Speech bubble | Comment / dialog |
| `INTERNAL_STORAGE` | Internal storage | Internal data store |

## Flowchart Conventions

| Element | Shape | Example |
|---|---|---|
| Start / End | `ELLIPSE` | "Start", "End" |
| Process | `ROUNDED_RECTANGLE` | "Process order" |
| Decision | `DIAMOND` | "Is valid?" |
| Input / Output | `PARALLELOGRAM_RIGHT` | "User input" |
| Database | `ENG_DATABASE` | "PostgreSQL" |
| Document | `ENG_FILE` | "Invoice PDF" |

## Sticky Note Colors

For `figma_create_sticky({ color: "..." })`:

| Color | Hex Approx | Best For |
|---|---|---|
| `YELLOW` | #FFDE66 | Default, general ideas |
| `ORANGE` | #FFA64F | Warnings, attention |
| `GREEN` | #8FDE5C | Positive, approved |
| `BLUE` | #87C2FF | Information, context |
| `VIOLET` | #C2A0FF | Creative, future ideas |
| `PINK` | #FF8FD9 | Urgent, blockers |
| `RED` | #FF8080 | Problems, issues |
| `TEAL` | #78DECC | Alternatives, options |
| `LIGHT_GRAY` | #E8E8E8 | Low priority, archive |
| `LIGHT_GREEN` | #C2ED87 | Done, resolved |
| `LIGHT_BLUE` | #A6D9FF | Reference, links |
| `GRAY` | #C4C4C4 | Neutral, discarded |

## Connector Types

For `figma_create_connector({ connectorType: "..." })`:

| Type | Description |
|---|---|
| `ELBOWED` | Right-angle lines (default, best for flowcharts) |
| `STRAIGHT` | Direct line between endpoints |
| `CURVED` | Smooth curved line |
