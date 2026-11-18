import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { EngineeringRecord } from "@shared/engineering";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
export function PresentationStage({
  entry,
  onClose,
}: {
  entry: EngineeringRecord;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0),
    [showNotes, setShowNotes] = useState(false);
  const d = entry.details as {
    sections: string[];
    keyMessage: string;
    runOfShow: string;
    rehearsalNotes: string;
    audience: string;
  };
  const slides = [entry.title, ...d.sections];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setPage((p) => Math.min(slides.length - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slides.length, onClose]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[99] bg-black/80" />
        <Dialog.Content className="fixed inset-0 z-[100] flex flex-col bg-[#0b1724] p-5 text-white sm:p-10">
          <Dialog.Title className="sr-only">
            Presentation rehearsal
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Private outline rehearsal. Use arrow keys to change section, Tab to
            move between controls, and Escape to close.
          </Dialog.Description>
          <header className="flex items-center justify-between gap-5">
            <span className="text-xs uppercase tracking-[.2em] text-amber-200">
              Presentation rehearsal · {entry.context} · Version {entry.version}
            </span>
            <Button
              autoFocus
              variant="ghost"
              onClick={onClose}
              aria-label="Close presentation"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
            <p className="mb-8 text-sm text-slate-400">
              {page === 0
                ? d.audience
                : `Section ${page} of ${slides.length - 1}`}
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              {slides[page]}
            </h2>
            {page === 0 && (
              <p className="mt-8 max-w-3xl text-xl leading-relaxed text-slate-300">
                {d.keyMessage}
              </p>
            )}
            {showNotes && (
              <div className="mt-8 max-h-52 overflow-auto rounded-xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-300">
                <strong className="text-white">
                  Speaker notes / run of show
                </strong>
                <p className="mt-3 whitespace-pre-wrap">{d.runOfShow}</p>
                <p className="mt-3 whitespace-pre-wrap">{d.rehearsalNotes}</p>
              </div>
            )}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-5">
            <Button variant="ghost" onClick={() => setShowNotes((v) => !v)}>
              {showNotes ? "Hide" : "Show"} speaker notes
            </Button>
            <p className="text-xs text-slate-400">
              Arrow keys to move · Escape to close · Outline rehearsal, not a
              slide-file renderer
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                aria-label="Previous section"
                disabled={!page}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {page + 1} / {slides.length}
              </span>
              <Button
                variant="outline"
                aria-label="Next section"
                disabled={page === slides.length - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
