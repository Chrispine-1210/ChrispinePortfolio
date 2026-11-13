import { and, asc, eq, or } from "drizzle-orm";
import {
  caseStudies,
  caseStudyEvidence,
  type CaseStudy,
  type PortfolioProject,
  type PublicPortfolioProject,
} from "../../shared/schema.js";
import { db } from "../db.js";

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

export async function listPublicCaseStudies(): Promise<PortfolioProject[]> {
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
}

export async function getPublicCaseStudyBySlug(
  slug: string,
): Promise<PublicPortfolioProject | undefined> {
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
  if (!record) return undefined;

  const evidence = await db
    .select({
      id: caseStudyEvidence.id,
      claim: caseStudyEvidence.claim,
      claimType: caseStudyEvidence.claimType,
      sourceType: caseStudyEvidence.sourceType,
      verificationStatus: caseStudyEvidence.verificationStatus,
      verifiedAt: caseStudyEvidence.verifiedAt,
    })
    .from(caseStudyEvidence)
    .where(
      and(
        eq(caseStudyEvidence.caseStudyId, record.id),
        eq(caseStudyEvidence.disclosureStatus, "approved_public"),
        or(
          eq(caseStudyEvidence.verificationStatus, "internally_verified"),
          eq(caseStudyEvidence.verificationStatus, "externally_verified"),
        ),
      ),
    )
    .orderBy(asc(caseStudyEvidence.createdAt));

  return { ...toPublicPortfolioProject(record), evidence };
}
