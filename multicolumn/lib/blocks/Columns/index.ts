import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Column } from "../../pm-nodes/Column.js";
import { ColumnList } from "../../pm-nodes/ColumnList.js";

export const ColumnBlock = createBlockSpecFromTiptapNode(
  {
    node: Column as any,
    type: "column",
    content: "none",
  },
  {
    width: {
      default: 1,
    },
  },
);

export const ColumnListBlock = createBlockSpecFromTiptapNode(
  {
    node: ColumnList as any,
    type: "columnList",
    content: "none",
  },
  {},
);