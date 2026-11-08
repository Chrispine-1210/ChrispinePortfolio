import { and, asc, eq, or } from "drizzle-orm";
import {
  caseStudies,
  type CaseStudy,
  type PortfolioProject,
} from "../../shared/schema.js";
import { db } from "../db.js";
import { seedPortfolioProjects } from "../seed-data.js";

function fallbackProjects(): PortfolioProject[] {
  return seedPortfolioProjects.map((project, index) => ({
    ...project,
    id: `approved-case-study-${index + 1}`,
    challenge: project.challenge ?? null,
    solution: project.solution ?? null,
    outcome: project.outcome ?? null,
    techStack: project.techStack ?? [],
    featuredImage: null,
    images: project.images ?? [],
    liveUrl: project.liveUrl ?? null,
    githubUrl: project.githubUrl ?? null,
    featured: project.featured ?? false,
    order: project.order ?? index,
    createdAt: new Date("2026-08-31T00:00:00Z"),
    updatedAt: new Date("2026-08-31T00:00:00Z"),
  }));
}

function toPublicPortfolioProject(record: CaseStudy): PortfolioProject {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    description: record.summary,
    challenge: record.challenge,
    solution: record.solution,
    outcome: record.outcome,
    category: record.category,
    techStack: record.technologies,
    featuredImage: record.featuredImage,
    images: record.images,
    liveUrl: record.liveUrl,
    githubUrl: record.githubUrl,
    featured: record.featured,
    order: record.order,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function isMissingCaseStudyTable(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01",
  );
}

export async function listPublicCaseStudies(): Promise<PortfolioProject[]> {
  if (!process.env.DATABASE_URL) return fallbackProjects();
  try {
    const records = await db
      .select()
      .from(caseStudies)
      .where(
        and(
          eq(caseStudies.workflowStatus, "published"),
          eq(caseStudies.visibility, "public"),
          eq(caseStudies.evidenceGateStatus, "approved"),
        ),
      )
      .orderBy(asc(caseStudies.order), asc(caseStudies.title));
    return records.map(toPublicPortfolioProject);
  } catch (error) {
    if (isMissingCaseStudyTable(error)) return fallbackProjects();
    throw error;
  }
}

export async function getPublicCaseStudyBySlug(
  slug: string,
): Promise<PortfolioProject | undefined> {
  if (!process.env.DATABASE_URL) {
    return fallbackProjects().find((record) => record.slug === slug);
  }
  try {
    const [record] = await db
      .select()
      .from(caseStudies)
      .where(
        and(
          eq(caseStudies.slug, slug),
          eq(caseStudies.workflowStatus, "published"),
          eq(caseStudies.evidenceGateStatus, "approved"),
          or(
            eq(caseStudies.visibility, "public"),
            eq(caseStudies.visibility, "unlisted"),
          ),
        ),
      )
      .limit(1);
    return record ? toPublicPortfolioProject(record) : undefined;
  } catch (error) {
    if (isMissingCaseStudyTable(error)) {
      return fallbackProjects().find((record) => record.slug === slug);
    }
    throw error;
  }
}
