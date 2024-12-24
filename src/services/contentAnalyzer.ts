import OpenAI from 'openai';

interface BusinessAnalysis {
  name?: string;
  description?: string;
  services?: string[];
  location?: string;
  targetMarket?: string[];
}

export class ContentAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async analyzeWithGPT4(content: string): Promise<BusinessAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the website content and extract only the most important business information in a simple format. Focus on:
              - Business name
              - Brief description (1-2 sentences)
              - Main services (as a list)
              - Location
              - Target market
              
              Return ONLY a JSON object with these fields. Keep it simple and concise.`
          },
          {
            role: 'user',
            content,
          }
        ],
        temperature: 0.3, // More focused responses
      });

      const result = response.choices[0]?.message?.content || '{}';
      
      try {
        return JSON.parse(result);
      } catch (error) {
        console.error('Failed to parse GPT response:', error);
        return {};
      }
    } catch (error) {
      console.error('GPT analysis failed:', error);
      return {};
    }
  }
}