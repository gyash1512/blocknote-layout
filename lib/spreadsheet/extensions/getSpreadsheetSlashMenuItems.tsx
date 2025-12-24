import { BlockNoteEditor, BlockSchema, InlineContentSchema, StyleSchema, PartialBlock } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { FaTable } from "react-icons/fa";

function insertSpreadsheet<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema
>(editor: BlockNoteEditor<BSchema, ISchema, SSchema>): void {
    // Insert a spreadsheet block
    editor.insertBlocks(
        [
            {
                type: "spreadsheet",
                props: {
                    title: "Spreadsheet",
                },
            } as PartialBlock<BSchema, ISchema, SSchema>,
        ],
        editor.getTextCursorPosition().block,
        "after"
    );
}

export function getSpreadsheetSlashMenuItems<
    BSchema extends BlockSchema,
    ISchema extends InlineContentSchema,
    SSchema extends StyleSchema
>(
    editor: BlockNoteEditor<BSchema, ISchema, SSchema>,
): DefaultReactSuggestionItem[] {
    // Check if spreadsheet is in schema
    const checkSpreadsheetBlocksInSchema = <
        B extends BlockSchema,
        I extends InlineContentSchema,
        S extends StyleSchema
    >(e: BlockNoteEditor<B, I, S>): boolean => {
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
