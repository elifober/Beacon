import SearchBar from "../components/SearchBar";
import { Link } from "react-router-dom";

function AdminDashboardPage() {
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-center mb-4">
        <SearchBar maxWidth={760} inputClassName="rounded-pill px-4 py-2" />
      </div>

      <div className="d-flex justify-content-end">
        <div className="d-flex gap-3 w-100 justify-content-end">
          <div className="card" style={{ width: "320px", minHeight: "300px" }}>
            <div className="card-body" />
          </div>

          <div className="card" style={{ width: "320px" }}>
            <div className="card-body">
              <h2 className="h5 mb-3">Admin Menu</h2>
              <div className="list-group">
                <Link to="/admin/all-residents" className="list-group-item list-group-item-action">
                  Admin All Residents
                </Link>
                <Link to="/admin/all-safehouses" className="list-group-item list-group-item-action">
                  Admin All Safehouses
                </Link>
                <Link to="/admin/all-partners" className="list-group-item list-group-item-action">
                  Admin All Partners
                </Link>
                <Link to="/admin/all-donors" className="list-group-item list-group-item-action">
                  Admin All Donors
                </Link>
                <Link to="/admin/all-donations" className="list-group-item list-group-item-action">
                  Admin All Donations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
