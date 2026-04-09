import { useEffect, useState } from "react";
import type { IncidentReportRow } from "../../types/residentRecords";
import Pagination from "../Pagination";
import { ResidentRecordModal } from "./ResidentRecordModal";
import {
  dashIfEmpty,
  fmtBool,
  formatDate,
  RESIDENT_RECORD_MODAL_PAGE_SIZE,
} from "./residentRecordFormat";

type Props = { records: IncidentReportRow[] };

export function IncidentReportsSection({ records }: Props) {
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
              <h3 className="h5 mb-1 fw-semibold">Incident Reports</h3>
              <p className="text-muted small mb-0">
                {count === 1 ? "1 report" : `${count} reports`}
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
        title="Incident Reports"
        open={open}
        onClose={() => setOpen(false)}
        belowCard={belowCard}
      >
        <div className="table-responsive p-3">
          {count === 0 ? (
            <p className="text-muted small mb-0">No incident reports.</p>
          ) : (
            <table className="table table-sm table-striped table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Safehouse</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Resolved</th>
                  <th>Resolution date</th>
                  <th>Reported by</th>
                  <th>Follow-up req.</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.map((i) => (
                  <tr key={i.incidentId}>
                    <td>{formatDate(i.incidentDate)}</td>
                    <td>{dashIfEmpty(i.safehouseCity)}</td>
                    <td>{dashIfEmpty(i.incidentType)}</td>
                    <td>{dashIfEmpty(i.severity)}</td>
                    <td>{fmtBool(i.resolved)}</td>
                    <td>{formatDate(i.resolutionDate)}</td>
                    <td>{dashIfEmpty(i.reportedBy)}</td>
                    <td>{fmtBool(i.followUpRequired)}</td>
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
