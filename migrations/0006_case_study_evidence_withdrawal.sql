ALTER TABLE case_study_evidence
  DROP CONSTRAINT IF EXISTS case_study_evidence_disclosure_valid;

ALTER TABLE case_study_evidence
  ADD CONSTRAINT case_study_evidence_disclosure_valid
  CHECK (disclosure_status IN ('private','review','approved_public','rejected','withdrawn'));
