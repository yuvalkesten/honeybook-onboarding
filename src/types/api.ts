export interface IApiConfig {
  openai: IOpenAIConfig;
  gmail: IGmailConfig;
}

export interface IOpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface IGmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface IOnboardingResponse extends IApiResponse<{
  nextStep: number;
  message: string;
  completed: boolean;
}> {}
