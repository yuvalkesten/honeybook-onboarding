export interface BusinessService {
  title: string;
  description: string;
  imageUrl?: string;
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

export interface BusinessKnowledge {
  businessName?: string;
  yearsInBusiness?: number;
  services: BusinessService[];
  socialMedia: SocialMediaLinks;
  lastUpdated: string;
  confidence: {
    businessName?: number;
    yearsInBusiness?: number;
    services?: number;
    socialMedia?: number;
  };
}

export type KnowledgeExtractorType = 
  | 'business_name'
  | 'years_in_business'
  | 'services'
  | 'social_media';
