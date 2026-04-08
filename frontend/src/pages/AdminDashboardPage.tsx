import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";
import beaconImage from "../assets/beaconimage.avif";

function AdminDashboardPage() {
  return (
    <>
      <div className="container py-4">
        <div className="d-flex justify-content-center mb-4">
          <SearchBar maxWidth={760} inputClassName="rounded-pill px-4 py-2" />
        </div>
      </div>

      <div
        className="mb-4 overflow-hidden"
        style={{
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
        }}
      >
        <img
          src={beaconImage}
          alt="The Beacon Project"
          style={{
            display: "block",
            width: "100vw",
            height: "230px",
            objectFit: "cover",
            // Keeps the lighthouse near the visual center (tweak % if the asset changes)
            objectPosition: "52% 38%",
          }}
        />
      </div>

      <div className="container pb-4">
        <div className="d-flex gap-3 align-items-stretch flex-column flex-md-row w-100">
          <div className="card admin-dashboard-placeholder flex-grow-1" style={{ minWidth: 0, minHeight: "300px" }}>
            <div className="card-body h-100" />
          </div>

          <div className="card admin-dashboard-menu flex-shrink-0" style={{ width: "100%", maxWidth: "280px" }}>
            <div className="list-group list-group-flush">
              <Link to="/admin/all-residents" className="list-group-item list-group-item-action">
                Residents
              </Link>
              <Link to="/admin/all-safehouses" className="list-group-item list-group-item-action">
                Safehouses
              </Link>
              <Link to="/admin/all-partners" className="list-group-item list-group-item-action">
                Partners
              </Link>
              <Link to="/admin/all-donors" className="list-group-item list-group-item-action">
                Donors
              </Link>
              <Link to="/admin/all-donations" className="list-group-item list-group-item-action">
                Donations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboardPage;
