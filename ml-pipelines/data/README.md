# ml-pipelines/data

This folder is intentionally almost empty in the committed repo.

The four notebooks in `ml-pipelines/` load CSV files from `data/cleaned/` via
relative paths (e.g. `pd.read_csv("../cleaned/residents.csv")`). Those CSVs are
**not committed to the repository** for two reasons:

1. **PII.** The resident, incident, health, and education tables contain
   personally identifiable information about minors in the Lighthouse Sanctuary
   safehouses. This data cannot be published to GitHub, even in a private repo,
   under the partnership agreement with the nonprofit.
2. **Reproducibility without re-running.** Per the course instructions, the
   notebooks are saved with all outputs intact, so a grader or reviewer can
   read every table, plot, and metric without needing the source data or a
   Python environment. The relative paths in the notebooks serve as
   documentation of the intended folder layout, not as a runtime requirement.

## Where the data actually lives

All source tables live in the project's **Supabase Postgres** database, which
backs the Beacon ASP.NET + React application in `backend/` and `frontend/`.
The cleaned CSVs used by the notebooks are produced by exporting the relevant
Supabase tables and running the project's cleaning script.

## Expected folder layout (if you were to re-run the notebooks locally)

```
ml-pipelines/
  data/
    cleaned/
      residents.csv
      incident_reports.csv
      health_wellbeing_records.csv
      education_records.csv
      process_recordings.csv
      intervention_plans.csv
      supporters.csv
      donations.csv
      social_media_posts.csv
      ...
  reintegration-readiness.ipynb
  resident-incident-risk.ipynb
  donor-churn-prediction.ipynb
  social-media-effectiveness.ipynb
  models/
    (trained model artifacts, ONNX exports, scored CSVs — committed)
```

## Tables used by each notebook

| Notebook | Primary tables |
|---|---|
| `reintegration-readiness.ipynb` | residents, incident_reports, health_wellbeing_records, education_records, process_recordings, intervention_plans |
| `resident-incident-risk.ipynb` | residents, incident_reports, health_wellbeing_records, process_recordings |
| `donor-churn-prediction.ipynb` | supporters, donations |
| `social-media-effectiveness.ipynb` | social_media_posts (with engagement metrics) |

## Gitignore

The following patterns in the root `.gitignore` keep the source data out of
version control:

```
ml-pipelines/data/*.csv
ml-pipelines/data/*.parquet
ml-pipelines/**/.ipynb_checkpoints/
```

Only this `README.md` is committed from the `data/` folder.
