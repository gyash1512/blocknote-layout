import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SpreadsheetNodeView from "../components/SpreadsheetNodeView.js";

export const Spreadsheet = Node.create({
    name: "spreadsheet",
    group: "blockContent",
    content: "",  // Changed from "inline*" to match block spec content: "none"
    draggable: true,

    addAttributes() {
        return {
            columns: {
                default: "[]",
                parseHTML: (element) => element.getAttribute("data-columns") || "[]",
                renderHTML: (attributes) => ({
                    "data-columns": attributes.columns as string,
                }),
            },
            data: {
                default: "[]",
                parseHTML: (element) => element.getAttribute("data-sw-data") || "[]",
                renderHTML: (attributes) => ({
                    "data-sw-data": attributes.data as string,
                }),
            },
            title: {
                default: "Untitled Spreadsheet",
                parseHTML: (element) => element.getAttribute("data-title") || "Untitled Spreadsheet",
                renderHTML: (attributes) => ({
                    "data-title": attributes.title as string,
                }),
            },
            // Settings for charts (e.g. { type: 'bar', xKey: 'name', yKey: 'value' })
            settings: {
                default: "{}",
                parseHTML: (element) => element.getAttribute("data-settings") || "{}",
                renderHTML: (attributes) => ({
                    "data-settings": attributes.settings as string,
                }),
            },
            // Cell metadata for styling (bold, italic, colors, etc.)
            meta: {
                default: "{}",
                parseHTML: (element) => element.getAttribute("data-meta") || "{}",
                renderHTML: (attributes) => ({
                    "data-meta": attributes.meta as string,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "div[data-content-type=spreadsheet]",
            },
        ];
    },

    renderHTML() {
        const div = document.createElement('div');
        div.setAttribute('data-content-type', 'spreadsheet');
        return {
            dom: div,
            contentDOM: undefined,  // No content DOM since we have no inline content
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(SpreadsheetNodeView);
    },
});
