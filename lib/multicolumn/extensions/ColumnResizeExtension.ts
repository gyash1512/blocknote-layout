import { BlockNoteEditor, getNodeById } from "@blocknote/core";
import { Extension } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey, PluginView } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";

type ColumnData = {
  element: HTMLElement;
  id: string;
  node: Node;
  posBeforeNode: number;
};

type ColumnDataWithWidths = ColumnData & {
  widthPx: number;
  widthPercent: number;
};

type ColumnDefaultState = {
  type: "default";
};

type ColumnHoverState = {
  type: "hover";
  leftColumn: ColumnData;
  rightColumn: ColumnData;
  activeHandleSide: "left" | "right";
};

type ColumnResizeState = {
  type: "resize";
  startPos: number;
  leftColumn: ColumnDataWithWidths;
  rightColumn: ColumnDataWithWidths;
  activeHandleSide: "left" | "right";
};

type ColumnState = ColumnDefaultState | ColumnHoverState | ColumnResizeState;

const columnResizePluginKey = new PluginKey<ColumnState>("ColumnResizePlugin");

class ColumnResizePluginView implements PluginView {
  editor: BlockNoteEditor<any, any, any>;
  view: EditorView;

  readonly RESIZE_MARGIN_WIDTH_PX = 40;
  readonly RESIZE_BODY_MARGIN_WIDTH_PX = 20;
  readonly RESIZE_HANDLE_HEIGHT_PX = 24;
  readonly COLUMN_MIN_WIDTH_PERCENT = 0.1;

  constructor(editor: BlockNoteEditor<any, any, any>, view: EditorView) {
    this.editor = editor;
    this.view = view;

    this.view.dom.addEventListener("mousedown", this.mouseDownHandler);
    document.body.addEventListener("mousemove", this.mouseMoveHandler);
    document.body.addEventListener("mouseup", this.mouseUpHandler);
  }

  getColumnHoverOrDefaultState = (
    event: MouseEvent,
  ): ColumnDefaultState | ColumnHoverState => {
    if (!this.editor.isEditable) {
      return { type: "default" };
    }

    const target = event.target as HTMLElement;

    if (!this.view.dom.contains(target)) {
      return { type: "default" };
    }

    const columnElement = target.closest(
      ".bn-block-column",
    ) as HTMLElement | null;

    if (!columnElement) {
      return { type: "default" };
    }

    const startPos = event.clientX;
    const columnElementDOMRect = columnElement.getBoundingClientRect();

    let activeHandleSide: "left" | "right" | "none" = "none";

    const distLeft = startPos - columnElementDOMRect.left;
    const distRight = columnElementDOMRect.right - startPos;
    const distTop = event.clientY - columnElementDOMRect.top;

    const effectiveMargin =
      distTop < this.RESIZE_HANDLE_HEIGHT_PX
        ? this.RESIZE_MARGIN_WIDTH_PX
        : this.RESIZE_BODY_MARGIN_WIDTH_PX;

    if (distLeft < effectiveMargin && distLeft <= distRight) {
      activeHandleSide = "left";
    } else if (distRight < effectiveMargin) {
      activeHandleSide = "right";
    }

    if (activeHandleSide === "none") {
      return { type: "default" };
    }

    let leftColumnElement: HTMLElement;
    let rightColumnElement: HTMLElement;

    if (activeHandleSide === "left") {
      const prev = columnElement.previousElementSibling as HTMLElement;
      if (!prev) return { type: "default" };
      leftColumnElement = prev;
      rightColumnElement = columnElement;
    } else {
      const next = columnElement.nextElementSibling as HTMLElement;
      if (!next) return { type: "default" };
      leftColumnElement = columnElement;
      rightColumnElement = next;
    }

    const leftColumnId = leftColumnElement.getAttribute("data-id")!;
    const rightColumnId = rightColumnElement.getAttribute("data-id")!;

    const leftColumnNodeAndPos = getNodeById(leftColumnId, this.view.state.doc);
    const rightColumnNodeAndPos = getNodeById(rightColumnId, this.view.state.doc);

    if (
      !leftColumnNodeAndPos ||
      !rightColumnNodeAndPos ||
      !leftColumnNodeAndPos.posBeforeNode
    ) {
      return { type: "default" };
    }

    return {
      type: "hover",
      leftColumn: {
        element: leftColumnElement,
        id: leftColumnId,
        ...leftColumnNodeAndPos,
      },
      rightColumn: {
        element: rightColumnElement,
        id: rightColumnId,
        ...rightColumnNodeAndPos,
      },
      activeHandleSide: activeHandleSide,
    };
  };

