import { useEffect, useState } from "react";
import type { HealthWellbeingRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  fmtBool,
  fmtNum,
  formatDate,
  formatHealthNotesCell,
  RESIDENT_RECORD_MODAL_PAGE_SIZE,
} from "./residentRecordFormat";

type Props = { records: HealthWellbeingRow[] };

export function HealthRecordsSection({ records }: Props) {
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
              <h3 className="h5 mb-1 fw-semibold">Health</h3>
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
        title="Health"
        open={open}
        onClose={() => setOpen(false)}
        belowCard={belowCard}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No health records.</p>
          ) : (
            <table className="table table-sm table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>General</th>
                  <th>Nutrition</th>
                  <th>Sleep</th>
                  <th>Energy</th>
                  <th>Ht (cm)</th>
                  <th>Wt (kg)</th>
                  <th>BMI</th>
                  <th>Med</th>
                  <th>Dental</th>
                  <th>Psych</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((h) => {
                  const notes = formatHealthNotesCell(h.notes);
                  return (
                    <tr key={h.healthRecordId}>
                      <td>{formatDate(h.recordDate)}</td>
                      <td>{fmtNum(h.generalHealthScore)}</td>
                      <td>{fmtNum(h.nutritionScore)}</td>
                      <td>{fmtNum(h.sleepQualityScore)}</td>
                      <td>{fmtNum(h.energyLevelScore)}</td>
                      <td>{fmtNum(h.heightCm)}</td>
                      <td>{fmtNum(h.weightKg)}</td>
                      <td>{fmtNum(h.bmi)}</td>
                      <td>{fmtBool(h.medicalCheckupDone)}</td>
                      <td>{fmtBool(h.dentalCheckupDone)}</td>
                      <td>{fmtBool(h.psychologicalCheckupDone)}</td>
                      <td title={notes.title || undefined}>{notes.display}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ResidentRecordModal>
    </>
  );
}
