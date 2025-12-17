import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Spreadsheet } from "../pm-nodes/Spreadsheet.js";

export const SpreadsheetBlock = createBlockSpecFromTiptapNode(
    {
        node: Spreadsheet as any,
        type: "spreadsheet",
        content: "inline",
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
    },
);
