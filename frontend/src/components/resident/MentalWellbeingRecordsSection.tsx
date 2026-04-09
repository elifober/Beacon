import { useEffect, useState } from "react";
import type { ProcessRecordingRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { ResidentRecordModal } from "./ResidentRecordModal";
import { clip, dashIfEmpty, fmtBool, formatDate } from "./residentRecordFormat";

const MODAL_PAGE_SIZE = 10;

function NarrativeDetailsCell({ text }: { text: string | null | undefined }) {
  const body = text?.trim() ?? "";
  if (!body) {
    return <span className="text-muted">{"\u2014"}</span>;
  }
  return (
    <details className="mental-wellbeing-narrative-details">
      <summary
        className="mental-wellbeing-narrative-summary"
        aria-label="Show or hide full session narrative"
      >
        Details
      </summary>
      <div className="mental-wellbeing-narrative-body">{body}</div>
    </details>
  );
}

type Props = { records: ProcessRecordingRow[] };

export function MentalWellbeingRecordsSection({ records }: Props) {
  const [open, setOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const count = records.length;

  useEffect(() => {
    if (open) setModalPage(1);
  }, [open]);

  const totalPages = Math.max(1, Math.ceil(count / MODAL_PAGE_SIZE));
  const currentPage = Math.min(Math.max(modalPage, 1), totalPages);
  const startIndex = (currentPage - 1) * MODAL_PAGE_SIZE;
  const pagedRecords = records.slice(startIndex, startIndex + MODAL_PAGE_SIZE);

  return (
    <>
      <div className="card shadow-sm beacon-detail-card resident-record-preview-card h-100">
        <div className="card-body d-flex flex-column">
          <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
            <div>
              <h3 className="h5 mb-1 fw-semibold">Mental Wellbeing</h3>
              <p className="text-muted small mb-0">
                {count === 1 ? "1 record" : `${count} records`}
              </p>
            </div>
            <span className="badge bg-secondary rounded-pill flex-shrink-0 align-self-start">
              {count}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-auto"
            onClick={() => setOpen(true)}
          >
            View
          </button>
        </div>
      </div>

      <ResidentRecordModal
        title="Mental Wellbeing"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No mental wellbeing records.</p>
          ) : (
            <>
              <table className="table table-sm table-striped table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Session date</th>
                    <th>Social worker</th>
                    <th>Type</th>
                    <th>Minutes</th>
                    <th>Emotion (start)</th>
                    <th>Emotion (end)</th>
                    <th>Progress</th>
                    <th>Concerns</th>
                    <th>Referral</th>
                    <th>Interventions</th>
                    <th>Follow-up</th>
                    <th>Narrative</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecords.map((p) => (
                    <tr key={p.recordingId}>
                      <td>{formatDate(p.sessionDate)}</td>
                      <td>{dashIfEmpty(p.socialWorker)}</td>
                      <td>{dashIfEmpty(p.sessionType)}</td>
                      <td>{p.sessionDurationMinutes ?? "\u2014"}</td>
                      <td>{clip(p.emotionalStateObserved, 40)}</td>
                      <td>{clip(p.emotionalStateEnd, 40)}</td>
                      <td>{fmtBool(p.progressNoted)}</td>
                      <td>{fmtBool(p.concernsFlagged)}</td>
                      <td>{fmtBool(p.referralMade)}</td>
                      <td title={p.interventionsApplied ?? ""}>
                        {clip(p.interventionsApplied)}
                      </td>
                      <td title={p.followUpActions ?? ""}>{clip(p.followUpActions)}</td>
                      <td className="align-top">
                        <NarrativeDetailsCell text={p.sessionNarrative} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                className="mt-3 d-flex justify-content-center pb-2"
                page={currentPage}
                pageSize={MODAL_PAGE_SIZE}
                totalCount={count}
                onPageChange={setModalPage}
              />
            </>
          )}
        </div>
      </ResidentRecordModal>
    </>
  );
}
