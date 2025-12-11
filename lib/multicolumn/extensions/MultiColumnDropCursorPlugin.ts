import type { BlockNoteEditor } from "@blocknote/core";
import {
  UniqueID,
  getBlockInfo,
  getNearestBlockPos,
  nodeToBlock,
} from "@blocknote/core";
import { EditorState, Plugin } from "prosemirror-state";
import { dropPoint } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";

const PERCENTAGE_OF_BLOCK_WIDTH_CONSIDERED_SIDE_DROP = 0.1;

function eventCoords(event: MouseEvent) {
  return { left: event.clientX, top: event.clientY };
}

interface DropCursorOptions {
  color?: string | false;
  width?: number;
  class?: string;
}

export function multiColumnDropCursor(
  options: DropCursorOptions & {
    editor: BlockNoteEditor<any, any, any>;
  },
): Plugin {
  const editor = options.editor;
  return new Plugin({
    view(editorView) {
      return new DropCursorView(editorView, options);
    },
    props: {
      handleDrop(view, event, slice, _moved) {
        const eventPos = view.posAtCoords(eventCoords(event));

        if (!eventPos) {
          throw new Error("Could not get event position");
        }

        const posInfo = getTargetPosInfo(view.state, eventPos);
        const blockInfo = getBlockInfo(posInfo);

        const blockElement = view.nodeDOM(posInfo.posBeforeNode);
        const blockRect = (blockElement as HTMLElement).getBoundingClientRect();
        let position: "regular" | "left" | "right" = "regular";
        if (
          event.clientX <=
          blockRect.left +
            blockRect.width * PERCENTAGE_OF_BLOCK_WIDTH_CONSIDERED_SIDE_DROP
        ) {
          position = "left";
        }
        if (
          event.clientX >=
          blockRect.right -
            blockRect.width * PERCENTAGE_OF_BLOCK_WIDTH_CONSIDERED_SIDE_DROP
        ) {
          position = "right";
        }

        if (position === "regular") {
          return false;
        }

        const draggedBlock = nodeToBlock(
          slice.content.child(0),
          editor.pmSchema,
        );

        if (blockInfo.blockNoteType === "column") {
          const parentBlock = view.state.doc
            .resolve(blockInfo.bnBlock.beforePos)
            .node();

          const columnList = nodeToBlock<any, any, any>(
            parentBlock,
            editor.pmSchema,
          );

          let sumColumnWidthPercent = 0;
          columnList.children.forEach((column) => {
            sumColumnWidthPercent += column.props.width as number;
          });
          const avgColumnWidthPercent =
            sumColumnWidthPercent / columnList.children.length;

          if (avgColumnWidthPercent < 0.99 || avgColumnWidthPercent > 1.01) {
            const scalingFactor = 1 / avgColumnWidthPercent;

            columnList.children.forEach((column) => {
              column.props.width =
                (column.props.width as number) * scalingFactor;
            });
          }

          const index = columnList.children.findIndex(
            (b) => b.id === blockInfo.bnBlock.node.attrs.id,
          );

          const filteredChildren = columnList.children
            .map((column) => ({
              ...column,
              children: column.children.filter(
                (block) => block.id !== draggedBlock.id,
              ),
            }))
            .filter((column) => column.children.length > 0);
          
          const insertIndex = position === "left" ? index : index + 1;
          const newColumn = {
            type: "column",
            children: [draggedBlock],
            props: {},
            content: undefined,
            id: UniqueID.options.generateID(),
          };
          const newChildren = [
            ...filteredChildren.slice(0, insertIndex),
            newColumn,
            ...filteredChildren.slice(insertIndex),
          ];

          if (editor.getBlock(draggedBlock.id)) {
            editor.removeBlocks([draggedBlock]);
          }

          editor.updateBlock(columnList, {
            children: newChildren,
          });
        } else {
          const block = nodeToBlock(blockInfo.bnBlock.node, editor.pmSchema);

          if (block.id === draggedBlock.id) {
            return;
          }

          const blocks =
            position === "left" ? [draggedBlock, block] : [block, draggedBlock];

          if (editor.getBlock(draggedBlock.id)) {
            editor.removeBlocks([draggedBlock]);
          }

          editor.replaceBlocks(
            [block],
            [
              {
                type: "columnList",
                children: blocks.map((b) => {
                  return {
                    type: "column",
                    children: [b],
                  };
                }),
              },
            ],
          );
        }

        return true;
      },
    },
  });
}

