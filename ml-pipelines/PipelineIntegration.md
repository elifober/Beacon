# Pipeline Integration Plan

This document outlines how each ML pipeline will be integrated into the Beacon web application (ASP.NET backend on Railway + React frontend on Vercel + Supabase database).

**Guiding principle for this week's demo:** Keep integration as simple as possible. We're running the app live for one week with essentially static data, so we don't need real-time retraining, a Python microservice, or complex infrastructure. We use a **hybrid approach**: precompute scores where possible, and only run live inference where user input demands it.

---

## Architecture Overview

### Training (offline, in Jupyter)
1. Load cleaned CSVs → build features → train models → export `.pkl` files to `ml-pipelines/models/`.
2. Pickled artifacts per pipeline: `*_model.pkl`, `*_scaler.pkl`, `*_features.pkl` (+ threshold file for Pipeline 2).

### Serving — Two Strategies
| Strategy | When to use | Used by |
|---|---|---|
| **A. Precomputed scores stored in Supabase** | Per-record predictions (one score per donor/resident) where data is stable | Pipelines 1 & 3 |
| **B. ONNX model loaded directly in ASP.NET** | Interactive forms where the user is creating a new record that doesn't exist yet | Pipeline 2 |

Neither strategy requires a separate Python microservice, extra Railway deployments, or cross-service HTTP calls. Everything runs inside the existing ASP.NET backend.

### Why not FastAPI?
A Python microservice on Railway would work, but it doubles the number of deployments we have to manage and introduces cross-service HTTP, CORS, and env-var coordination. For a one-week live demo, the overhead isn't worth it. We mention this to judges as a "future scalability" talking point instead.

---

## Pipeline 1 — Donor Churn Prediction

**File:** `donor-churn-prediction.ipynb`
**Strategy:** **A — Precomputed scores in Supabase**

### What it does
Predicts the probability that an existing supporter has churned (has not donated and likely will not donate again). Outputs a score 0–1 per donor.

