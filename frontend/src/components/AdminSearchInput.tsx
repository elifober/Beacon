import { useAdminSearch } from "../context/AdminSearchContext";

type AdminSearchInputProps = {
  placeholder?: string;
};

function AdminSearchInput({
  placeholder = "Search across this page...",
}: AdminSearchInputProps) {
  const { query, setQuery } = useAdminSearch();

  return (
    <div className="mb-3 admin-hub-search d-flex align-items-center gap-2 gap-md-3 w-100">
      <img
        src="/logo.png"
        alt=""
        className="admin-hub-search__logo flex-shrink-0"
        decoding="async"
      />
      <input
        type="text"
        className="form-control rounded-pill px-4 py-2 flex-grow-1 min-w-0"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}

export default AdminSearchInput;
