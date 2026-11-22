import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { editorialPhotos } from "@/components/EditorialPhoto";
import { MAX_IMAGE_BYTES, safeImage } from "@shared/editorial";
import "@/styles/content-studio.css";

async function optimize(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 8_000_000
  )
    throw new Error("Choose a JPEG, PNG or WebP file under 8 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 32_000_000)
      throw new Error("Choose an image smaller than 32 megapixels.");
    const canvas = document.createElement("canvas"),
      scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Image processing is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      const data = canvas.toDataURL("image/webp", quality);
      if ((data.length * 3) / 4 <= MAX_IMAGE_BYTES && safeImage(data))
        return data;
    }
    throw new Error(
      "This image is too detailed for the 160 KB limit. Choose a smaller crop or use its hosted HTTPS URL.",
    );
  } finally {
    bitmap.close();
  }
}

export function ImagePicker({
  value,
  onChange,
  label = "Cover image",
  alt,
  onAltChange,
  allowUploads = true,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  alt?: string;
  onAltChange?: (value: string) => void;
  allowUploads?: boolean;
}) {
  const id = useId(),
    [library, setLibrary] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const selection = useRef(0);
  useEffect(() => {
    selection.current++;
    setFailed(false);
    setBusy(false);
    return () => {
      selection.current++;
    };
  }, [value]);
  function select(src: string) {
    selection.current++;
    setBusy(false);
    onChange(src);
    setFailed(false);
    setError("");
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.target;
    const current = ++selection.current;
    setBusy(true);
    setError("");
    try {
      const result = await optimize(file);
      if (selection.current === current) select(result);
    } catch (e) {
      if (selection.current === current) setError((e as Error).message);
    } finally {
      if (selection.current === current) setBusy(false);
      input.value = "";
    }
  }
  return (
    <section className="studio-image-picker" aria-label={label}>
      <div className="studio-image-preview">
        {value && safeImage(value) && !failed ? (
          <img
            key={value}
            src={value}
            alt={alt || "Selected image preview"}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="studio-image-empty">
            <ImagePlus size={32} />
            <strong>{failed ? "Image could not load" : label}</strong>
            <span>Select a library photo or paste an image URL.</span>
          </div>
        )}
      </div>
      <div className="studio-image-controls">
        <label htmlFor={id}>{label} URL</label>
        <Input
          id={id}
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => select(e.target.value)}
          placeholder={
            value.startsWith("data:")
              ? "Uploaded image ready to save"
              : "https://… or /media/…"
          }
        />
        <div className="studio-image-actions">
          {allowUploads && (
            <label className="studio-upload">
              <Upload size={16} />
              {busy ? "Optimizing…" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={upload}
                disabled={busy}
                aria-label={`Upload ${label.toLowerCase()}`}
              />
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLibrary(!library)}
            aria-expanded={library}
          >
            Photo library
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => select("")}
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X size={16} />
            </Button>
          )}
        </div>
        {onAltChange && (
          <label>
            Description for screen readers
            <Input
              value={alt ?? ""}
              onChange={(e) => onAltChange(e.target.value)}
              maxLength={400}
              placeholder="Describe what the image shows"
            />
          </label>
        )}
        <p className="studio-help">
          Use images you own or have permission to publish.{" "}
          {allowUploads &&
            "Uploads are optimized and stored with the saved revision."}{" "}
          Library photos include source credits.
        </p>
        {busy && <p role="status">Preparing the image…</p>}
        {error && (
          <p role="alert" className="studio-error">
            {error}
          </p>
        )}
        {value && !safeImage(value) && (
          <p role="alert" className="studio-error">
            Enter a valid HTTPS image URL or choose a library image.
          </p>
        )}
      </div>
      {library && (
        <div className="studio-photo-library">
          {Object.entries(editorialPhotos).map(([key, p]) => (
            <button
              type="button"
              key={key}
              onClick={() => {
                select(p.src);
                onAltChange?.(p.alt);
                setLibrary(false);
              }}
            >
              <img src={p.src} alt={p.alt} loading="lazy" />
              <span>{key.replace(/-/g, " ")}</span>
              <small>{p.author} · Unsplash</small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