### Integration steps
1. **Run the notebook once** after finalizing the model
2. **Score every donor** using `model.predict_proba()` on the full feature matrix (there's already a cell that does this and exports `donor_churn_scores.csv`)
3. **Upload scores to Supabase** — either:
    - Add a `churn_risk` column to the `supporters` table and populate it via SQL `UPDATE`
    - OR create a small `donor_risk_scores` table with `supporter_id`, `churn_risk`, `score_generated_at`
4. **ASP.NET reads the column** like any other field — no ML code, no pickles loaded at runtime

### Where it lives in the app
- **Page:** Admin Dashboard → Donor Management → Individual Donor Profile (`/donors/:id`)
- **Secondary page:** Donor list view — sortable column showing churn risk for every donor

### UI recommendations
- Color-code risk levels: Green (<30%), Yellow (30–70%), Red (>70%)
- On high-risk donors, surface a "Re-engage" action button that drafts an email template
- Optionally hardcode the top contributing features from the notebook's odds ratio chart ("Long gap since last donation, low recurring rate") for transparency

### Refresh strategy
Since data is static for the demo week, scores don't need to refresh. For future production use, we'd re-run the scoring script nightly (cron job) or trigger it after each new donation — mentioned to judges as a future improvement.

---

## Pipeline 2 — Social Media Post Success

**File:** `social-media-effectiveness.ipynb`
**Strategy:** **B — ONNX model loaded directly in ASP.NET**

### Why this one is different
Pipelines 1 and 3 score *existing* records, so we can precompute. Pipeline 2 scores a *hypothetical* post that the user is planning — there's no record to precompute from. The Post Planner form needs live inference as the user types.

Fortunately, Pipeline 2's features come straight from form inputs (platform, content type, hashtags, timing, boost flag, etc.) with no complex aggregation — this makes ONNX deployment straightforward.

### Integration steps
1. **Add a notebook cell** that converts the trained sklearn model to ONNX using `skl2onnx`:
    ```python
    from skl2onnx import to_onnx
    onx = to_onnx(best_model, X.iloc[:1].astype(np.float32))
    with open("models/social_media_model.onnx", "wb") as f:
        f.write(onx.SerializeToString())
    ```
2. **Copy the `.onnx` file** into the ASP.NET project's assets folder
3. **Install `Microsoft.ML.OnnxRuntime`** in the ASP.NET project
4. **C# inference code** — load the ONNX session once at app startup, then call it on each prediction request:
    ```csharp
    var session = new InferenceSession("social_media_model.onnx");
    // Build feature vector from form input → run session → return probability
    ```
5. **Replicate the feature assembly in C#** — one-hot encoding for categorical fields (platform, post_type, etc.). The notebook's feature list (`social_media_features.pkl`) tells us the exact column order to match.

### Where it lives in the app
- **Page:** Admin Dashboard → Marketing → **Post Planner** (`/marketing/post-planner`)
- A new form-driven page where staff describe a planned post and see the success probability before publishing.

### Trigger
- **On form change** (debounced ~500ms) → live prediction updates as the user tweaks attributes.
- Alternatively: **On "Check Success Rate" button click** if debouncing feels too chatty.

### UI recommendations
- Big visual probability gauge (0–100%)
- Clear success/failure framing: "82% likely to succeed" — never show raw donor counts
- Optionally show "Top factors" sourced from the notebook's odds ratio chart (hardcoded, not re-derived)

### Fallback (if ONNX proves tricky)
Skip live prediction and present Pipeline 2 as a **static "What Makes Posts Succeed" dashboard** — display the odds ratio chart and categorical success-rate bars from the notebook as infographics. This is still a legitimate ML story for judges: "We analyzed what drives post success and found X, Y, Z." Less interactive but zero integration effort.

---

## Pipeline 3 — Resident Incident Risk

**File:** `resident-incident-risk.ipynb`
**Strategy:** **A — Precomputed scores in Supabase**

### What it does
Predicts the probability that a resident will experience an incident (behavioral, medical, security, or runaway). Outputs a score 0–1 per resident.

### Integration steps
1. **Run the notebook once** after finalizing the model
2. **Score every resident** — the notebook already has a cell that does this and exports `resident_risk_scores.csv`
3. **Upload scores to Supabase** — either:
    - Add a `incident_risk_score` column to the `residents` table and populate it via SQL `UPDATE`
    - OR create a small `resident_risk_scores` table with `resident_id`, `incident_risk_score`, `risk_level`, `score_generated_at`
4. **ASP.NET reads the column** — display it on the resident profile page and dashboard widget

### Where it lives in the app
- **Page:** Case Management → Individual Resident Profile (`/residents/:id`)
- **Secondary page:** Resident list / Dashboard — "High Risk Residents" widget showing the top 5 highest-scoring residents

### UI recommendations
- Color-coded risk badges: Low (green, <30%), Medium (yellow, 30–70%), High (red, >70%)
- **CRITICAL — ethical framing:** Risk scores must be presented as *"this resident needs more support"* — NEVER as a disciplinary flag. Language emphasizes additional check-ins, counseling, or resources.
- Hide the raw score from residents themselves; show it only to social workers and administrators.
- Surface top contributing features from the notebook (hardcoded per the odds ratio chart) for transparency.

### Refresh strategy
Static for the demo week. Future production: re-run nightly or after each new session/health record — mentioned to judges as a future improvement.

---

## Implementation Checklist

### Pipelines 1 & 3 (Precomputed — easiest)
- [ ] Run notebooks to final state, confirm best model is saved
- [ ] Export `donor_churn_scores.csv` and `resident_risk_scores.csv`
- [ ] Add columns to Supabase (`supporters.churn_risk`, `residents.incident_risk_score`)
- [ ] `UPDATE` statements (or Supabase CSV import) to populate scores
- [ ] C# teammate reads those columns in existing entity models
- [ ] React displays color-coded badges on profile pages
- [ ] React displays a "High Risk" dashboard widget (top 5 residents, top 5 churn-risk donors)

### Pipeline 2 (ONNX — medium effort)
- [ ] Add `skl2onnx` export cell to the notebook
- [ ] Generate and commit `social_media_model.onnx`
- [ ] Install `Microsoft.ML.OnnxRuntime` NuGet package in ASP.NET project
- [ ] Write C# helper class that loads the ONNX session and builds feature vectors from form input
- [ ] Create `/api/marketing/predict-post` endpoint
- [ ] Build React Post Planner form with debounced API calls
- [ ] **Fallback:** If ONNX proves tricky, build a static "Post Success Insights" dashboard using the odds ratio chart

### Shared
- [ ] Authentication — ensure only admins/social workers see risk scores
- [ ] Ethical framing passed through to all UI copy (Pipeline 3 especially)

---

## Future Improvements (Talking Points for Judges)

These are features we'd add with more time and resources beyond this week:

- **Automated retraining:** Nightly or weekly cron jobs re-run the notebooks as new data arrives, so models stay current. We're not doing this now because data is static during the demo week — but we acknowledge this would be important in production.
- **FastAPI prediction microservice:** For true live inference across all three pipelines (not just Post Planner), we could deploy a Python service on Railway that loads the pickles directly. This would avoid the need to translate feature engineering into C# or ONNX.
- **Model drift monitoring:** Log every prediction and compare against actual outcomes over time to detect when models need retraining.
- **A/B testing the Post Planner recommendations:** Actually publish some suggested posts vs staff's original drafts and measure which performs better.
- **Extended feature engineering:** Pull in external data (time of day, holidays, donor demographics) to improve accuracy.
- **Confidence intervals:** Show not just a point estimate but a range (e.g., "65–82% likely to succeed") so staff understand uncertainty.

---

## Summary

| Pipeline | Strategy | Effort | Live? |
|---|---|---|---|
| 1. Donor Churn | Precomputed → Supabase column | Low | Static for demo |
| 2. Post Success | ONNX → ASP.NET | Medium | Live form inference |
| 3. Resident Risk | Precomputed → Supabase column | Low | Static for demo |

This approach gets all three pipelines into the app with minimal backend complexity, maximum reliability for demo day, and a clean narrative for judges about both what we built and what we'd build next.
