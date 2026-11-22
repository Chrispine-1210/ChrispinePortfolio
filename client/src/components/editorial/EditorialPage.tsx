import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@shared/schema";
import {
  getCaseStudyCover,
  projectEditorialPhoto,
} from "@/components/CaseStudyCover";
import { editorialPhotos, PhotoCredit } from "@/components/EditorialPhoto";
import "@/styles/editorial.css";

export function EditorialPage({ children }: { children: ReactNode }) {
  return (
    <div className="editorial-page">
      <div className="editorial-shell">{children}</div>
    </div>
  );
}

export function ProjectReadingCard({
  project,
  index,
}: {
  project: PortfolioProject;
  index?: number;
}) {
  const cover = getCaseStudyCover(project);
  const [name, ...subject] = project.title.split(" — ");
  const diagram = cover?.src.endsWith("-architecture.svg");
  const photo = diagram ? projectEditorialPhoto(project) : cover.photo;
  const thumbnail = diagram ? editorialPhotos[photo!] : cover;
  return (
    <article className="editorial-project">
      <Link
        href={`/portfolio/${project.slug}`}
        className="editorial-project-image"
        aria-label={`Read case study: ${project.title}`}
      >
        <div className="editorial-image-label">
          <span>
            {photo
              ? "Editorial photograph"
              : cover?.isIllustration
                ? "Editorial illustration"
                : "Project cover"}
          </span>
          <ArrowUpRight size={16} />
        </div>
        {cover ? (
          <img
            src={thumbnail.src}
            alt={thumbnail.alt}
            loading="lazy"
            decoding="async"
            style={photo ? { objectFit: "cover", padding: 0 } : undefined}
          />
        ) : (
          <span className="editorial-image-placeholder">{name}</span>
        )}
      </Link>
      <div className="editorial-project-copy">
        <div className="editorial-eyebrow">
          <span>{project.category}</span>
          {index !== undefined && (
            <span>{String(index + 1).padStart(2, "0")}</span>
          )}
        </div>
        <h3>
          <Link href={`/portfolio/${project.slug}`}>
            {name}
            <ArrowUpRight size={21} />
          </Link>
        </h3>
        {subject.length > 0 && (
          <p className="editorial-project-subject">{subject.join(" — ")}</p>
        )}
        <p className="editorial-copy">{project.description}</p>
        {photo && (
          <p className="editorial-copy" style={{ fontSize: 14, marginTop: 12 }}>
            <PhotoCredit photo={photo} />
            {diagram &&
              ". Architecture and evidence are inside the case study."}
          </p>
        )}
        <ul className="editorial-tags" aria-label="Technologies">
          {(project.techStack ?? []).slice(0, 4).map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
        <Link
          href={`/portfolio/${project.slug}`}
          className="editorial-text-link"
        >
          Read case study <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
