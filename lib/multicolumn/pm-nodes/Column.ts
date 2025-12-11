import { Node } from "@tiptap/core";

import { createColumnResizeExtension } from "../extensions/ColumnResizeExtension.js";

export const Column = Node.create({
  name: "column",
  group: "bnBlock childContainer",
  content: "blockContainer+",
  priority: 40,
  defining: true,
  marks: "deletion insertion modification",
  addAttributes() {
    return {
      width: {
        default: 1,
        parseHTML: (element) => {
          const attr = element.getAttribute("data-width");
          if (attr === null) {
            return null;
          }

          const parsed = parseFloat(attr);
          if (isFinite(parsed)) {
            return parsed;
          }

          return null;
        },
        renderHTML: (attributes) => {
          return {
            "data-width": (attributes.width as number).toString(),
            style: `flex-grow: ${attributes.width as number};`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }

          if (element.getAttribute("data-node-type") === this.name) {
            return {};
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const column = document.createElement("div");
    column.className = "bn-block-column";
    column.setAttribute("data-node-type", this.name);
    for (const [attribute, value] of Object.entries(HTMLAttributes)) {
      column.setAttribute(attribute, value as string);
    }

    return {
      dom: column,
      contentDOM: column,
    };
  },

  addExtensions() {
    if (this.options?.editor) {
      return [createColumnResizeExtension(this.options.editor)];
    }
    return [];
  },
});