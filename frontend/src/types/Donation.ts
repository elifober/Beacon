export interface Donation {
  donationId: number;
  supporterId: number;
  donationType?: string;
  donationDate: string;
  isRecurring?: boolean;
  campaignName?: string;
  channelSource?: string;
  currencyCode?: string;
  amount?: number;
  estimatedValue?: number;
  impactUnit?: string;
  notes?: string;
  referralPostId?: number;
}
