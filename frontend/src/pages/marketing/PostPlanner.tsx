// src/pages/marketing/PostPlanner.tsx
import { useEffect, useMemo, useState } from "react";
import {
  predictPostSuccess,
  type PostPredictionRequest,
  type PostPredictionResponse,
} from "../../api/postPlanner";

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

// Simple debounce hook
function useDebounced<T>(value: T, delay = 500): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function PostPlanner() {
  const [req, setReq] = useState<PostPredictionRequest>(defaultReq);
  const [result, setResult] = useState<PostPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const update = <K extends keyof PostPredictionRequest>(
    key: K,
    value: PostPredictionRequest[K]
  ) => setReq((r) => ({ ...r, [key]: value }));

  const gaugeColor = useMemo(() => {
    if (!result) return "#999";
    if (result.riskBand === "High") return "#16a34a";
    if (result.riskBand === "Medium") return "#eab308";
    return "#dc2626";
  }, [result]);

  return (
    <div className="post-planner" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, padding: 24 }}>
      <div>
        <h1>Post Planner</h1>
        <p>Draft a post and see its predicted success rate in real time.</p>

        <div className="form-grid" style={{ display: "grid", gap: 12, maxWidth: 600 }}>
          <Select label="Platform" value={req.platform} options={PLATFORMS} onChange={(v) => update("platform", v)} />
          <Select label="Post Type" value={req.postType} options={POST_TYPES} onChange={(v) => update("postType", v)} />
          <Select label="Media Type" value={req.mediaType} options={MEDIA_TYPES} onChange={(v) => update("mediaType", v)} />
          <Select label="Content Topic" value={req.contentTopic} options={CONTENT_TOPICS} onChange={(v) => update("contentTopic", v)} />
          <Select label="Sentiment Tone" value={req.sentimentTone} options={SENTIMENT_TONES} onChange={(v) => update("sentimentTone", v)} />

          <NumberInput label="Post Hour (0-23)" value={req.postHour} onChange={(v) => update("postHour", v)} min={0} max={23} />
          <NumberInput label="# Hashtags" value={req.numHashtags} onChange={(v) => update("numHashtags", v)} />
          <NumberInput label="# Mentions" value={req.mentionsCount} onChange={(v) => update("mentionsCount", v)} />
          <NumberInput label="Caption Length" value={req.captionLength} onChange={(v) => update("captionLength", v)} />

          <Checkbox label="Peak hour" checked={req.isPeakHour} onChange={(v) => update("isPeakHour", v)} />
          <Checkbox label="Video" checked={req.isVideo} onChange={(v) => update("isVideo", v)} />
          <Checkbox label="Part of campaign" checked={req.hasCampaign} onChange={(v) => update("hasCampaign", v)} />
          <Checkbox label="Has call to action" checked={req.hasCallToAction} onChange={(v) => update("hasCallToAction", v)} />
          <Checkbox label="Features resident story" checked={req.featuresResidentStory} onChange={(v) => update("featuresResidentStory", v)} />
          <Checkbox label="Boosted" checked={req.isBoosted} onChange={(v) => update("isBoosted", v)} />
        </div>
      </div>

      {/* Prediction panel */}
      <aside style={{ position: "sticky", top: 24, alignSelf: "start", padding: 20, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h3>Predicted Success</h3>
        {loading && <p>Scoring…</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        {result && (
          <>
            <div style={{ fontSize: 48, fontWeight: 700, color: gaugeColor }}>
              {(result.successProbability * 100).toFixed(0)}%
            </div>
            <div style={{
              display: "inline-block", padding: "4px 10px", borderRadius: 999,
              background: gaugeColor, color: "white", fontSize: 12, fontWeight: 600,
            }}>
              {result.riskBand} confidence
            </div>
            <p style={{ marginTop: 12 }}>{result.interpretation}</p>
            <hr />
            <h4 style={{ marginBottom: 6 }}>Top drivers of success</h4>
            <ul style={{ fontSize: 13, paddingLeft: 18 }}>
              <li>Fundraising appeals (4.3× odds)</li>
              <li>Emotional tone (3.2×)</li>
              <li>Impact stories (3.1×)</li>
              <li>YouTube platform (2.8×)</li>
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}

/* ---------- Small form field helpers ---------- */
function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <label>
      <div>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <label>
      <div>{label}</div>
      <input type="number" value={value} min={min} max={max}
             onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Checkbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
