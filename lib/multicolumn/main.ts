import { ColumnBlock, ColumnListBlock } from "./blocks/Columns/index.js";
import { Column } from "./pm-nodes/Column.js";
import { ColumnList } from "./pm-nodes/ColumnList.js";
import "./styles/multi-column.css";

export const ColumnExtensions: any[] = [Column, ColumnList];

export function MultiColumnBlock() {
  return {
    column: ColumnBlock,
    columnList: ColumnListBlock,
  };
}

export { ColumnBlock, ColumnListBlock };
export { Column, ColumnList };
export {
  multiColumnSchema,
  withMultiColumn,
  createMultiColumnSchema,
  multiColumnBlockSpecs,
} from "./blocks/schema.js";

export { getMultiColumnSlashMenuItems } from "./extensions/getMultiColumnSlashMenuItems.js";
export { createColumnResizeExtension } from "./extensions/ColumnResizeExtension.js";
export { multiColumnDropCursor } from "./extensions/MultiColumnDropCursorPlugin.js";