class DropCursorView {
  width: number;
  color: string | undefined;
  class: string | undefined;
  cursorPos:
    | { pos: number; position: "left" | "right" | "regular" }
    | undefined = undefined;
  element: HTMLElement | null = null;
  timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  handlers: { name: string; handler: (event: Event) => void }[];

  constructor(
    readonly editorView: EditorView,
    options: DropCursorOptions,
  ) {
    this.width = options.width ?? 1;
    this.color = options.color === false ? undefined : options.color || "black";
    this.class = options.class;

    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
      const handler = (e: Event) => {
        (this as any)[name](e);
      };
      editorView.dom.addEventListener(
        name,
        handler,
        name === "drop" ? true : undefined,
      );
      return { name, handler };
    });
  }

  destroy() {
    this.handlers.forEach(({ name, handler }) =>
      this.editorView.dom.removeEventListener(
        name,
        handler,
        name === "drop" ? true : undefined,
      ),
    );
  }

  update(editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc !== editorView.state.doc) {
      if (this.cursorPos.pos > editorView.state.doc.content.size) {
        this.setCursor(undefined);
      } else {
        this.updateOverlay();
      }
    }
  }

  setCursor(
    cursorPos:
      | { pos: number; position: "left" | "right" | "regular" }
      | undefined,
  ) {
    if (
      cursorPos === this.cursorPos ||
      (cursorPos?.pos === this.cursorPos?.pos &&
        cursorPos?.position === this.cursorPos?.position)
    ) {
      return;
    }
    this.cursorPos = cursorPos;
    if (!cursorPos) {
      this.element!.parentNode!.removeChild(this.element!);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  updateOverlay() {
    if (!this.cursorPos) {
      throw new Error("updateOverlay called with no cursor position");
    }
    const $pos = this.editorView.state.doc.resolve(this.cursorPos.pos);
    const isBlock = !$pos.parent.inlineContent;
    let rect;
    const editorDOM = this.editorView.dom;
    const editorRect = editorDOM.getBoundingClientRect();
    const scaleX = editorRect.width / editorDOM.offsetWidth;
    const scaleY = editorRect.height / editorDOM.offsetHeight;
    if (isBlock) {
      const before = $pos.nodeBefore;
      const after = $pos.nodeAfter;
      if (before || after) {
        if (
          this.cursorPos.position === "left" ||
          this.cursorPos.position === "right"
        ) {
          const block = this.editorView.nodeDOM(this.cursorPos.pos);

          if (!block) {
            throw new Error("nodeDOM returned null in updateOverlay");
          }

          const blockRect = (block as HTMLElement).getBoundingClientRect();
          const halfWidth = (this.width / 2) * scaleY;
          const left =
            this.cursorPos.position === "left"
              ? blockRect.left
              : blockRect.right;
          rect = {
            left: left - halfWidth,
            right: left + halfWidth,
            top: blockRect.top,
            bottom: blockRect.bottom,
          };
        } else {
          const node = this.editorView.nodeDOM(
            this.cursorPos.pos - (before ? before.nodeSize : 0),
          );
          if (node) {
            const nodeRect = (node as HTMLElement).getBoundingClientRect();

            let top = before ? nodeRect.bottom : nodeRect.top;
            if (before && after) {
              top =
                (top +
                  (
                    this.editorView.nodeDOM(this.cursorPos.pos) as HTMLElement
                  ).getBoundingClientRect().top) /
                2;
            }
            const halfWidth = (this.width / 2) * scaleY;

            if (this.cursorPos.position === "regular") {
              rect = {
                left: nodeRect.left,
                right: nodeRect.right,
                top: top - halfWidth,
                bottom: top + halfWidth,
              };
            }
          }
        }
      }
    }

    if (!rect) {
      const coords = this.editorView.coordsAtPos(this.cursorPos.pos);
      const halfWidth = (this.width / 2) * scaleX;
      rect = {
        left: coords.left - halfWidth,
        right: coords.left + halfWidth,
        top: coords.top,
        bottom: coords.bottom,
      };
    }

    const parent = this.editorView.dom.offsetParent as HTMLElement;
    if (!this.element) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) {
        this.element.className = this.class;
      }
      this.element.style.cssText =
        "position: absolute; z-index: 50; pointer-events: none;";
      if (this.color) {
        this.element.style.backgroundColor = this.color;
      }
    }
    this.element.classList.toggle("prosemirror-dropcursor-block", isBlock);
    this.element.classList.toggle(
      "prosemirror-dropcursor-vertical",
      this.cursorPos.position !== "regular",
    );
    this.element.classList.toggle("prosemirror-dropcursor-inline", !isBlock);
    let parentLeft, parentTop;
    if (
      !parent ||
      (parent === document.body &&
        getComputedStyle(parent).position === "static")
    ) {
      parentLeft = -window.scrollX;
      parentTop = -window.scrollY;
    } else {
      const rect = parent.getBoundingClientRect();
      const parentScaleX = rect.width / parent.offsetWidth;
      const parentScaleY = rect.height / parent.offsetHeight;
      parentLeft = rect.left - parent.scrollLeft * parentScaleX;
      parentTop = rect.top - parent.scrollTop * parentScaleY;
    }
    this.element.style.left = (rect.left - parentLeft) / scaleX + "px";
    this.element.style.top = (rect.top - parentTop) / scaleY + "px";
    this.element.style.width = (rect.right - rect.left) / scaleX + "px";
    this.element.style.height = (rect.bottom - rect.top) / scaleY + "px";
  }

  scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.setCursor(undefined), timeout);
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) {
      return;
    }
    const pos = this.editorView.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });

    const node =
      pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    const disableDropCursor = node && node.type.spec.disableDropCursor;
    const disabled =
      typeof disableDropCursor == "function"
        ? disableDropCursor(this.editorView, pos, event)
        : disableDropCursor;

    if (pos && !disabled) {
      let position: "regular" | "left" | "right" = "regular";
      let target: number | null = pos.pos;

      const posInfo = getTargetPosInfo(this.editorView.state, pos);

      const block = this.editorView.nodeDOM(posInfo.posBeforeNode);
      const blockRect = (block as HTMLElement).getBoundingClientRect();

      if (
        event.clientX <=
        blockRect.left +
          blockRect.width * PERCENTAGE_OF_BLOCK_WIDTH_CONSIDERED_SIDE_DROP
      ) {
        position = "left";
        target = posInfo.posBeforeNode;
      }
      if (
        event.clientX >=
        blockRect.right -
          blockRect.width * PERCENTAGE_OF_BLOCK_WIDTH_CONSIDERED_SIDE_DROP
      ) {
        position = "right";
        target = posInfo.posBeforeNode;
      }

      if (
        position === "regular" &&
        this.editorView.dragging &&
        this.editorView.dragging.slice
      ) {
        const point = dropPoint(
          this.editorView.state.doc,
          target,
          this.editorView.dragging.slice,
        );

        if (point != null) {
          target = point;
        }
      }

      this.setCursor({ pos: target, position });
      this.scheduleRemoval(5000);
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop() {
    this.setCursor(undefined);
  }

  dragleave(event: DragEvent) {
    if (
      event.target === this.editorView.dom ||
      !this.editorView.dom.contains((event as any).relatedTarget)
    ) {
      this.setCursor(undefined);
    }
  }
}

function getTargetPosInfo(
  state: EditorState,
  eventPos: { pos: number; inside: number },
) {
  const blockPos = getNearestBlockPos(state.doc, eventPos.pos);

  let resolved = state.doc.resolve(blockPos.posBeforeNode);
  if (resolved.parent.type.name === "column") {
    resolved = state.doc.resolve(resolved.before());
  }
  return {
    posBeforeNode: resolved.pos,
    node: resolved.nodeAfter!,
  };
}