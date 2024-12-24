import { NextResponse } from 'next/server';
import { GPTService } from '@/services/gptService';
import { ConversationState } from '@/types/conversation';

const STATIC_MESSAGES = {
  greeting: "Hi! I'm your HoneyBook setup assistant. I'll help you streamline your business processes and set up HoneyBook to work perfectly for you. To get started, could you share your business website URL with me?",
};

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

export async function POST(request: Request) {
  try {
    const { message, conversationState } = await request.json();
    
    // Create a new GPT service instance for this request
    const gptService = new GPTService(process.env.OPENAI_API_KEY || '');

    // If there's existing business info in the conversation state, restore it
    if (conversationState?.businessInsights) {
      gptService.updateBusinessInfo(conversationState.businessInsights);
    }

    // Handle initial load (no message or state)
    if (!message && !conversationState) {
      return NextResponse.json({
        message: STATIC_MESSAGES.greeting,
        conversationState: {
          stage: 'url_request',
          websiteContent: '',
          businessInsights: {},
          hasScraped: false,
        },
      });
    }

    // Handle URL request stage
    if (conversationState.stage === 'url_request') {
      if (!urlRegex.test(message)) {
        return NextResponse.json({
          message: "That doesn't look like a valid website URL. Could you please share a URL starting with http:// or https://?",
          conversationState,
        });
      }

      try {
        const scrapeResponse = await fetch(new URL('/api/scrape', request.url), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: message }),
        });

        const scrapeData = await scrapeResponse.json();

        // Initialize business info with scraped data
        if (scrapeData.analysis) {
          gptService.updateBusinessInfo({
            businessName: scrapeData.analysis.name,
            services: scrapeData.analysis.services,
            location: scrapeData.analysis.location,
          });
        }

        // Get current business info
        const businessInfo = gptService.getBusinessInfo();
        
        // Start the conversation with a summary of what we know
        const initialPrompt = `I've found some information about your business from your website. Let me confirm what I know:
${businessInfo.businessName ? `- Your business name is ${businessInfo.businessName}` : ''}
${businessInfo.services?.length ? `- You offer services including: ${businessInfo.services.join(', ')}` : ''}
${businessInfo.location ? `- You're located in ${businessInfo.location}` : ''}

Let me ask about some details I couldn't find. ${gptService.getNextQuestion()}`;

        return NextResponse.json({
          message: initialPrompt,
          conversationState: {
            stage: 'business_analysis',
            websiteContent: scrapeData.content || '',
            businessInsights: businessInfo,
            hasScraped: true,
          },
        });

      } catch (error) {
        console.error('Error during website analysis:', error);
        return NextResponse.json({
          message: "I encountered an issue while analyzing your website. Would you like to tell me about your business directly?",
          conversationState: {
            stage: 'business_analysis',
            websiteContent: '',
            businessInsights: {},
            hasScraped: true,
          },
        });
      }
    }

    // Handle business analysis stage
    if (conversationState.stage === 'business_analysis') {
      const response = await gptService.chat(message);

      return NextResponse.json({
        message: response,
        conversationState: {
          ...conversationState,
          businessInsights: gptService.getBusinessInfo(),
        },
      });
    }

    // Fallback - start over
    return NextResponse.json({
      message: STATIC_MESSAGES.greeting,
      conversationState: {
        stage: 'url_request',
        websiteContent: '',
        businessInsights: {},
        hasScraped: false,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
