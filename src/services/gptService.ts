import OpenAI from 'openai';

interface BusinessInfo {
  businessName?: string;
  yearsInBusiness?: number;
  services?: string[];
  socialMediaLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    other?: string[];
  };
  leadsType?: {
    newInquiries?: boolean;
    returningClients?: boolean;
    description?: string;
  };
  leadsChannels?: string[];
  bookingProcess?: string;
  location?: string;
}

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class GPTService {
  private openai: OpenAI;
  private businessInfo: BusinessInfo = {};
  private conversationHistory: Message[] = [];
  private currentTopic: keyof BusinessInfo | null = null;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  updateBusinessInfo(info: Partial<BusinessInfo>) {
    this.businessInfo = { ...this.businessInfo, ...info };
  }

  getBusinessInfo(): BusinessInfo {
    return this.businessInfo;
  }

  resetConversation() {
    this.conversationHistory = [];
    this.currentTopic = null;
  }

  private determineNextTopic(): keyof BusinessInfo | null {
    const topics: (keyof BusinessInfo)[] = [
      'yearsInBusiness',
      'socialMediaLinks',
      'leadsType',
      'leadsChannels',
      'bookingProcess'
    ];

    return topics.find(topic => !this.businessInfo[topic]) || null;
  }

  getNextQuestion(): string {
    this.currentTopic = this.determineNextTopic();
    
    switch (this.currentTopic) {
      case 'yearsInBusiness':
        return "How long have you been in business?";
      case 'socialMediaLinks':
        return "Could you share your social media profiles where clients can find you?";
      case 'leadsType':
        return "I'd like to understand your client base better. Would you say most of your business comes from new clients, or do you work more with returning clients?";
      case 'leadsChannels':
        return "How do most of your clients typically reach out to you when they're interested in your services?";
      case 'bookingProcess':
        return "Could you walk me through your typical process when a new client wants to book your services?";
      default:
        return "Great! I think I have all the essential information about your business. Is there anything else you'd like to add or clarify?";
    }
  }

  async chat(message: string): Promise<string> {
    try {
      const nextQuestion = this.getNextQuestion();
      const systemPrompt = `You are a HoneyBook setup assistant helping to understand the business better. 

Current business information:
${JSON.stringify(this.businessInfo, null, 2)}

Current topic we're discussing: ${this.currentTopic || 'None'}
Next question to ask: "${nextQuestion}"

Your goal is to have a natural conversation while collecting missing information. Follow these rules:
1. NEVER ask about information we already have (check the business information above)
2. Stay focused on the current topic until we have the information we need
3. Ask follow-up questions if the answer is unclear
4. Be conversational and friendly
5. After getting clear information about the current topic, acknowledge it and then ask the next question provided above
6. If the user provides information about other topics, store it but stay focused on the current topic

Required information we need to collect:
- Years in business (number)
- Social media links (URLs)
- Leads type (mix of new vs returning clients)
- Leads channels (how clients reach out)
- Booking process (description)`;

      // Add system prompt if starting new conversation
      if (this.conversationHistory.length === 0) {
        this.conversationHistory.push({ role: 'system', content: systemPrompt });
      } else {
        // Update the system prompt with current state
        this.conversationHistory[0].content = systemPrompt;
      }

      // Add user message
      this.conversationHistory.push({ role: 'user', content: message });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: this.conversationHistory,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || 
        'I apologize, but I encountered an error. Could you please rephrase your message?';

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: assistantMessage });

      // Keep history from growing too large
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = [
          this.conversationHistory[0], // Keep system prompt
          ...this.conversationHistory.slice(-9) // Keep last 9 messages
        ];
      }

      // Extract and store any new information from the user's message
      await this.extractAndUpdateInfo(message);

      return assistantMessage;
    } catch (error) {
      console.error('GPT chat error:', error);
      return 'I apologize, but I encountered an error. Could you please rephrase your message?';
    }
  }

  private async extractAndUpdateInfo(message: string): Promise<void> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Extract business information from this message. Return ONLY a JSON object with any of these fields if mentioned:
              - businessName: string
              - yearsInBusiness: number
              - services: string[]
              - socialMediaLinks: object with platform URLs
              - leadsType: object with newInquiries (boolean), returningClients (boolean), and description
              - leadsChannels: string[]
              - bookingProcess: string
              - location: string
              
              Only include fields that are explicitly mentioned in the message.
              Current topic: ${this.currentTopic}`
          },
          {
            role: 'user',
            content: message,
          }
        ],
        temperature: 0.1,
      });

      const result = response.choices[0]?.message?.content;
      if (result) {
        try {
          const extractedInfo = JSON.parse(result);
          this.updateBusinessInfo(extractedInfo);
        } catch (error) {
          console.error('Failed to parse extracted info:', error);
        }
      }
    } catch (error) {
      console.error('Failed to extract business info:', error);
    }
  }
}
