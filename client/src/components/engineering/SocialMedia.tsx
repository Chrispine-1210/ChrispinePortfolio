import { useState } from "react";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import { mediaReference } from "@shared/engineering";

export function SocialMedia({ url, title }: { url: string; title: string }) {
  const [enabled, setEnabled] = useState(false);
  const media = mediaReference(url);
  if (!media) return null;
  if (!media.embedUrl)
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-current/20 px-4 py-3 text-sm font-medium"
      >
        View the original social post <ArrowUpRight className="h-4 w-4" />
      </a>
    );
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-950">
      {enabled ? (
        <iframe
          title={title}
          src={media.embedUrl}
          className="aspect-video min-h-[200px] w-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className="flex aspect-video min-h-[200px] w-full flex-col items-center justify-center gap-3 p-6 text-white hover:bg-slate-900 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-400"
        >
          <PlayCircle className="h-14 w-14 text-amber-300" />
          <span className="text-lg font-semibold">
            Watch the practical walkthrough
          </span>
          <span className="max-w-lg text-xs leading-relaxed text-slate-400">
            Load {media.provider === "youtube" ? "YouTube" : "Vimeo"} only when
            you choose to play. Your browser then connects to that platform.
          </span>
        </button>
      )}
    </div>
  );
}
