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
            height: "170px",
            objectFit: "cover",
            objectPosition: "center 35%",
          }}
        />
      </div>

      <div className="container pb-4">
        <div className="d-flex justify-content-end">
          <div className="d-flex gap-3 w-100 justify-content-end">
            <div className="card" style={{ width: "320px", minHeight: "300px" }}>
              <div className="card-body" />
            </div>

            <div className="card" style={{ width: "320px" }}>
              <div className="card-body">
                <div className="list-group">
                  <Link to="/admin/all-residents" className="list-group-item list-group-item-action">
                    Residnts
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
        </div>
      </div>
    </>
  );
}

export default AdminDashboardPage;
