import { createStudioExtensions } from "./studio-extensions";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImagePlus,
  Link2,
  Table2,
  Eraser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "./ImagePicker";
import { RichContent } from "@/components/editorial/RichContent";
import { editorialPhotos } from "@/components/EditorialPhoto";
import {
  encodeEditorial,
  EDITORIAL_PREFIX,
  fonts,
  fontSizes,
  metadataFor,
  readEditorial,
  safeImage,
  safeLink,
  type RichNode,
} from "@shared/editorial";
import "@/styles/content-studio.css";

const emptyImage = { src: "", alt: "", caption: "", credit: "", creditUrl: "" };

export default function RichTextEditor({
  value,
  onChange,
  label = "Document",
  compact = false,
  allowUploads = true,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  compact?: boolean;
  allowUploads?: boolean;
}) {
  const initial = readEditorial(value, true),
    valueRef = useRef(value),
    onChangeRef = useRef(onChange),
    position = useRef(0),
    editingImage = useRef(false);
  valueRef.current = value;
  onChangeRef.current = onChange;
  const [mode, setMode] = useState<"visual" | "markdown" | "preview">(
    value && !initial ? "markdown" : "visual",
  );
  const [imageOpen, setImageOpen] = useState(false),
    [image, setImage] = useState(emptyImage),
    [link, setLink] = useState<string | null>(null),
    [error, setError] = useState("");
  const editor = useEditor({
    extensions: createStudioExtensions(),
    content:
      initial?.content ?? (value.startsWith(EDITORIAL_PREFIX) ? "" : value),
    contentType: initial?.format === "richtext" ? "json" : "markdown",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": `${label} visual editor`,
        class: "studio-document",
      },
    },
    onUpdate: ({ editor }) => {
      const content = encodeEditorial(
        editor.getJSON() as RichNode,
        metadataFor(valueRef.current),
      );
      onChangeRef.current(content);
    },
  });
  useEffect(() => {
    if (!editor) return;
    const parsed = readEditorial(value, true),
      body = parsed?.content ?? value;
    if (value.startsWith(EDITORIAL_PREFIX) && !parsed) return;
    if (parsed?.format === "richtext") {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(body))
        editor.commands.setContent(body, { emitUpdate: false });
    } else if (mode === "visual")
      editor.commands.setContent(body, {
        contentType: "markdown",
        emitUpdate: false,
      });
  }, [editor, value, mode]);
  function visual() {
    setError("");
    const parsed = readEditorial(value, true);
    if (value.startsWith(EDITORIAL_PREFIX) && !parsed) {
      setError(
        "This document contains unsupported formatting. Clear formatting or remove the unsupported image before saving.",
      );
      return;
    }
    if (editor)
      editor.commands.setContent(parsed?.content ?? value, {
        contentType: parsed?.format === "richtext" ? "json" : "markdown",
        emitUpdate: false,
      });
    setMode("visual");
  }
  function imagePanel() {
    if (!editor) return;
    position.current = editor.state.selection.from;
    editingImage.current = editor.isActive("image");
    const current = editingImage.current ? editor.getAttributes("image") : null;
    setImage(current ? { ...emptyImage, ...current } : emptyImage);
    setImageOpen(true);
  }
  function insertImage() {
    if (!editor || !safeImage(image.src) || !image.alt.trim()) return;
    const match = Object.values(editorialPhotos).find(
      (p) => p.src === image.src,
    );
    const data = {
      ...image,
      alt: image.alt.trim(),
      credit: image.credit || match?.author || "",
      creditUrl:
        image.creditUrl ||
        (match ? `https://unsplash.com/photos/${match.slug}` : ""),
    };
    if (data.creditUrl && !safeLink(data.creditUrl)) {
      setError("Use an HTTPS source-credit link.");
      return;
    }
    const chain = editor.chain().focus();
    if (editingImage.current)
      chain
        .setNodeSelection(position.current)
        .updateAttributes("image", data)
        .run();
    else
      chain
        .setTextSelection(position.current)
        .setImage({ ...data, width: 100, alignment: "center" } as typeof data)
        .run();
    setImageOpen(false);
  }
  const tool = (
    name: string,
    icon: React.ReactNode,
    action: () => unknown,
    active = false,
    disabled = false,
  ) => (
    <button
      type="button"
      aria-label={name}
      title={name}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        setError("");
        action();
      }}
    >
      {icon}
    </button>
  );
  return (
    <section
      className={`content-studio ${compact ? "compact" : ""}`}
      aria-label={label}
    >
      <div className="studio-heading">
        <strong>{label}</strong>
        <div
          className="studio-modes"
          role="group"
          aria-label={`${label} editing mode`}
        >
          <button
            type="button"
            aria-pressed={mode === "visual"}
            onClick={visual}
          >
            Visual
          </button>
          {(!value.startsWith(EDITORIAL_PREFIX) ||
            initial?.format === "markdown") && (
            <button
              type="button"
              aria-pressed={mode === "markdown"}
              onClick={() => setMode("markdown")}
            >
              Markdown
            </button>
          )}
          <button
            type="button"
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>
      {mode === "visual" && editor && (
        <>
          <div
            className="studio-toolbar"
            role="group"
            aria-label={`${label} formatting`}
          >
            <label>
              Style
              <select
                aria-label={`${label} paragraph style`}
                value={
                  editor.isActive("heading")
                    ? String(editor.getAttributes("heading").level)
                    : "paragraph"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "paragraph")
                    editor.chain().focus().setParagraph().run();
                  else
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: Number(v) as 1 | 2 | 3 })
                      .run();
                }}
              >
                <option value="paragraph">Paragraph</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>
            </label>
            <label>
              Font
              <select
                aria-label={`${label} font family`}
                value={editor.getAttributes("textStyle").fontFamily ?? fonts[0]}
                onChange={(e) =>
                  editor.chain().focus().setFontFamily(e.target.value).run()
                }
              >
                {fonts.map((f) => (
                  <option key={f} value={f}>
                    {f.split(",")[0]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Size
              <select
                aria-label={`${label} font size`}
                value={editor.getAttributes("textStyle").fontSize ?? "18px"}
                onChange={(e) =>
                  editor.chain().focus().setFontSize(e.target.value).run()
                }
              >
                {fontSizes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            {tool(
              "Bold",
              <Bold size={17} />,
              () => editor.chain().focus().toggleBold().run(),
              editor.isActive("bold"),
            )}
            {tool(
              "Italic",
              <Italic size={17} />,
              () => editor.chain().focus().toggleItalic().run(),
              editor.isActive("italic"),
            )}
            {tool(
              "Underline",
              <Underline size={17} />,
              () => editor.chain().focus().toggleUnderline().run(),
              editor.isActive("underline"),
            )}
            {tool(
              "Strike through",
              <Strikethrough size={17} />,
              () => editor.chain().focus().toggleStrike().run(),
              editor.isActive("strike"),
            )}
            {tool(
              "Bulleted list",
              <List size={17} />,
              () => editor.chain().focus().toggleBulletList().run(),
              editor.isActive("bulletList"),
            )}
            {tool(
              "Numbered list",
              <ListOrdered size={17} />,
              () => editor.chain().focus().toggleOrderedList().run(),
              editor.isActive("orderedList"),
            )}
            {tool(
              "Quote",
              <Quote size={17} />,
              () => editor.chain().focus().toggleBlockquote().run(),
              editor.isActive("blockquote"),
            )}
            {tool(
              "Code block",
              <Code2 size={17} />,
              () => editor.chain().focus().toggleCodeBlock().run(),
              editor.isActive("codeBlock"),
            )}
            {tool("Align left", <AlignLeft size={17} />, () =>
              editor.chain().focus().setTextAlign("left").run(),
            )}
            {tool("Align center", <AlignCenter size={17} />, () =>
              editor.chain().focus().setTextAlign("center").run(),
            )}
            {tool("Align right", <AlignRight size={17} />, () =>
              editor.chain().focus().setTextAlign("right").run(),
            )}
            {tool("Insert or edit image", <ImagePlus size={17} />, imagePanel)}
            {tool(
              "Insert or edit link",
              <Link2 size={17} />,
              () => setLink(editor.getAttributes("link").href ?? ""),
              editor.isActive("link"),
            )}
            {tool("Insert table", <Table2 size={17} />, () =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run(),
            )}
            {tool("Clear formatting", <Eraser size={17} />, () =>
              editor.chain().focus().unsetAllMarks().clearNodes().run(),
            )}
            {tool(
              "Undo",
              <Undo2 size={17} />,
              () => editor.chain().focus().undo().run(),
              false,
              !editor.can().undo(),
            )}
            {tool(
              "Redo",
              <Redo2 size={17} />,
              () => editor.chain().focus().redo().run(),
              false,
              !editor.can().redo(),
            )}
          </div>
          {link !== null && (
            <div className="studio-insert-panel">
              <label>
                Link destination
                <Input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://… or /page"
                />
              </label>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!link) {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .unsetLink()
                      .run();
                    setLink(null);
                  } else if (safeLink(link)) {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .setLink({ href: link })
                      .run();
                    setLink(null);
                  } else setError("Use an HTTPS link or a site path.");
                }}
              >
                Apply link
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLink(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          {imageOpen && (
            <div className="studio-insert-panel">
              <ImagePicker
                allowUploads={allowUploads}
                label="Inline image"
                value={image.src}
                onChange={(src) => setImage((i) => ({ ...i, src }))}
                alt={image.alt}
                onAltChange={(alt) => setImage((i) => ({ ...i, alt }))}
              />
              <label>
                Caption
                <Input
                  value={image.caption}
                  onChange={(e) =>
                    setImage((i) => ({ ...i, caption: e.target.value }))
                  }
                  maxLength={1000}
                />
              </label>
              <div className="studio-two-fields">
                <label>
                  Photo credit
                  <Input
                    value={image.credit}
                    onChange={(e) =>
                      setImage((i) => ({ ...i, credit: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Source URL
                  <Input
                    value={image.creditUrl}
                    onChange={(e) =>
                      setImage((i) => ({ ...i, creditUrl: e.target.value }))
                    }
                  />
                </label>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!safeImage(image.src) || !image.alt.trim()}
                onClick={insertImage}
              >
                Place image
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImageOpen(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          {editor.isActive("image") && (
            <div className="studio-image-placement">
              <span>Selected image</span>
              <label>
                Position
                <select
                  aria-label={`${label} image alignment`}
                  value={editor.getAttributes("image").alignment ?? "center"}
                  onChange={(e) =>
                    editor
                      .chain()
                      .focus()
                      .updateAttributes("image", { alignment: e.target.value })
                      .run()
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label>
                Width
                <select
                  aria-label={`${label} image width`}
                  value={editor.getAttributes("image").width ?? 100}
                  onChange={(e) =>
                    editor
                      .chain()
                      .focus()
                      .updateAttributes("image", {
                        width: Number(e.target.value),
                      })
                      .run()
                  }
                >
                  {[33, 50, 75, 100].map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteSelection().run()}
              >
                Remove selected image
              </Button>
            </div>
          )}
          <EditorContent editor={editor} />
          <p className="studio-help">
            Select text to format it. Select an image to change its position and
            width. Use undo to reverse an edit.
          </p>
        </>
      )}
      {mode === "markdown" && (
        <Textarea
          aria-label={`${label} Markdown source`}
          className="studio-markdown"
          value={typeof initial?.content === "string" ? initial.content : value}
          onChange={(e) =>
            onChange(
              initial
                ? encodeEditorial(e.target.value, initial.metadata)
                : e.target.value,
            )
          }
          placeholder="Write in Markdown or choose Visual…"
        />
      )}
      {mode === "preview" && (
        <div className="studio-preview">
          <RichContent content={value} />
        </div>
      )}
      {value.startsWith(EDITORIAL_PREFIX) && !initial && (
        <p role="alert" className="studio-error">
          This document includes unsupported formatting or an image without a
          valid description. Clear formatting or edit/remove the image before
          saving. Your text remains in the editor.
        </p>
      )}
      {error && (
        <p role="alert" className="studio-error">
          {error}
        </p>
      )}
    </section>
  );
}
