export const LEAD_SOURCE_OPTIONS = [
  'Facebook Ads',
  'Website',
  'Referral',
  'Trade Show',
  'Walk-in',
  'Facebook',
  'Google Ads',
  'LinkedIn',
  'Cold Call',
] as const;

export const PRODUCT_SERVICE_OPTIONS = [
  'Plush Toys',
  'Educational Toy Sets',
  'Plastic Toys',
  'Remote Control Toys',
  'Board Games',
  'Custom OEM Manufacturing',
  'Yarn Supply',
  'Packaging & Display',
  'Bulk Wholesale Order',
] as const;

export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
] as const;

export const LEAD_PRIORITY_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
] as const;

export type LeadCampaign = {
  id: string;
  label: string;
};

export type LeadAdCreative = {
  id: string;
  campaignId: string;
  label: string;
};

export const LEAD_CAMPAIGNS: LeadCampaign[] = [
  { id: 'fb-summer-2026', label: 'Summer 2026 — Facebook' },
  { id: 'fb-back-to-school', label: 'Back to School 2026' },
  { id: 'google-brand', label: 'Google Brand Search' },
  { id: 'trade-dhaka-2026', label: 'Dhaka Trade Fair 2026' },
  { id: 'referral-partners', label: 'Partner Referral Program' },
];

export const LEAD_AD_CREATIVES: LeadAdCreative[] = [
  { id: 'ad-plush-carousel', campaignId: 'fb-summer-2026', label: 'Plush Toys Carousel Ad' },
  { id: 'ad-edu-video', campaignId: 'fb-summer-2026', label: 'Educational Sets Video Ad' },
  { id: 'ad-school-banner', campaignId: 'fb-back-to-school', label: 'Back to School Banner' },
  { id: 'ad-school-story', campaignId: 'fb-back-to-school', label: 'Instagram Story — School Kits' },
  { id: 'ad-brand-search', campaignId: 'google-brand', label: 'Brand Search Text Ad' },
  { id: 'ad-trade-booth', campaignId: 'trade-dhaka-2026', label: 'Trade Fair Booth Flyer' },
  { id: 'ad-partner-email', campaignId: 'referral-partners', label: 'Partner Email Creative' },
];

export function getAdCreativesForCampaign(campaignId: string): LeadAdCreative[] {
  if (!campaignId) return LEAD_AD_CREATIVES;
  return LEAD_AD_CREATIVES.filter((ad) => ad.campaignId === campaignId);
}
