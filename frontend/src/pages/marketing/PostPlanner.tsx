// src/pages/marketing/PostPlanner.tsx
import { useEffect, useState } from "react";
import {
  predictPostSuccess,
  type PostPredictionRequest,
  type PostPredictionResponse,
} from "../../api/postPlanner";
import AdminDashboardBackLink from "../../components/AdminDashboardBackLink";
import heroForestImage from "../../assets/forrest.jpg";

const PLATFORMS = ["Facebook", "Instagram", "Twitter", "TikTok", "YouTube"];
const POST_TYPES = ["Organic", "Paid", "Story", "Reel"];
const MEDIA_TYPES = ["Image", "Video", "Carousel", "Text"];
const CONTENT_TOPICS = [
  "FundraisingAppeal", "ImpactStory", "ThankYou",
  "EventPromotion", "EducationalContent", "Informative",
];
const SENTIMENT_TONES = ["Emotional", "Informative", "Inspirational", "Urgent"];

const defaultReq: PostPredictionRequest = {
  platform: "Facebook",
  postType: "Organic",
  mediaType: "Image",
  contentTopic: "ImpactStory",
  sentimentTone: "Emotional",
  postHour: 12,
  numHashtags: 3,
  mentionsCount: 0,
  captionLength: 120,
  isPeakHour: false,
  isVideo: false,
  hasCampaign: false,
  hasCallToAction: true,
  featuresResidentStory: false,
  isBoosted: false,
};

