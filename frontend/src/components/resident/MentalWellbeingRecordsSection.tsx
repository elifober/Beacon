import { useEffect, useState } from "react";
import type { ProcessRecordingRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { InlineDetailsCell } from "./InlineDetailsCell";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  clip,
  dashIfEmpty,
  fmtBool,
  formatDate,
  RESIDENT_RECORD_MODAL_PAGE_SIZE,
} from "./residentRecordFormat";

type Props = { records: ProcessRecordingRow[] };

export function MentalWellbeingRecordsSection({ records }: Props) {
  const [open, setOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const count = records.length;
  const pageSize = RESIDENT_RECORD_MODAL_PAGE_SIZE;

  useEffect(() => {
    if (open) setModalPage(1);
  }, [open]);

  const currentPage = Math.min(
    Math.max(modalPage, 1),
    Math.max(1, Math.ceil(count / pageSize)),
  );
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRecords = records.slice(startIndex, startIndex + pageSize);
  const showPagination = count > pageSize;

  const belowCard = showPagination ? (
    <Pagination
      className="d-flex justify-content-center"
      page={currentPage}
      pageSize={pageSize}
      totalCount={count}
      onPageChange={setModalPage}
    />
  ) : undefined;

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
        belowCard={belowCard}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No mental wellbeing records.</p>
          ) : (
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
                    <td className="align-middle text-center">
                      <InlineDetailsCell
                        text={p.sessionNarrative}
                        ariaLabel="Show or hide full session narrative"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ResidentRecordModal>
    </>
  );
}
