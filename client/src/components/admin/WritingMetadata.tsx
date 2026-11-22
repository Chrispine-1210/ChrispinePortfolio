import {
  metadataFor,
  editorialMetadata,
  EDITORIAL_PREFIX,
  readEditorial,
  updateEditorialMetadata,
  writingKinds,
  writingLabels,
  type EditorialMetadata,
} from "@shared/editorial";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function WritingMetadata({
  content,
  onChange,
}: {
  content: string;
  onChange: (v: string) => void;
}) {
  const metadata = metadataFor(content);
  const validation = editorialMetadata.safeParse(metadata);
  const errors = validation.success ? [] : validation.error.issues;
  const unreadable =
    content.startsWith(EDITORIAL_PREFIX) && !readEditorial(content, true);
  const set = (patch: Partial<EditorialMetadata>) =>
    onChange(updateEditorialMetadata(content, patch));
  return (
    <section
      className="studio-metadata"
      aria-label="Writing type and publication reference"
    >
      {unreadable && (
        <p role="alert" className="studio-error">
          Correct the document formatting or size before editing its publication
          reference. The original source is preserved.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          Writing type
          <select
            value={metadata.kind}
            onChange={(e) =>
              set({ kind: e.target.value as EditorialMetadata["kind"] })
            }
          >
            {writingKinds.map((k) => (
              <option key={k} value={k}>
                {writingLabels[k]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Authors
          <Input
            value={metadata.authors ?? ""}
            onChange={(e) => set({ authors: e.target.value })}
            placeholder="Chrispine Mndala"
            maxLength={500}
          />
        </label>
      </div>
      {(["research", "publication"].includes(metadata.kind) ||
        errors.length > 0) && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label>
              Publication status
              <select
                value={metadata.publicationStatus}
                onChange={(e) =>
                  set({
                    publicationStatus: e.target
                      .value as EditorialMetadata["publicationStatus"],
                  })
                }
              >
                <option value="working_paper">Working paper</option>
                <option value="preprint">Preprint</option>
                <option value="published">Published</option>
                <option value="peer_reviewed">Peer-reviewed publication</option>
              </select>
            </label>
            <label>
              Journal, institution or repository
              <Input
                value={metadata.venue ?? ""}
                onChange={(e) => set({ venue: e.target.value })}
                maxLength={250}
              />
            </label>
            <label>
              DOI (identifier only)
              <Input
                value={metadata.doi ?? ""}
                onChange={(e) => {
                  const doi = e.target.value.replace(
                    /^https?:\/\/(?:dx\.)?doi\.org\//i,
                    "",
                  );
                  set({ doi });
                }}
                placeholder="10.1234/example"
                maxLength={300}
                aria-invalid={errors.some((e) => e.path[0] === "doi")}
              />
              {errors
                .filter((e) => e.path[0] === "doi")
                .map((e) => (
                  <span role="alert" className="studio-error" key={e.message}>
                    {e.message}
                  </span>
                ))}
            </label>
            <label>
              Publication or repository URL
              <Input
                value={metadata.publicationUrl ?? ""}
                onChange={(e) => set({ publicationUrl: e.target.value })}
                placeholder="https://…"
                maxLength={2000}
                aria-invalid={errors.some(
                  (e) => e.path[0] === "publicationUrl",
                )}
              />
              {errors
                .filter((e) => e.path[0] === "publicationUrl")
                .map((e) => (
                  <span role="alert" className="studio-error" key={e.message}>
                    {e.message}
                  </span>
                ))}
            </label>
          </div>
          <label className="mt-4">
            Citation
            <Textarea
              value={metadata.citation ?? ""}
              onChange={(e) => set({ citation: e.target.value })}
              placeholder="Author. Year. Title. Journal or repository. DOI."
              rows={3}
              maxLength={4000}
            />
          </label>
          <p>
            Use the status and citation shown by the original source. An ORCID
            iD identifies the author; it does not establish peer review. Drafts
            still follow the existing review and publication workflow.
          </p>
        </>
      )}
    </section>
  );
}
