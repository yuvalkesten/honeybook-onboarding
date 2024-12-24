export interface IOnboardingState {
  currentStep: number;
  businessInfo: IBusinessInfo;
  gmailIntegration: IGmailIntegration;
  completed: boolean;
}

export interface IBusinessInfo {
  businessName: string;
  businessType: string;
  websiteUrl: string | null;
  industry: string;
  primaryServices: string[];
  averageProjectValue: number | null;
}

export interface IGmailIntegration {
  isConnected: boolean;
  lastSyncDate: Date | null;
  emailsAnalyzed: number;
}

export interface IConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IOnboardingStep {
  id: number;
  question: string;
  field: keyof IBusinessInfo;
  type: 'text' | 'number' | 'multiSelect' | 'url';
  options?: string[];
  validation?: (value: any) => boolean;
}

export interface IGmailAnalysis {
  commonEmailTypes: string[];
  clientInteractionPatterns: string[];
  recommendedTemplates: string[];
  businessInsights: IBusinessInsights;
}

export interface IBusinessInsights {
  clientDemographics: string[];
  commonServices: string[];
  averageResponseTime: number;
  peakCommunicationHours: string[];
}
