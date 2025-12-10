import { BlockNoteEditor } from "@blocknote/core";
import { DefaultReactSuggestionItem } from "@blocknote/react";
import { MdViewColumn, MdViewWeek } from "react-icons/md";

type AnyBlockNoteEditor = BlockNoteEditor<any, any, any>;

function checkMultiColumnBlocksInSchema(editor: AnyBlockNoteEditor): boolean {
  return (
    "columnList" in editor.schema.blockSchema &&
    "column" in editor.schema.blockSchema
  );
}

function insertColumnBlock(editor: AnyBlockNoteEditor, numColumns: number): void {
  const tiptapEditor = editor._tiptapEditor;
  if (!tiptapEditor) return;
  
  const { schema } = tiptapEditor.state;
  const columnListType = schema.nodes.columnList;
  const columnType = schema.nodes.column;
  
  if (!columnListType || !columnType) {
    return;
  }
  
  const paragraphType = schema.nodes.paragraph;
  const blockContainerType = schema.nodes.blockContainer;
  
  const createColumnContent = () => {
    const paragraph = paragraphType.create();
    const blockContainer = blockContainerType.create(null, paragraph);
    return columnType.create(null, blockContainer);
  };
  
  const columns = Array.from({ length: numColumns }, createColumnContent);
  const columnList = columnListType.create(null, columns);
  
  const { selection } = tiptapEditor.state;
  const pos = selection.$from.pos;
  
  const tr = tiptapEditor.state.tr.insert(pos, columnList);
  tiptapEditor.view.dispatch(tr);
}

export function getMultiColumnSlashMenuItems(
  editor: AnyBlockNoteEditor,
): DefaultReactSuggestionItem[] {
  if (!checkMultiColumnBlocksInSchema(editor)) {
    return [];
  }

  return [
    {
      title: "Two Columns",
      subtext: "Split content into two columns",
      group: "Layout",
      aliases: ["columns", "col", "split", "two-column", "2col"],
      icon: <MdViewColumn size={18} />,
      onItemClick: () => {
        insertColumnBlock(editor, 2);
      },
    },
    {
      title: "Three Columns",
      subtext: "Split content into three columns",
      group: "Layout",
      aliases: ["columns", "col", "triple", "three-column", "3col"],
      icon: <MdViewWeek size={18} />,
      onItemClick: () => {
        insertColumnBlock(editor, 3);
      },
    },
  ];
}