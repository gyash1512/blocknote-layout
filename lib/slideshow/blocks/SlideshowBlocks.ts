import { createBlockSpecFromTiptapNode } from "@blocknote/core";
import { Node } from "@tiptap/core";
import { Slide } from "../pm-nodes/Slide.js";
import { Slideshow } from "../pm-nodes/Slideshow.js";

export const SlideBlock = createBlockSpecFromTiptapNode(
  {
    node: Slide as unknown as Node,
    type: "slide",
    content: "none",
  },
  {
    slideNumber: {
      default: 1,
    },
    notes: {
      default: "",
    },
  },
);

export const SlideshowBlock = createBlockSpecFromTiptapNode(
  {
    node: Slideshow as unknown as Node,
    type: "slideshow",
    content: "inline",
  },
  {
    canvasId: {
      default: "" as string,
    },
    title: {
      default: "Untitled Slideshow",
    },
    theme: {
      default: "white",
    },
  },
);
