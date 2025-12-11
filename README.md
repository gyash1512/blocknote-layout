# BlockNote Layout

Layout and utility extensions for [BlockNote](https://www.blocknotejs.org/) - the open-source block-based rich text editor.

[![npm version](https://img.shields.io/npm/v/blocknote-layout)](https://www.npmjs.com/package/blocknote-layout)
[![CI](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml/badge.svg)](https://github.com/gyash1512/blocknote-layout/actions/workflows/ci.yml)

---

## Features

- **Multi-Column Layouts** - Notion-style columns with resizable dividers and responsive stacking
- **Python Code Runner** - Execute Python code in-browser using Pyodide with package support

---

## Installation

```bash
npm install blocknote-layout
```

---

## Multi-Column Layout

Create Notion-style multi-column layouts with drag-and-drop support.

```tsx
import { BlockNoteSchema } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { withMultiColumn, getMultiColumnSlashMenuItems } from "blocknote-layout";
// or: import { withMultiColumn } from "blocknote-layout/multicolumn";

// Create schema with multi-column support
const schema = withMultiColumn(BlockNoteSchema.create());

function App() {
  const editor = useCreateBlockNote({ schema });

  return <BlockNoteView editor={editor} />;
}
```

### Multi-Column Exports

```ts
import {
  // Schema utilities
  withMultiColumn,
  createMultiColumnSchema,
  multiColumnSchema,
  multiColumnBlockSpecs,
  
  // Block components
  ColumnBlock,
  ColumnListBlock,
  MultiColumnBlock,
  
  // ProseMirror nodes
  Column,
  ColumnList,
  ColumnExtensions,
  
  // Extensions
  getMultiColumnSlashMenuItems,
  createColumnResizeExtension,
  multiColumnDropCursor,
} from "blocknote-layout";
```

---

## Python Code Runner

Execute Python code directly in the browser using Pyodide.

```tsx
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems, filterSuggestionItems } from "@blocknote/react";
import { CodeBlock, insertCode } from "blocknote-layout";
// or: import { CodeBlock, insertCode } from "blocknote-layout/coderunner";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    codeRunner: CodeBlock,
  },
});

function App() {
  const editor = useCreateBlockNote({ schema });

  return (
    <BlockNoteView editor={editor} slashMenu={false}>
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) =>
          filterSuggestionItems(
            [...getDefaultReactSlashMenuItems(editor), insertCode()],
            query
          )
        }
      />
    </BlockNoteView>
  );
}
```

### Code Runner Features

- **In-Browser Runtime**: Full CPython 3.12 environment via WebAssembly
- **Package Support**: Auto-detects and installs imports (pandas, numpy, scipy, matplotlib)
- **Output Capture**: Terminal-style output for stdout and stderr
- **Matplotlib Support**: Renders plots as images in the output

### Code Runner Exports

```ts
import {
  CodeBlock,
  insertCode,
  runPython,
  getPyodide,
  isPyodideLoaded,
  isPyodideLoading,
} from "blocknote-layout";

import type { CodeBlockProps, PythonResult } from "blocknote-layout";
```

---

## Subpath Imports

You can also import from specific subpaths for tree-shaking:

```ts
// Import only multi-column
import { withMultiColumn } from "blocknote-layout/multicolumn";

// Import only code runner
import { CodeBlock } from "blocknote-layout/coderunner";
```

---

## Peer Dependencies

```json
{
  "@blocknote/core": "^0.42.3",
  "@blocknote/mantine": "^0.42.3",
  "@blocknote/react": "^0.42.3",
  "@tiptap/core": "^3.0.0",
  "@uiw/react-codemirror": "^4.21.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "react-icons": "^4.0.0 || ^5.0.0"
}
```

---

## License

This package contains components under different licenses:

- **Multi-Column** (`lib/multicolumn/`): [GPL-3.0](lib/multicolumn/LICENSE) © [Yash Gupta](https://github.com/gyash1512)
- **Code Runner** (`lib/coderunner/`): [MIT](lib/coderunner/LICENSE) © [Harshpreet Singh](https://github.com/harshpreet-singh)

See the [LICENSE](./LICENSE) file for details.