function useDebounced<T>(value: T, delay = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function riskTone(band: string): "high" | "medium" | "low" {
  if (band === "High") return "high";
  if (band === "Medium") return "medium";
  return "low";
}

function formatHour12(hour24: number): string {
  const h = ((hour24 % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}

export default function PostPlanner() {
  const [req, setReq] = useState<PostPredictionRequest>(defaultReq);
  const [result, setResult] = useState<PostPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroFallback, setHeroFallback] = useState(false);
  const [hourPreview, setHourPreview] = useState<{ hour: number; probability: number }[]>([]);
  const [hourPreviewLoading, setHourPreviewLoading] = useState(false);

  const debouncedReq = useDebounced(req, 500);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    predictPostSuccess(debouncedReq)
      .then((r) => !cancelled && setResult(r))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [debouncedReq]);

  useEffect(() => {
    const sampleHours = [8, 11, 14, 17, 20];
    let cancelled = false;
    setHourPreviewLoading(true);
    Promise.all(
      sampleHours.map(async (hour) => {
        const r = await predictPostSuccess({ ...debouncedReq, postHour: hour });
        return { hour, probability: r.successProbability };
      }),
    )
      .then((points) => {
        if (!cancelled) setHourPreview(points);
      })
      .catch(() => {
        if (!cancelled) setHourPreview([]);
      })
      .finally(() => {
        if (!cancelled) setHourPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedReq]);

  const update = <K extends keyof PostPredictionRequest,>(
    key: K,
    value: PostPredictionRequest[K],
  ) => setReq((r) => ({ ...r, [key]: value }));

  const tone = result ? riskTone(result.riskBand) : null;

  return (
    <div className="admin-dashboard beacon-page">
      <header className="admin-dashboard__hero" aria-label="Post planner header">
        <img
          className="admin-dashboard__hero-img"
          src={heroFallback ? heroForestImage : "/postplanner.jpg"}
          alt=""
          decoding="async"
          onError={() => setHeroFallback(true)}
        />
        <div className="admin-dashboard__hero-overlay" aria-hidden="true" />
        <div className="container admin-dashboard__hero-content">
          <p className="admin-dashboard__hero-eyebrow">Marketing</p>
          <h1 className="admin-dashboard__hero-title">Post Planner</h1>
          <p className="post-planner__lead admin-dashboard__hero-subtitle mb-0" style={{ color: "rgba(242, 244, 240, 0.88)" }}>
            Draft a post and see its predicted success rate in real time.
          </p>
        </div>
      </header>

      <section className="admin-dashboard__main">
        <div className="container">
          <div className="mb-4">
            <AdminDashboardBackLink />
          </div>

          {/* 6 / 6 split: inputs left, predictor right */}
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="post-planner__form-card h-100">
                <div className="post-planner__form-grid">
                  <Select label="Platform" value={req.platform} options={PLATFORMS} onChange={(v) => update("platform", v)} />
                  <Select label="Post Type" value={req.postType} options={POST_TYPES} onChange={(v) => update("postType", v)} />
                  <Select label="Media Type" value={req.mediaType} options={MEDIA_TYPES} onChange={(v) => update("mediaType", v)} />
                  <Select label="Content Topic" value={req.contentTopic} options={CONTENT_TOPICS} onChange={(v) => update("contentTopic", v)} />
                  <Select label="Sentiment Tone" value={req.sentimentTone} options={SENTIMENT_TONES} onChange={(v) => update("sentimentTone", v)} />

                  <NumberInput label="Post Hour (0-23)" value={req.postHour} onChange={(v) => update("postHour", v)} min={0} max={23} />
                  <NumberInput label="# Hashtags" value={req.numHashtags} onChange={(v) => update("numHashtags", v)} />
                  <NumberInput label="# Mentions" value={req.mentionsCount} onChange={(v) => update("mentionsCount", v)} />
                  <NumberInput label="Caption Length" value={req.captionLength} onChange={(v) => update("captionLength", v)} />
                </div>
                <div className="post-planner__checks mt-3">
                  <Checkbox id="pp-peak" label="Peak hour" checked={req.isPeakHour} onChange={(v) => update("isPeakHour", v)} />
                  <Checkbox id="pp-video" label="Video" checked={req.isVideo} onChange={(v) => update("isVideo", v)} />
                  <Checkbox id="pp-campaign" label="Part of campaign" checked={req.hasCampaign} onChange={(v) => update("hasCampaign", v)} />
                  <Checkbox id="pp-cta" label="Has call to action" checked={req.hasCallToAction} onChange={(v) => update("hasCallToAction", v)} />
                  <Checkbox id="pp-story" label="Features resident story" checked={req.featuresResidentStory} onChange={(v) => update("featuresResidentStory", v)} />
                  <Checkbox id="pp-boost" label="Boosted" checked={req.isBoosted} onChange={(v) => update("isBoosted", v)} />
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <aside className="post-planner__aside">
                <h3>Predicted Success</h3>
                {loading && <p className="mb-0">Scoring…</p>}
                {error && <p className="text-danger mb-0">{error}</p>}
                {result && tone && (
                  <>
                    <div className="post-planner__result-head">
                      <div className={`post-planner__score post-planner__gauge--${tone}`}>
                        {(result.successProbability * 100).toFixed(0)}%
                      </div>
                      <div className={`post-planner__badge post-planner__badge--${tone}`}>
                        {result.riskBand} confidence
                      </div>
                    </div>

                    <p className="post-planner__interpretation">{result.interpretation}</p>

                    <hr className="border-opacity-25 my-3" />
                    <h4>Top drivers of success</h4>
                    <ul className="post-planner__drivers">
                      <li><span>Fundraising appeals</span><strong>4.3×</strong></li>
                      <li><span>Emotional tone</span><strong>3.2×</strong></li>
                      <li><span>Impact stories</span><strong>3.1×</strong></li>
                      <li><span>YouTube platform</span><strong>2.8×</strong></li>
                    </ul>

                    <hr className="border-opacity-25 my-3" />
                    <h4>Best posting windows</h4>
                    {hourPreviewLoading ? (
                      <p className="mb-0">Checking time slots…</p>
                    ) : (
                      <ul className="post-planner__hour-chart">
                        {hourPreview.map((p) => (
                          <li key={p.hour}>
                            <span className="post-planner__hour-label">{formatHour12(p.hour)}</span>
                            <span className="post-planner__hour-bar">
                              <span
                                className={`post-planner__hour-fill ${
                                  p.probability < 0.35
                                    ? "post-planner__hour-fill--bad"
                                    : p.probability < 0.6
                                      ? "post-planner__hour-fill--medium"
                                      : "post-planner__hour-fill--good"
                                }`}
                                style={{ width: `${Math.round(p.probability * 100)}%` }}
                              />
                            </span>
                            <strong>{Math.round(p.probability * 100)}%</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                <details className="post-planner__reminders post-planner__form-card post-planner__reminders--inline mt-4">
                  <summary>Helpful reminders</summary>
                  <ul className="mt-3 mb-0">
                    <li><strong>Peak hours</strong> are roughly 11am–1pm and 6pm–9pm — check "Peak hour" if your post time falls in these windows.</li>
                    <li><strong>Emotional tone + impact stories</strong> consistently outperform informational content for donation referrals.</li>
                    <li><strong>3–5 hashtags</strong> tends to be the sweet spot — too few hurts reach, too many looks spammy.</li>
                    <li><strong>Call to action</strong> (e.g. "Donate today") significantly boosts conversion — leave it checked when relevant.</li>
                    <li><strong>Avoid</strong> thank-you posts and pure event promotions as standalone fundraising tools — their odds are very low (~0.04–0.06×).</li>
                    <li><strong>Resident stories</strong> should be told with dignity and consent — high impact, but handle with care.</li>
                    <li>Boosting a post amplifies whatever signal it has — boost your <em>best</em> drafts, not your average ones.</li>
                  </ul>
                </details>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <label className="w-100">
      <div>{label}</div>
      <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <label className="w-100">
      <div>{label}</div>
      <input
        type="number"
        className="form-control"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Checkbox({ id, label, checked, onChange }: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="form-check">
      <input
        id={id}
        className="form-check-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="form-check-label" htmlFor={id}>{label}</label>
    </div>
  );
}
