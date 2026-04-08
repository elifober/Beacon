import React, { useId, useMemo, useState } from "react";

export type FilterOption = {
  value: string;
  label?: string;
  count?: number;
};

export type FilterGroup = {
  key: string;
  label: string;
  options: FilterOption[];
  searchable?: boolean;
};

export type ActiveFilters = Record<string, string[]>;

type FilterPanelProps = {
  filters: FilterGroup[];
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  className?: string;
};

const SEARCHABLE_THRESHOLD = 10;

function toggleValue(current: string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
}

function countActiveFilters(activeFilters: ActiveFilters): number {
  return Object.values(activeFilters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  className,
}) => {
  const baseId: string = useId();
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalActive: number = countActiveFilters(activeFilters);

  const activeBadges: { groupKey: string; groupLabel: string; value: string; displayLabel: string }[] =
    useMemo(() => {
      const badges: { groupKey: string; groupLabel: string; value: string; displayLabel: string }[] = [];

      for (const group of filters) {
        const selected = activeFilters[group.key] ?? [];
        for (const val of selected) {
          const opt = group.options.find((o) => o.value === val);
          badges.push({
            groupKey: group.key,
            groupLabel: group.label,
            value: val,
            displayLabel: opt?.label ?? val,
          });
        }
      }

      return badges;
    }, [filters, activeFilters]);

  const handleToggle = (groupKey: string, value: string): void => {
    const current = activeFilters[groupKey] ?? [];
    onFilterChange({
      ...activeFilters,
      [groupKey]: toggleValue(current, value),
    });
  };

  const handleRemoveBadge = (groupKey: string, value: string): void => {
    const current = activeFilters[groupKey] ?? [];
    onFilterChange({
      ...activeFilters,
      [groupKey]: current.filter((v) => v !== value),
    });
  };

  const handleClearAll = (): void => {
    const cleared: ActiveFilters = {};
    for (const group of filters) {
      cleared[group.key] = [];
    }
    onFilterChange(cleared);
  };

  const handleGroupSearchChange = (
    groupKey: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setGroupSearch((prev) => ({ ...prev, [groupKey]: event.target.value }));
  };

  const toggleCollapse = (groupKey: string): void => {
    setCollapsed((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const getFilteredOptions = (group: FilterGroup): FilterOption[] => {
    const query = (groupSearch[group.key] ?? "").trim().toLowerCase();
    if (!query) return group.options;
    return group.options.filter((opt) => {
      const text = (opt.label ?? opt.value).toLowerCase();
      return text.includes(query);
    });
  };

  const isSearchable = (group: FilterGroup): boolean =>
    group.searchable === true ||
    (group.searchable !== false && group.options.length >= SEARCHABLE_THRESHOLD);

  return (
    <div className={className}>
      {/* Active filter badges */}
      {totalActive > 0 && (
        <div className="mb-3">
          <div className="d-flex flex-wrap align-items-center gap-1">
            {activeBadges.map((badge) => (
              <span
                key={`${badge.groupKey}-${badge.value}`}
                className="badge bg-primary d-inline-flex align-items-center gap-1"
              >
                {badge.groupLabel}: {badge.displayLabel}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-1"
                  style={{ fontSize: "0.55em" }}
                  aria-label={`Remove ${badge.displayLabel} filter`}
                  onClick={() => handleRemoveBadge(badge.groupKey, badge.value)}
                />
              </span>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Filter groups */}
      <div className="accordion" id={`${baseId}-accordion`}>
        {filters.map((group) => {
          const isOpen = !collapsed[group.key];
          const selected = activeFilters[group.key] ?? [];
          const selectedCount = selected.length;
          const visibleOptions = getFilteredOptions(group);
          const collapseId = `${baseId}-collapse-${group.key}`;
          const headerId = `${baseId}-header-${group.key}`;

          return (
            <div className="accordion-item" key={group.key}>
              <h2 className="accordion-header" id={headerId}>
                <button
                  className={`accordion-button${isOpen ? "" : " collapsed"} py-2`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={collapseId}
                  onClick={() => toggleCollapse(group.key)}
                >
                  {group.label}
                  {selectedCount > 0 && (
                    <span className="badge bg-primary rounded-pill ms-2">
                      {selectedCount}
                    </span>
                  )}
                </button>
              </h2>

              <div
                id={collapseId}
                className={`accordion-collapse collapse${isOpen ? " show" : ""}`}
                aria-labelledby={headerId}
              >
                <div className="accordion-body py-2">
                  {isSearchable(group) && (
                    <input
                      type="text"
                      className="form-control form-control-sm mb-2"
                      placeholder={`Search ${group.label.toLowerCase()}…`}
                      value={groupSearch[group.key] ?? ""}
                      onChange={(e) => handleGroupSearchChange(group.key, e)}
                      aria-label={`Search ${group.label} options`}
                    />
                  )}

                  {visibleOptions.length === 0 && (
                    <p className="text-muted small mb-0">No matching options</p>
                  )}

                  <ul className="list-unstyled mb-0">
                    {visibleOptions.map((option) => {
                      const checkId = `${baseId}-${group.key}-${option.value}`;
                      const isChecked = selected.includes(option.value);
                      const displayLabel = option.label ?? option.value;

                      return (
                        <li key={option.value}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={checkId}
                              checked={isChecked}
                              onChange={() => handleToggle(group.key, option.value)}
                            />
                            <label
                              className="form-check-label d-flex justify-content-between w-100"
                              htmlFor={checkId}
                            >
                              <span>{displayLabel}</span>
                              {option.count !== undefined && (
                                <span className="text-muted ms-2">
                                  ({option.count})
                                </span>
                              )}
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterPanel;
