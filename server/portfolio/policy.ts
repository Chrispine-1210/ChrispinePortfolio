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
  const activeEvidence = evidence.filter(
    (record) => record.disclosureStatus !== "withdrawn",
  );
  if (!activeEvidence.length) {
    reasons.push("At least one active evidence record is required.");
  }

  const unresolvedVerification = activeEvidence.filter(
    (record) => !verifiedStatuses.has(record.verificationStatus),
  ).length;
  if (unresolvedVerification) {
    reasons.push(`${unresolvedVerification} evidence record(s) are not verified.`);
  }

  const unresolvedDisclosure = activeEvidence.filter(
    (record) => !resolvedDisclosureStatuses.has(record.disclosureStatus),
  ).length;
  if (unresolvedDisclosure) {
    reasons.push(`${unresolvedDisclosure} evidence record(s) have unresolved disclosure status.`);
  }

  const approvedPublicClaims = activeEvidence.filter(
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
