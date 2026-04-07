import type { Supporter } from "./Supporter";

export interface DonorHistoryItem {
  donationDate: string;
  amount: number;
  programArea: string;
}

export interface DonorDashboard {
  supporter: Supporter;
  donationHistory: DonorHistoryItem[];
}
