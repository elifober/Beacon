import type { Supporter } from "./Supporter";

export interface DonorHistoryItem {
  donationType?: string;
  donationDate: string;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  programArea: string;
}

export interface DonorDashboard {
  supporter: Supporter;
  donationHistory: DonorHistoryItem[];
}
