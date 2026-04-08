import { useAdminSearch } from "../context/AdminSearchContext";

type AdminSearchInputProps = {
  placeholder?: string;
};

function AdminSearchInput({
  placeholder = "Search across this page...",
}: AdminSearchInputProps) {
  const { query, setQuery } = useAdminSearch();

  return (
    <div className="mb-3">
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}

export default AdminSearchInput;
