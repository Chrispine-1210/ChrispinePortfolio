import type { CaseStudyEvidence } from "../../shared/schema.js";

export type EvidenceGateResult = {
  status: "approved" | "blocked";
  reasons: string[];
  approvedPublicClaims: number;
};

const verifiedStatuses = new Set(["internally_verified", "externally_verified"]);
const resolvedDisclosureStatuses = new Set(["private", "approved_public"]);

export function evaluateEvidenceGate(
  evidence: Array<Pick<CaseStudyEvidence, "verificationStatus" | "disclosureStatus">>,
): EvidenceGateResult {
  const reasons: string[] = [];
  if (!evidence.length) {
    reasons.push("At least one evidence record is required.");
  }

  const unresolvedVerification = evidence.filter(
    (record) => !verifiedStatuses.has(record.verificationStatus),
  ).length;
  if (unresolvedVerification) {
    reasons.push(`${unresolvedVerification} evidence record(s) are not verified.`);
  }

  const unresolvedDisclosure = evidence.filter(
    (record) => !resolvedDisclosureStatuses.has(record.disclosureStatus),
  ).length;
  if (unresolvedDisclosure) {
    reasons.push(`${unresolvedDisclosure} evidence record(s) have unresolved disclosure status.`);
  }

  const approvedPublicClaims = evidence.filter(
    (record) =>
      verifiedStatuses.has(record.verificationStatus) &&
      record.disclosureStatus === "approved_public",
  ).length;
  if (!approvedPublicClaims) {
    reasons.push("At least one verified evidence record must be approved for public disclosure.");
  }

  return {
    status: reasons.length ? "blocked" : "approved",
    reasons,
    approvedPublicClaims,
  };
}
