// src/api/postPlanner.ts
export interface PostPredictionRequest {
  platform: string;
  postType: string;
  mediaType: string;
  contentTopic: string;
  sentimentTone: string;
  postHour: number;
  numHashtags: number;
  mentionsCount: number;
  captionLength: number;
  isPeakHour: boolean;
  isVideo: boolean;
  hasCampaign: boolean;
  hasCallToAction: boolean;
  featuresResidentStory: boolean;
  isBoosted: boolean;
}

export interface PostPredictionResponse {
  successProbability: number;
  threshold: number;
  predictedSuccess: boolean;
  riskBand: "Low" | "Medium" | "High";
  interpretation: string;
}

const API_BASE = "";

export async function predictPostSuccess(
  req: PostPredictionRequest
): Promise<PostPredictionResponse> {
  const res = await fetch(`${API_BASE}/api/marketing/predict-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.status}`);
  return res.json();
}