  mouseDownHandler = (event: MouseEvent) => {
    let newState: ColumnState = this.getColumnHoverOrDefaultState(event);
    if (newState.type === "default") {
      return;
    }

    event.preventDefault();

    const startPos = event.clientX;

    const leftColumnWidthPx =
      newState.leftColumn.element.getBoundingClientRect().width;
    const rightColumnWidthPx =
      newState.rightColumn.element.getBoundingClientRect().width;

    const leftColumnWidthPercent = newState.leftColumn.node.attrs.width as number;
    const rightColumnWidthPercent = newState.rightColumn.node.attrs.width as number;

    newState = {
      type: "resize",
      startPos,
      leftColumn: {
        ...newState.leftColumn,
        widthPx: leftColumnWidthPx,
        widthPercent: leftColumnWidthPercent,
      },
      rightColumn: {
        ...newState.rightColumn,
        widthPx: rightColumnWidthPx,
        widthPercent: rightColumnWidthPercent,
      },
      activeHandleSide: newState.activeHandleSide,
    };

    this.view.dispatch(
      this.view.state.tr.setMeta(columnResizePluginKey, newState),
    );

    this.editor.sideMenu.freezeMenu();
    this.view.dom.classList.add("is-resizing-columns");
  };

  mouseMoveHandler = (event: MouseEvent) => {
    const pluginState = columnResizePluginKey.getState(this.view.state);
    if (!pluginState) {
      return;
    }

    if (pluginState.type !== "resize") {
      const newState = this.getColumnHoverOrDefaultState(event);

      const bothDefaultStates =
        pluginState.type === "default" && newState.type === "default";
      const sameState =
        pluginState.type !== "default" &&
        newState.type !== "default" &&
        pluginState.leftColumn.id === newState.leftColumn.id &&
        pluginState.rightColumn.id === newState.rightColumn.id &&
        pluginState.activeHandleSide === newState.activeHandleSide;

      if (bothDefaultStates || sameState) {
        return;
      }

      this.view.dispatch(
        this.view.state.tr.setMeta(columnResizePluginKey, newState),
      );
      return;
    }

    const widthChangePx = event.clientX - pluginState.startPos;
    const scaledWidthChangePx = widthChangePx * pluginState.leftColumn.widthPercent;
    const widthChangePercent =
      (pluginState.leftColumn.widthPx + scaledWidthChangePx) /
        pluginState.leftColumn.widthPx -
      1;

    let newLeftColumnWidth = pluginState.leftColumn.widthPercent + widthChangePercent;
    let newRightColumnWidth = pluginState.rightColumn.widthPercent - widthChangePercent;

    if (newLeftColumnWidth < this.COLUMN_MIN_WIDTH_PERCENT) {
      newRightColumnWidth -= this.COLUMN_MIN_WIDTH_PERCENT - newLeftColumnWidth;
      newLeftColumnWidth = this.COLUMN_MIN_WIDTH_PERCENT;
    } else if (newRightColumnWidth < this.COLUMN_MIN_WIDTH_PERCENT) {
      newLeftColumnWidth -= this.COLUMN_MIN_WIDTH_PERCENT - newRightColumnWidth;
      newRightColumnWidth = this.COLUMN_MIN_WIDTH_PERCENT;
    }

    this.view.dispatch(
      this.view.state.tr
        .setNodeAttribute(
          pluginState.leftColumn.posBeforeNode,
          "width",
          newLeftColumnWidth,
        )
        .setNodeAttribute(
          pluginState.rightColumn.posBeforeNode,
          "width",
          newRightColumnWidth,
        )
        .setMeta("addToHistory", false),
    );
  };

  mouseUpHandler = (event: MouseEvent) => {
    const pluginState = columnResizePluginKey.getState(this.view.state);
    if (!pluginState || pluginState.type !== "resize") {
      return;
    }

    const newState = this.getColumnHoverOrDefaultState(event);

    this.view.dispatch(
      this.view.state.tr.setMeta(columnResizePluginKey, newState),
    );

    this.editor.sideMenu.unfreezeMenu();
    this.view.dom.classList.remove("is-resizing-columns");
  };

  destroy() {
    this.view.dom.removeEventListener("mousedown", this.mouseDownHandler);
    document.body.removeEventListener("mousemove", this.mouseMoveHandler);
    document.body.removeEventListener("mouseup", this.mouseUpHandler);
  }
}

const createColumnResizePlugin = (editor: BlockNoteEditor<any, any, any>) =>
  new Plugin({
    key: columnResizePluginKey,
    props: {
      decorations: (state) => {
        const pluginState = columnResizePluginKey.getState(state);
        if (!pluginState || pluginState.type === "default") {
          return DecorationSet.empty;
        }

        const activeNode = pluginState.activeHandleSide === "right" 
          ? pluginState.leftColumn 
          : pluginState.rightColumn;
          
        const className = pluginState.activeHandleSide === "right" 
          ? "resizing-col-right" 
          : "resizing-col-left";

        return DecorationSet.create(state.doc, [
          Decoration.node(
            activeNode.posBeforeNode,
            activeNode.posBeforeNode + activeNode.node.nodeSize,
            {
              class: className,
            },
          ),
        ]);
      },
    },
    state: {
      init: () => ({ type: "default" }) as ColumnState,
      apply: (tr, oldPluginState) => {
        const newPluginState = tr.getMeta(columnResizePluginKey) as
          | ColumnState
          | undefined;

        return newPluginState === undefined ? oldPluginState : newPluginState;
      },
    },
    view: (view) => new ColumnResizePluginView(editor, view),
  });

export const createColumnResizeExtension = (
  editor: BlockNoteEditor<any, any, any>,
) =>
  Extension.create({
    name: "columnResize",
    addProseMirrorPlugins() {
      return [createColumnResizePlugin(editor)];
    },
  });