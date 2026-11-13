import educationCover from "@assets/portfolio-editorial/education-workflow.webp";
import operationsCover from "@assets/portfolio-editorial/internal-operations.webp";
import { cn } from "@/lib/utils";
import type { PortfolioProject } from "@shared/schema";

const editorialCovers = new Map([
  ["mtendere-education-platform", {
    src: educationCover,
    alt: "Illustration of two colleagues reviewing a laptop in an education workspace",
    isIllustration: true,
  }],
  ["aothothe-enterprise-os-commercial-foundation", {
    src: operationsCover,
    alt: "Illustration of a laptop and notebook on an operations workspace desk",
    isIllustration: true,
  }],
]);

interface CaseStudyCoverProps {
  project: Pick<PortfolioProject, "slug" | "title" | "featuredImage">;
  className?: string;
}

export function getCaseStudyCover(project: CaseStudyCoverProps["project"]) {
  return project.featuredImage
    ? { src: project.featuredImage, alt: project.title, isIllustration: false }
    : editorialCovers.get(project.slug);
}

export function CaseStudyCover({ project, className }: CaseStudyCoverProps) {
  const cover = getCaseStudyCover(project);
  if (!cover) return null;

  return (
    <figure className={cn("relative aspect-[8/5] overflow-hidden bg-card", className)}>
      <img
        src={cover.src}
        alt={cover.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {cover.isIllustration && (
        <figcaption className="absolute bottom-3 left-3 rounded-md bg-black/80 px-2.5 py-1 text-xs text-white">
          AI-generated illustration
        </figcaption>
      )}
    </figure>
  );
}
