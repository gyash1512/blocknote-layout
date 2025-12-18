import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Spreadsheet } from "../pm-nodes/Spreadsheet.js";

export const SpreadsheetBlock = createBlockSpecFromTiptapNode(
    {
        node: Spreadsheet as any,
        type: "spreadsheet",
        content: "none",  // Changed from "inline" - spreadsheet is self-contained, no inline content needed
    },
    {
        title: {
            default: "Untitled Spreadsheet",
        },
        columns: {
            default: "[]",
        },
        data: {
            default: "[]",
        },
        settings: {
            default: "{}",
        },
        meta: {
            default: "{}",
        },
    },
);
