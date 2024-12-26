import OpenAI from 'openai';
import { IConversationMessage } from '@/types/onboarding';
import { BusinessInfo } from '@/types/business';

interface BusinessInfo {
  name: string | null;
  description: string | null;
  services: Array<{
    name: string;
    description?: string;
    price?: string;
  }>;
  location: string | null;
  targetMarket: string[];
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    pinterest?: string;
    tiktok?: string;
    website?: string;
  };
  yearsInBusiness: number | null;
  painPoints: string[];
  goals: string[];
  lastUpdated: string;
}

export class BusinessAnalyzer {
  private openai: OpenAI;
  private businessInfo: BusinessInfo;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.businessInfo = {
      name: null,
      description: null,
      services: [],
      location: null,
      targetMarket: [],
      socialMedia: {},
      yearsInBusiness: null,
      painPoints: [],
      goals: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async analyzeWebsiteContent(websiteContent: string): Promise<void> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a business analyst extracting information from website content. 
            Extract key business information and format it as a JSON object with the following structure:
            {
              "name": string | null,
              "description": string | null,
              "services": Array<{ name: string, description?: string, price?: string }>,
              "location": string | null,
              "targetMarket": string[],
              "socialMedia": {
                "instagram"?: string,
                "facebook"?: string,
                "linkedin"?: string,
                "twitter"?: string,
                "pinterest"?: string,
                "tiktok"?: string,
                "website"?: string
              },
              "yearsInBusiness": number | null
            }`,
          },
          {
            role: 'user',
            content: `Please analyze this website content and extract business information: ${websiteContent}`,
          },
        ],
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) return;
      
      const cleanedResult = result.replace(/\n/g, '');
      try {
        const websiteInfo = JSON.parse(cleanedResult);
        this.updateBusinessInfo(websiteInfo);
      } catch (error) {
        console.error('Failed to parse GPT response:', error);
      }
    } catch (error) {
      console.error('Failed to analyze website content:', error);
      throw error;
    }
  }

  async analyzeChatMessage(message: IConversationMessage): Promise<void> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a business analyst extracting information from a user message. 
            Based on the message, identify and extract any business information mentioned.
            Format the response as a JSON object with:
            {
              "name": string | null,
              "description": string | null,
              "services": Array<{ name: string, description?: string, price?: string }>,
              "location": string | null,
              "targetMarket": string[],
              "socialMedia": {
                "instagram"?: string,
                "facebook"?: string,
                "linkedin"?: string,
                "twitter"?: string,
                "pinterest"?: string,
                "tiktok"?: string,
                "website"?: string
              },
              "yearsInBusiness": number | null,
              "painPoints": string[],
              "goals": string[]
            }
            Only include fields where information was explicitly mentioned in the message.`,
          },
          {
            role: 'user',
            content: `Extract business information from this message: ${message.content}`,
          },
        ],
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) return;

      const cleanedResult = result.replace(/\n/g, '');
      try {
        const messageInfo = JSON.parse(cleanedResult);
        this.updateBusinessInfo(messageInfo);
      } catch (error) {
        console.error('Failed to parse GPT response:', error);
      }
    } catch (error) {
      console.error('Failed to analyze message:', error);
      throw error;
    }
  }

  async analyzeConversation(messages: IConversationMessage[]): Promise<void> {
    // Only analyze the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      await this.analyzeChatMessage(lastUserMessage);
    }
  }

  private updateBusinessInfo(newInfo: Partial<BusinessInfo>): void {
    // Update each field if it exists and has a value
    if (newInfo.name) this.businessInfo.name = newInfo.name;
    if (newInfo.description) this.businessInfo.description = newInfo.description;
    if (newInfo.location) this.businessInfo.location = newInfo.location;
    if (newInfo.yearsInBusiness) this.businessInfo.yearsInBusiness = newInfo.yearsInBusiness;
    
    // Merge arrays if they exist and have items
    if (newInfo.services?.length) {
      this.businessInfo.services = [...this.businessInfo.services, ...newInfo.services];
    }
    if (newInfo.targetMarket?.length) {
      this.businessInfo.targetMarket = [...new Set([...this.businessInfo.targetMarket, ...newInfo.targetMarket])];
    }
    if (newInfo.painPoints?.length) {
      this.businessInfo.painPoints = [...new Set([...this.businessInfo.painPoints, ...newInfo.painPoints])];
    }
    if (newInfo.goals?.length) {
      this.businessInfo.goals = [...new Set([...this.businessInfo.goals, ...newInfo.goals])];
    }

    // Merge social media links
    if (newInfo.socialMedia) {
      this.businessInfo.socialMedia = {
        ...this.businessInfo.socialMedia,
        ...newInfo.socialMedia,
      };
    }

    this.businessInfo.lastUpdated = new Date().toISOString();
  }

  getBusinessInfo(): BusinessInfo {
    return { ...this.businessInfo };
  }
}
