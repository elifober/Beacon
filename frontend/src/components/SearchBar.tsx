import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { SearchResult } from "../types/SearchResult";
import { search } from "../api/Search";

type SearchBarProps = {
  maxWidth?: number;
  inputClassName?: string;
};

function SearchBar({ maxWidth = 400, inputClassName = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const data = await search(query);
      setResults(data);
      setShowDropdown(data.length > 0);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setShowDropdown(false);
    navigate(`/${result.type.toLowerCase()}/${result.id}`);
  };

  return (
    <div
      ref={wrapperRef}
      className="search-bar"
      style={{ position: "relative", width: "100%", maxWidth }}
    >
      <div className="search-bar__row d-flex align-items-center gap-2 gap-md-3 w-100">
        <img
          src="/logo.png"
          alt=""
          className="search-bar__logo flex-shrink-0"
          width={44}
          height={44}
          decoding="async"
        />
        <div className="search-bar__field flex-grow-1 position-relative min-w-0">
          <input
            type="text"
            className={`form-control ${inputClassName}`.trim()}
            placeholder="Search residents, donors, partners, safehouses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {showDropdown && (
            <ul
              className="list-group"
              style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000 }}
            >
              {results.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(r)}
                >
                  {r.name}
                  <span className="badge bg-secondary rounded-pill">{r.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
