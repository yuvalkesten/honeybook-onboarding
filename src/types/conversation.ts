export type ConversationStage = 
  | 'greeting'
  | 'url_request'
  | 'business_analysis';

export interface ConversationState {
  stage: ConversationStage;
  websiteContent?: string;
  businessInsights?: {
    clientAcquisition?: string;
    contactChannels?: string[];
    leadManagement?: string;
    bookingProcess?: string;
  };
}
