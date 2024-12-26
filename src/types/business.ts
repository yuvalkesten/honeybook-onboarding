export interface BusinessService {
  name: string;
  description?: string;
  price?: string;
}

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  pinterest?: string;
  tiktok?: string;
  website?: string;
}

export interface BusinessInfo {
  name: string | null;
  description: string | null;
  services: BusinessService[];
  location: string | null;
  targetMarket: string[];
  socialMedia: SocialMediaLinks;
  yearsInBusiness: number | null;
  painPoints: string[];
  goals: string[];
  lastUpdated: string;
}

export type KnowledgeExtractorType = 
  | 'business_name'
  | 'years_in_business'
  | 'services'
  | 'social_media';
