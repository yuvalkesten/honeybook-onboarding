import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BusinessAnalyzer } from '@/services/businessAnalyzer';
import { IConversationMessage } from '@/types/onboarding';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const businessAnalyzer = new BusinessAnalyzer(process.env.OPENAI_API_KEY || '');

const INITIAL_MESSAGE = "Hi! I'm your HoneyBook setup assistant. I'll help you streamline your business processes and set up HoneyBook to work perfectly for you. To get started, could you share your business website URL with me?";

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\w .-]*)*\/?$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    let url = body.url;

    // Handle initial request with no messages
    if (messages.length === 0) {
      return NextResponse.json({
        message: INITIAL_MESSAGE,
        businessInfo: businessAnalyzer.getBusinessInfo(),
      });
    }

    // Check if the latest message might be a URL
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user' && !url) {
      const possibleUrl = lastMessage.content.trim();
      if (urlRegex.test(possibleUrl)) {
        url = possibleUrl;
      }
    }

    // If we have a URL in the latest message, try to scrape it
    if (url) {
      try {
        const scrapeResponse = await fetch(new URL('/api/scrape', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!scrapeResponse.ok) {
          console.error('Scrape failed:', await scrapeResponse.text());
          return NextResponse.json({
            message: "I had trouble accessing that website. Could you please verify the URL or tell me about your business directly?",
            businessInfo: businessAnalyzer.getBusinessInfo(),
          });
        }

        const { analysis: businessInfo } = await scrapeResponse.json();
        
        if (businessInfo) {
          // Create a summary of what we found
          let summary = "I've found some information about your business from your website. Let me confirm what I know:\n";
          if (businessInfo.name) summary += `\n- Your business name is ${businessInfo.name}`;
          if (businessInfo.services.length) summary += `\n- You offer services including: ${businessInfo.services.map(s => s.name).join(', ')}`;
          if (businessInfo.location) summary += `\n- You're located in ${businessInfo.location}`;
          summary += "\n\nIs this information correct? And could you tell me more about your business goals and what brings you to HoneyBook?";

          return NextResponse.json({
            message: summary,
            businessInfo,
          });
        }
      } catch (error) {
        console.error('Error during website scraping:', error);
        return NextResponse.json({
          message: "I encountered an issue while analyzing your website. Could you tell me about your business directly?",
          businessInfo: businessAnalyzer.getBusinessInfo(),
        });
      }
    }

    // Analyze the conversation for new insights
    await businessAnalyzer.analyzeConversation(messages);
    const businessInfo = businessAnalyzer.getBusinessInfo();

    // Get chat completion from GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a friendly business assistant helping a business owner onboard to HoneyBook.
          Use this business information to personalize your responses:
          ${JSON.stringify(businessInfo, null, 2)}
          
          Keep your responses friendly, concise, and focused on understanding their business needs.
          Ask questions to learn more about their business processes, challenges, and goals.`,
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, but I am unable to respond at the moment.';

    return NextResponse.json({
      message: reply,
      businessInfo,
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
