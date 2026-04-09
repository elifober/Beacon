// src/pages/marketing/PostPlanner.tsx
import { useEffect, useState } from "react";
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

  const tone = result ? riskTone(result.riskBand) : null;

  return (
    <div className="beacon-page container-fluid py-4">
      <div className="post-planner">
        <div>
          <p className="landing-section__eyebrow mb-2">Marketing</p>
          <h1>Post Planner</h1>
          <p className="post-planner__lead">
            Draft a post and see its predicted success rate in real time.
          </p>

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

            <Checkbox id="pp-peak" label="Peak hour" checked={req.isPeakHour} onChange={(v) => update("isPeakHour", v)} />
            <Checkbox id="pp-video" label="Video" checked={req.isVideo} onChange={(v) => update("isVideo", v)} />
            <Checkbox id="pp-campaign" label="Part of campaign" checked={req.hasCampaign} onChange={(v) => update("hasCampaign", v)} />
            <Checkbox id="pp-cta" label="Has call to action" checked={req.hasCallToAction} onChange={(v) => update("hasCallToAction", v)} />
            <Checkbox id="pp-story" label="Features resident story" checked={req.featuresResidentStory} onChange={(v) => update("featuresResidentStory", v)} />
            <Checkbox id="pp-boost" label="Boosted" checked={req.isBoosted} onChange={(v) => update("isBoosted", v)} />
          </div>
        </div>

        <aside className="post-planner__aside">
          <h3>Predicted Success</h3>
          {loading && <p className="mb-0">Scoring…</p>}
          {error && <p className="text-danger mb-0">{error}</p>}
          {result && tone && (
            <>
              <div className={`post-planner__score post-planner__gauge--${tone}`}>
                {(result.successProbability * 100).toFixed(0)}%
              </div>
              <div className={`post-planner__badge post-planner__badge--${tone}`}>
                {result.riskBand} confidence
              </div>
              <p className="mt-3">{result.interpretation}</p>
              <hr className="border-opacity-25 my-3" />
              <h4>Top drivers of success</h4>
              <ul>
                <li>Fundraising appeals (4.3× odds)</li>
                <li>Emotional tone (3.2×)</li>
                <li>Impact stories (3.1×)</li>
                <li>YouTube platform (2.8×)</li>
              </ul>
            </>
          )}
        </aside>
      </div>
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
