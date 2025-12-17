import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { FaTable } from "react-icons/fa";

type AnyBlockNoteEditor = BlockNoteEditor<any, any, any>;

function insertSpreadsheet(editor: AnyBlockNoteEditor): void {
    // Insert a spreadsheet block
    editor.insertBlocks(
        [
            {
                type: "spreadsheet",
                props: {
                    title: "Spreadsheet",
                },
            } as any,
        ],
        editor.getTextCursorPosition().block,
        "after"
    );
}

export function getSpreadsheetSlashMenuItems(
    editor: AnyBlockNoteEditor,
): DefaultReactSuggestionItem[] {
    // Check if spreadsheet is in schema
    const checkSpreadsheetBlocksInSchema = (e: AnyBlockNoteEditor): boolean => {
        return "spreadsheet" in e.schema.blockSchema;
    };

    if (!checkSpreadsheetBlocksInSchema(editor)) {
        console.warn('Spreadsheet block not found in schema');
        return [];
    }

    return [
        {
            title: "Spreadsheet",
            subtext: "Create a data table with charts",
            group: "Data",
            aliases: ["spreadsheet", "table", "data", "chart", "graph"],
            icon: <FaTable size={18} />,
            onItemClick: () => {
                insertSpreadsheet(editor);
            },
        },
    ];
}

export { insertSpreadsheet };
