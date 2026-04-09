export type AdminGlassFilterChoice = {
  value: string;
  title: string;
};

export type AdminGlassFilterSection = {
  id: string;
  tabLabel: string;
  allOption: { title: string };
  choices: AdminGlassFilterChoice[];
};

type AdminGlassFilterBarProps = {
  ariaLabel: string;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  values: Record<string, string>;
  onValueChange: (sectionId: string, value: string) => void;
  sections: AdminGlassFilterSection[];
};

function AdminGlassFilterBar({
  ariaLabel,
  openMenu,
  setOpenMenu,
  values,
  onValueChange,
  sections,
}: AdminGlassFilterBarProps) {
  return (
    <section className="admin-residents-filter mb-3" aria-label={ariaLabel}>
      <div className="admin-residents-filter__track">
        <div
          className="admin-residents-filter__pill"
          role="toolbar"
          aria-label={ariaLabel}
        >
          {sections.map((section) => {
            const current = values[section.id] ?? "";
            const isOpen = openMenu === section.id;
            return (
              <button
                key={section.id}
                type="button"
                className={`admin-residents-filter__tab ${isOpen ? "is-open" : ""} ${current ? "has-active-filter" : ""}`}
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenMenu(isOpen ? null : section.id)
                }
              >
                {section.tabLabel}
                <i
                  className={`admin-residents-filter__chev bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </div>

      {openMenu ? (
        <div className="admin-residents-filter__dropdown-wrap">
          <div className="admin-residents-filter__dropdown" role="region">
            {sections
              .filter((s) => s.id === openMenu)
              .map((section) => {
                const current = values[section.id] ?? "";
                return (
                  <div key={section.id} className="admin-residents-filter__grid">
                    <button
                      type="button"
                      className={`admin-residents-filter__option ${current === "" ? "is-selected" : ""}`}
                      onClick={() => {
                        onValueChange(section.id, "");
                        setOpenMenu(null);
                      }}
                    >
                      <span className="admin-residents-filter__option-title">
                        {section.allOption.title}
                      </span>
                    </button>
                    {section.choices.map((choice) => (
                      <button
                        key={choice.value || "__empty"}
                        type="button"
                        className={`admin-residents-filter__option ${current === choice.value ? "is-selected" : ""}`}
                        onClick={() => {
                          onValueChange(section.id, choice.value);
                          setOpenMenu(null);
                        }}
                      >
                        <span className="admin-residents-filter__option-title">
                          {choice.title}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminGlassFilterBar;
