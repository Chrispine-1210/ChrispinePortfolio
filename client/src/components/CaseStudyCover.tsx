import educationCover from "@assets/portfolio-editorial/education-workflow.webp";
import operationsCover from "@assets/portfolio-editorial/internal-operations.webp";
import { cn } from "@/lib/utils";
import type { PortfolioProject } from "@shared/schema";
import { editorialPhotos, PhotoCredit } from "@/components/EditorialPhoto";

export function projectEditorialPhoto(project: {
  title: string;
  category?: string;
}): keyof typeof editorialPhotos {
  const subject = `${project.title} ${project.category ?? ""}`.toLowerCase();
  if (/network|infrastructure|server/.test(subject)) return "network";
  if (/hardware|repair|device/.test(subject)) return "hardware";
  if (/education|learning|school/.test(subject)) return "library";
  if (/restaurant|business|enterprise|agro|operations/.test(subject))
    return "planning";
  return "code";
}
type Cover = {
  src: string;
  alt: string;
  isIllustration: boolean;
  photo?: keyof typeof editorialPhotos;
};

const editorialCovers = new Map([
  [
    "mtendere-education-platform",
    {
      src: educationCover,
      alt: "Illustration of two colleagues reviewing a laptop in an education workspace",
      isIllustration: true,
    },
  ],
  [
    "aothothe-enterprise-os-commercial-foundation",
    {
      src: operationsCover,
      alt: "Illustration of a laptop and notebook on an operations workspace desk",
      isIllustration: true,
    },
  ],
]);

interface CaseStudyCoverProps {
  project: Pick<PortfolioProject, "slug" | "title" | "featuredImage">;
  className?: string;
}

export function getCaseStudyCover(
  project: CaseStudyCoverProps["project"],
): Cover {
  if (project.featuredImage) {
    const match = Object.entries(editorialPhotos).find(
      ([, p]) => p.src === project.featuredImage,
    );
    return {
      src: project.featuredImage,
      alt: match?.[1].alt ?? project.title,
      isIllustration: false,
      photo: match?.[0] as keyof typeof editorialPhotos | undefined,
    };
  }
  const existing = editorialCovers.get(project.slug);
  if (existing) return existing;
  const photo = projectEditorialPhoto(project);
  return { ...editorialPhotos[photo], photo, isIllustration: false };
}

export function CaseStudyCover({ project, className }: CaseStudyCoverProps) {
  const cover = getCaseStudyCover(project);
  if (!cover) return null;

  return (
    <figure
      className={cn("relative aspect-[8/5] overflow-hidden bg-card", className)}
    >
      <img
        src={cover.src}
        alt={cover.alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 h-full w-full ${cover.photo ? "object-cover" : "object-contain"}`}
      />
      {(cover.isIllustration || cover.src.endsWith("-architecture.svg")) && (
        <figcaption className="absolute bottom-3 left-3 rounded-md bg-black/80 px-2.5 py-1 text-xs text-white">
          {cover.isIllustration
            ? "AI-generated illustration"
            : "Architecture diagram · source review"}
        </figcaption>
      )}
      {cover.photo && (
        <figcaption className="absolute bottom-3 left-3 rounded-md bg-black/80 px-3 py-2 text-sm text-white">
          <PhotoCredit photo={cover.photo} />
        </figcaption>
      )}
    </figure>
  );
}
