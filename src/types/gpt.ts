export interface IOnboardingGuidance {
  id: string;
  priority: number;
  category: 'business' | 'service' | 'client' | 'workflow' | 'preferences';
  requiredInfo: string[];
  promptTemplate: string;
  followUpQuestions: string[];
  validationRules?: {
    pattern?: string;
    required?: boolean;
    custom?: (value: any) => boolean;
  };
}

export interface IExtractedInfo {
  category: string;
  field: string;
  value: string | number | boolean;
  confidence: number;
  needsConfirmation: boolean;
}

export interface IChatContext {
  guidance: IOnboardingGuidance[];
  extractedInfo: IExtractedInfo[];
  currentPriority: number;
  missingInfo: string[];
}

export interface IGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
