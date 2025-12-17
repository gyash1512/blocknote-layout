import {
    BlockNoteSchema,
    defaultBlockSpecs,
    BlockSpecs,
} from "@blocknote/core";
import { SpreadsheetBlock } from "./SpreadsheetBlock.js";

export const spreadsheetBlockSpecs = {
    spreadsheet: SpreadsheetBlock,
} as const;

export const spreadsheetSchema = BlockNoteSchema.create({
    blockSpecs: spreadsheetBlockSpecs,
});

export function createSpreadsheetSchema<T extends BlockSpecs>(
    customBlockSpecs?: T,
) {
    const allBlockSpecs = {
        ...defaultBlockSpecs,
        ...spreadsheetBlockSpecs,
        ...(customBlockSpecs || {}),
    };

    return BlockNoteSchema.create({
        blockSpecs: allBlockSpecs,
    } as Parameters<typeof BlockNoteSchema.create>[0]);
}

export function withSpreadsheet<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends BlockNoteSchema<any, any, any>
>(schema: T): T {
    return schema.extend({
        blockSpecs: spreadsheetBlockSpecs,
    }) as T;
}

export function checkSpreadsheetBlocksInSchema(
    editor: any
): boolean {
    return (
        "spreadsheet" in editor.schema.blockSchema
    );
}
