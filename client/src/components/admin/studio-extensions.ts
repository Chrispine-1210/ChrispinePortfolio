import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";

const EditorialImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        renderHTML: (a) => ({
          style: `width:${[33, 50, 75, 100].includes(Number(a.width)) ? a.width : 100}%`,
        }),
      },
      alignment: {
        default: "center",
        renderHTML: (a) => ({ "data-alignment": a.alignment }),
      },
      caption: { default: "", renderHTML: () => ({}) },
      credit: { default: "", renderHTML: () => ({}) },
      creditUrl: { default: "", renderHTML: () => ({}) },
    };
  },
});
export function createStudioExtensions() {
  return [
    StarterKit.configure({
      link: { openOnClick: false, autolink: false, protocols: ["https"] },
    }),
    EditorialImage.configure({ allowBase64: true }),
    TextStyleKit.configure({
      backgroundColor: false,
      color: false,
      lineHeight: false,
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TableKit.configure({ table: { resizable: false } }),
    Markdown,
  ];
}
