// ProseMirror nodes
export { Spreadsheet } from "./pm-nodes/Spreadsheet.js";

// BlockNote specifications
export { SpreadsheetBlock } from "./blocks/SpreadsheetBlock.js";

// Schema integration
export {
    spreadsheetBlockSpecs,
    createSpreadsheetSchema,
    checkSpreadsheetBlocksInSchema,
    withSpreadsheet,
    spreadsheetSchema,
} from "./blocks/schema.js";

// Extensions and utilities
export { getSpreadsheetSlashMenuItems } from "./extensions/getSpreadsheetSlashMenuItems.js";
export { insertSpreadsheet } from "./extensions/getSpreadsheetSlashMenuItems.js";

// React components
export { default as SpreadsheetNodeView } from "./components/SpreadsheetNodeView.js";
