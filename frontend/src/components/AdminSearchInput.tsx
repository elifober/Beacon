import { useAdminSearch } from "../context/AdminSearchContext";

type AdminSearchInputProps = {
  placeholder?: string;
};

function AdminSearchInput({
  placeholder = "Search across this page...",
}: AdminSearchInputProps) {
  const { query, setQuery } = useAdminSearch();

  return (
    <div className="mb-3 admin-hub-search">
      <input
        type="text"
        className="form-control rounded-pill px-4 py-2"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}

export default AdminSearchInput;
