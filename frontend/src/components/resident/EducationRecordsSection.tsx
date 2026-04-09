import { useEffect, useState } from "react";
import type { EducationRecordRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { AddEducationRecordModal } from "./AddEducationRecordModal";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  dashIfEmpty,
  fmtNum,
  formatCompletionStatus,
  formatDate,
  RESIDENT_RECORD_MODAL_PAGE_SIZE,
} from "./residentRecordFormat";

type Props = {
  records: EducationRecordRow[];
  residentId: number;
  onEducationRecordsChanged: () => void;
};

export function EducationRecordsSection({
  records,
  residentId,
  onEducationRecordsChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EducationRecordRow | null>(null);
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
              <h3 className="h5 mb-1 fw-semibold">Education</h3>
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

      <AddEducationRecordModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initialResidentId={Number.isFinite(residentId) ? residentId : undefined}
        existingRecord={editing}
        onCreated={onEducationRecordsChanged}
      />

      <ResidentRecordModal
        title="Education"
        open={open}
        onClose={() => setOpen(false)}
        belowCard={belowCard}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No education records.</p>
          ) : (
            <table className="table table-sm table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Level</th>
                  <th>School</th>
                  <th>Enrollment</th>
                  <th>Attendance %</th>
                  <th>Progress %</th>
                  <th>Completion</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((e) => (
                  <tr key={e.educationRecordId}>
                    <td>{formatDate(e.recordDate)}</td>
                    <td>{dashIfEmpty(e.educationLevel)}</td>
                    <td>{dashIfEmpty(e.schoolName)}</td>
                    <td>{dashIfEmpty(e.enrollmentStatus)}</td>
                    <td>{fmtNum(e.attendanceRate)}</td>
                    <td>{fmtNum(e.progressPercent)}</td>
                    <td>{formatCompletionStatus(e.completionStatus)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setOpen(false);
                          setEditing(e);
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
