import {
  BlockNoteSchema,
  defaultBlockSpecs,
  BlockSpecs,
} from "@blocknote/core";
import { ColumnBlock, ColumnListBlock } from "./Columns/index.js";

export const multiColumnBlockSpecs = {
  column: ColumnBlock,
  columnList: ColumnListBlock,
} as const;

export const multiColumnSchema = BlockNoteSchema.create({
  blockSpecs: multiColumnBlockSpecs,
});

export function createMultiColumnSchema<T extends BlockSpecs>(
  customBlockSpecs?: T,
) {
  const allBlockSpecs = {
    ...defaultBlockSpecs,
    ...multiColumnBlockSpecs,
    ...(customBlockSpecs || {}),
  };
  
  return BlockNoteSchema.create({
    blockSpecs: allBlockSpecs,
  } as Parameters<typeof BlockNoteSchema.create>[0]);
}

export function withMultiColumn<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends BlockNoteSchema<any, any, any>
>(schema: T): T {
  return schema.extend({
    blockSpecs: multiColumnBlockSpecs,
  }) as T;
}