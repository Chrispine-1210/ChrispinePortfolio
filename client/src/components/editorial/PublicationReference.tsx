import { useState } from "react";
import { authorResearch, type EditorialMetadata } from "@shared/editorial";

export function PublicationReference({
  metadata,
}: {
  metadata: EditorialMetadata;
}) {
  const [status, setStatus] = useState("");
  if (!["research", "publication"].includes(metadata.kind)) return null;
  const states = {
    working_paper: "Working paper",
    preprint: "Preprint",
    published: "Published",
    peer_reviewed: "Peer-reviewed publication",
  };
  return (
    <section
      className="publication-reference"
      aria-label="Publication reference"
    >
      <h2>Publication reference</h2>
      <dl>
        <dt>Authors</dt>
        <dd>{metadata.authors || authorResearch.name}</dd>
        <dt>Status</dt>
        <dd>{states[metadata.publicationStatus]}</dd>
        {metadata.venue && (
          <>
            <dt>Source</dt>
            <dd>{metadata.venue}</dd>
          </>
        )}
        {metadata.doi && (
          <>
            <dt>DOI</dt>
            <dd>
              <a
                href={`https://doi.org/${metadata.doi}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {metadata.doi}
              </a>
            </dd>
          </>
        )}
        {metadata.publicationUrl && (
          <>
            <dt>Original</dt>
            <dd>
              <a
                href={metadata.publicationUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the source publication
              </a>
            </dd>
          </>
        )}
        <dt>ORCID</dt>
        <dd>
          <a
            href={authorResearch.orcidUrl}
            target="_blank"
            rel="me noopener noreferrer"
          >
            Chrispine Mndala · {authorResearch.orcid}
          </a>
        </dd>
      </dl>
      {metadata.citation && (
        <>
          <blockquote>{metadata.citation}</blockquote>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(metadata.citation!);
                setStatus("Citation copied.");
              } catch {
                setStatus("Copy the citation text above.");
              }
            }}
          >
            Copy citation
          </button>
          <p role="status">{status}</p>
        </>
      )}
    </section>
  );
}
