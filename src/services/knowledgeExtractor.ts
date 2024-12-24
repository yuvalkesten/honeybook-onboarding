import OpenAI from 'openai';
import { BusinessKnowledge, KnowledgeExtractorType, BusinessService, SocialMediaLinks } from '@/types/business';
import { IConversationMessage } from '@/types/onboarding';

const EXTRACTORS = {
  business_name: {
    prompt: 'Extract the business name from the conversation and website content. Return ONLY a JSON object with format: {"businessName": "name", "confidence": 0.9}. If not found, return null for businessName.',
    parser: (response: string): Partial<BusinessKnowledge> => {
      const parsed = JSON.parse(response);
      return {
        businessName: parsed.businessName,
        confidence: { businessName: parsed.confidence }
      };
    }
  },
  years_in_business: {
    prompt: 'Extract how many years the business has been operating. Return ONLY a JSON object with format: {"yearsInBusiness": number, "confidence": 0.9}. If not found, return null for yearsInBusiness.',
    parser: (response: string): Partial<BusinessKnowledge> => {
      const parsed = JSON.parse(response);
      return {
        yearsInBusiness: parsed.yearsInBusiness,
        confidence: { yearsInBusiness: parsed.confidence }
      };
    }
  },
  services: {
    prompt: 'Extract all services offered by the business. For each service include title, description, price (if available), and image URL (if available). Return ONLY a JSON object with format: {"services": [{"title": "string", "description": "string", "price": "string?", "imageUrl": "string?"}], "confidence": 0.9}',
    parser: (response: string): Partial<BusinessKnowledge> => {
      const parsed = JSON.parse(response);
      return {
        services: parsed.services,
        confidence: { services: parsed.confidence }
      };
    }
  },
  social_media: {
    prompt: 'Extract all social media links for the business. Return ONLY a JSON object with format: {"socialMedia": {"instagram": "url?", "facebook": "url?", "linkedin": "url?", "twitter": "url?", "pinterest": "url?", "tiktok": "url?", "website": "url?"}, "confidence": 0.9}',
    parser: (response: string): Partial<BusinessKnowledge> => {
      const parsed = JSON.parse(response);
      return {
        socialMedia: parsed.socialMedia,
        confidence: { socialMedia: parsed.confidence }
      };
    }
  }
};

export class KnowledgeExtractor {
  private openai: OpenAI;
  private knowledge: BusinessKnowledge;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.knowledge = {
      services: [],
      socialMedia: {},
      lastUpdated: new Date().toISOString(),
      confidence: {}
    };
  }

  async extractKnowledge(
    type: KnowledgeExtractorType,
    websiteContent: string,
    messages: IConversationMessage[]
  ): Promise<Partial<BusinessKnowledge>> {
    try {
      const extractor = EXTRACTORS[type];
      const conversationContent = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a business information extractor. ${extractor.prompt}`
          },
          {
            role: 'user',
            content: `Website Content:\n${websiteContent}\n\nConversation:\n${conversationContent}`
          }
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content || '';
      return extractor.parser(content);
    } catch (error) {
      console.error(`Failed to extract ${type}:`, error);
      return {};
    }
  }

  async updateKnowledge(
    websiteContent: string,
    messages: IConversationMessage[],
    types: KnowledgeExtractorType[] = ['business_name', 'years_in_business', 'services', 'social_media']
  ): Promise<BusinessKnowledge> {
    const updates = await Promise.all(
      types.map(type => this.extractKnowledge(type, websiteContent, messages))
    );

    this.knowledge = updates.reduce((acc, update) => ({
      ...acc,
      ...update,
      lastUpdated: new Date().toISOString(),
    }), this.knowledge);

    return this.knowledge;
  }

  async extractKnowledgeNew(messages: IConversationMessage[]): Promise<BusinessKnowledge> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract business knowledge from this conversation. Return a JSON object with:
              - services: Array of services offered
              - clientTypes: Array of client types
              - painPoints: Array of business pain points
              - goals: Array of business goals
              - processSteps: Array of current process steps
              
              Keep it simple and focused on facts mentioned in the conversation.`
          },
          ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))
        ],
        temperature: 0.3,
      });

      const result = response.choices[0]?.message?.content || '{}';
      
      try {
        const knowledge = JSON.parse(result);
        return {
          services: knowledge.services || [],
          clientTypes: knowledge.clientTypes || [],
          painPoints: knowledge.painPoints || [],
          goals: knowledge.goals || [],
          processSteps: knowledge.processSteps || [],
        };
      } catch (error) {
        console.error('Failed to parse knowledge:', error);
        return {
          services: [],
          clientTypes: [],
          painPoints: [],
          goals: [],
          processSteps: [],
        };
      }
    } catch (error) {
      console.error('Failed to extract knowledge:', error);
      return {
        services: [],
        clientTypes: [],
        painPoints: [],
        goals: [],
        processSteps: [],
      };
    }
  }

  getKnowledge(): BusinessKnowledge {
    return this.knowledge;
  }
}
