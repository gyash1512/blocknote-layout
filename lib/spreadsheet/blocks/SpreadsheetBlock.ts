import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Node } from "@tiptap/core";
import { Spreadsheet } from "../pm-nodes/Spreadsheet.js";

export const SpreadsheetBlock = createBlockSpecFromTiptapNode(
    {
        node: Spreadsheet as unknown as Node,
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
