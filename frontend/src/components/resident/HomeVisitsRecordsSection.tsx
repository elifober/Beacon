import { useEffect, useState } from "react";
import type { HomeVisitationRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { AddHomeVisitationModal } from "./AddHomeVisitationModal";
import { InlineDetailsCell } from "./InlineDetailsCell";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  clip,
  dashIfEmpty,
  fmtBool,
  formatDate,
  RESIDENT_RECORD_MODAL_PAGE_SIZE,
} from "./residentRecordFormat";

type Props = {
  records: HomeVisitationRow[];
  residentId: number;
  onRecordsChanged: () => void;
};

export function HomeVisitsRecordsSection({ records, residentId, onRecordsChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HomeVisitationRow | null>(null);
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
              <h3 className="h5 mb-1 fw-semibold">Home Visits</h3>
              <p className="text-muted small mb-0">
                {count === 1 ? "1 record" : `${count} records`}
              </p>
            </div>
            <span className="badge bg-secondary rounded-pill flex-shrink-0 align-self-start">
              {count}
            </span>
          </div>
          <div className="d-flex gap-2 mt-auto">
            <button
              type="button"
              className="btn btn-primary flex-grow-1"
              onClick={() => setOpen(true)}
            >
              View
            </button>
            <button
              type="button"
              className="btn btn-outline-primary flex-grow-1"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <AddHomeVisitationModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initialResidentId={Number.isFinite(residentId) ? residentId : undefined}
        existingRecord={editing}
        onCreated={onRecordsChanged}
      />

      <ResidentRecordModal
        title="Home Visits"
        open={open}
        onClose={() => setOpen(false)}
        belowCard={belowCard}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No home visits.</p>
          ) : (
            <table className="table table-sm table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Visit date</th>
                  <th>Social worker</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Family cooperation</th>
                  <th>Safety concern</th>
                  <th>Follow-up</th>
                  <th>Outcome</th>
                  <th>Follow-up notes</th>
                  <th>Observations</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((v) => (
                  <tr key={v.visitationId}>
                    <td>{formatDate(v.visitDate)}</td>
                    <td>{dashIfEmpty(v.socialWorker)}</td>
                    <td>{dashIfEmpty(v.visitType)}</td>
                    <td>{clip(v.locationVisited, 60)}</td>
                    <td>{dashIfEmpty(v.familyCooperationLevel)}</td>
                    <td>{fmtBool(v.safetyConcernsNoted)}</td>
                    <td>{fmtBool(v.followUpNeeded)}</td>
                    <td>{clip(v.visitOutcome)}</td>
                    <td title={v.followUpNotes ?? ""}>{clip(v.followUpNotes)}</td>
                    <td className="align-middle text-center">
                      <InlineDetailsCell
                        text={v.observations}
                        ariaLabel="Show or hide full visit observations"
                      />
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setOpen(false);
                          setEditing(v);
                          setFormOpen(true);
                        }}
                      >
                        Update
                      </button>
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
