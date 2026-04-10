import { useAdminSearch } from "../context/AdminSearchContext";

type AdminSearchInputProps = {
  placeholder?: string;
};

function AdminSearchInput({
  placeholder = "Search across this page...",
}: AdminSearchInputProps) {
  const { query, setQuery } = useAdminSearch();

  return (
    <div className="mb-3 admin-hub-search d-flex align-items-center w-100">
      <input
        id="admin-hub-page-search"
        name="admin-hub-page-search"
        type="search"
        className="form-control rounded-pill px-4 py-2 flex-grow-1 min-w-0"
        placeholder={placeholder}
        autoComplete="off"
        aria-label={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}

export default AdminSearchInput;
