import OpenAI from 'openai';
import { IOnboardingGuidance, IExtractedInfo, IChatContext, IGPTMessage } from '@/types/gpt';
import { WebScraperService } from './webscraper';

export class GPTService {
  private openai: OpenAI;
  private context: IChatContext;
  private systemPrompt: string;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.context = {
      guidance: [],
      extractedInfo: [],
      currentPriority: 0,
      missingInfo: [],
    };
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    return `You are HoneyBook's intelligent onboarding assistant. Your goal is to understand the user's business needs and collect necessary information to set up their HoneyBook account.

Key Objectives:
1. Extract relevant business information naturally through conversation
2. Follow the guidance priorities
3. Be conversational but professional
4. Ask follow-up questions when needed
5. Validate information based on rules

Remember to:
- Keep responses concise and friendly
- Focus on one topic at a time
- Confirm important information
- Be empathetic to the user's business needs`;
  }

  public setGuidance(guidance: IOnboardingGuidance[]): void {
    this.context.guidance = guidance.sort((a, b) => a.priority - b.priority);
    this.context.currentPriority = guidance[0].priority;
    this.updateMissingInfo();
  }

  private updateMissingInfo(): void {
    const currentGuidance = this.context.guidance.find(
      (g) => g.priority === this.context.currentPriority,
    );
    
    if (!currentGuidance) return;

    this.context.missingInfo = currentGuidance.requiredInfo.filter((info) => {
      return !this.context.extractedInfo.some((extracted) => extracted.field === info);
    });
  }

  private buildConversationContext(): string {
    const currentGuidance = this.context.guidance.find(
      (g) => g.priority === this.context.currentPriority,
    );

    if (!currentGuidance) return '';

    return `
Current Focus: ${currentGuidance.category}
Required Information: ${currentGuidance.requiredInfo.join(', ')}
Missing Information: ${this.context.missingInfo.join(', ')}
Template: ${currentGuidance.promptTemplate}
Follow-up Questions: ${currentGuidance.followUpQuestions.join(', ')}

Previously Extracted Information:
${this.context.extractedInfo
  .map((info) => `- ${info.field}: ${info.value} (confidence: ${info.confidence})`)
  .join('\n')}`;
  }

  private async extractInformation(
    message: string,
    currentGuidance: IOnboardingGuidance,
  ): Promise<IExtractedInfo[]> {
    const extractionPrompt = `
Extract information from the following message according to these fields: ${currentGuidance.requiredInfo.join(
      ', ',
    )}

Message: "${message}"

Respond in JSON format with array of objects containing:
- field: the extracted field name
- value: the extracted value
- confidence: number between 0 and 1
- needsConfirmation: boolean if value needs confirmation

Only include fields where information was found.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0.3,
    });

    try {
      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Failed to parse extracted information:', error);
      return [];
    }
  }

  public async processMessage(message: string): Promise<{
    reply: string;
    extractedInfo: IExtractedInfo[];
  }> {
    const currentGuidance = this.context.guidance.find(
      (g) => g.priority === this.context.currentPriority,
    );

    if (!currentGuidance) {
      return {
        reply: "I'm not sure what information to collect next. Please check the configuration.",
        extractedInfo: [],
      };
    }

    // Handle initial greeting
    if (message === '__init__') {
      return {
        reply: currentGuidance.promptTemplate,
        extractedInfo: [],
      };
    }

    // Extract information from the user's message
    const newInfo = await this.extractInformation(message, currentGuidance);
    
    // Update context with new information
    this.context.extractedInfo = [...this.context.extractedInfo, ...newInfo];
    this.updateMissingInfo();

    // Check if we received a website URL
    const websiteInfo = newInfo.find(info => info.field === 'websiteUrl');
    if (websiteInfo && websiteInfo.value) {
      try {
        const scraperService = new WebScraperService();
        const websiteData = await scraperService.scrapeWebsite(websiteInfo.value as string);
        
        // Process website data with GPT
        const websiteAnalysisPrompt = `
Analyze this website data and extract key business information:
${JSON.stringify(websiteData, null, 2)}

Focus on:
1. Main services offered
2. Business type and industry
3. Target audience
4. Unique value propositions
5. Brand voice and style

Respond in JSON format with these fields:
{
  services: string[],
  businessType: string,
  industry: string,
  targetAudience: string,
  valuePropositions: string[],
  brandVoice: string
}`;

        const analysisResponse = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: websiteAnalysisPrompt }],
          temperature: 0.3,
        });

        try {
          const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
          
          // Add extracted information
          this.context.extractedInfo.push(
            ...Object.entries(analysis).map(([field, value]) => ({
              category: 'business',
              field,
              value,
              confidence: 0.8,
              needsConfirmation: true,
            }))
          );
        } catch (error) {
          console.error('Failed to parse website analysis:', error);
        }
      } catch (error) {
        console.error('Failed to analyze website:', error);
      }
    }

    // Generate response based on current context
    const conversationContext = this.buildConversationContext();
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: conversationContext },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    // Move to next priority if all required info is collected
    if (this.context.missingInfo.length === 0) {
      const nextGuidance = this.context.guidance.find(
        (g) => g.priority > this.context.currentPriority,
      );
      if (nextGuidance) {
        this.context.currentPriority = nextGuidance.priority;
        this.updateMissingInfo();
      }
    }

    return {
      reply: response.choices[0].message.content || '',
      extractedInfo: newInfo,
    };
  }
}
