import { useState, useEffect } from 'react';
import { IConversationMessage } from '@/types/onboarding';
import { BusinessInfo } from '@/types/business';
import ChatWindow from '../chat/ChatWindow';
import BusinessKnowledgeSidebar from './BusinessKnowledgeSidebar';
import Image from 'next/image';

const initialBusinessInfo: BusinessInfo = {
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

export default function OnboardingContainer(): JSX.Element {
  const [messages, setMessages] = useState<IConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(initialBusinessInfo);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [],
          }),
        });

        const data = await response.json();
        if (data.message) {
          const initialMessage: IConversationMessage = {
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          setMessages([initialMessage]);
        }

        if (data.businessInfo) {
          setBusinessInfo(data.businessInfo);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();
  }, []);

  const handleSendMessage = async (message: string) => {
    if (isLoading) return;

    const userMessage: IConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if the message might be a URL
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const isUrl = urlRegex.test(message.trim());

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          url: isUrl ? message.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (data.message) {
        const assistantMessage: IConversationMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      if (data.businessInfo) {
        setBusinessInfo(data.businessInfo);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: IConversationMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Could you please try again?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex justify-center items-center p-4 bg-white border-b">
        <Image
          src="/honeybook-logo.svg"
          alt="HoneyBook Logo"
          width={200}
          height={40}
          priority
        />
      </div>
      <div className="flex-1 flex">
        <div className="flex-1 p-6">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
        <BusinessKnowledgeSidebar knowledge={businessInfo} />
      </div>
    </div>
  );
}
