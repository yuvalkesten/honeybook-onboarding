import { useState, useEffect } from 'react';
import { IConversationMessage } from '@/types/onboarding';
import { BusinessKnowledge } from '@/types/business';
import { ConversationState } from '@/types/conversation';
import ChatWindow from '../chat/ChatWindow';
import BusinessKnowledgeSidebar from './BusinessKnowledgeSidebar';
import Image from 'next/image';

const initialKnowledge: BusinessKnowledge = {
  services: [],
  socialMedia: {},
  lastUpdated: new Date().toISOString(),
  confidence: {},
};

const initialConversationState: ConversationState = {
  stage: 'greeting',
  businessInsights: {},
};

export default function OnboardingContainer(): JSX.Element {
  const [messages, setMessages] = useState<IConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [knowledge, setKnowledge] = useState<BusinessKnowledge>(initialKnowledge);
  const [conversationState, setConversationState] = useState<ConversationState>(initialConversationState);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '__init__',
            conversationState: initialConversationState,
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

        if (data.conversationState) {
          setConversationState(data.conversationState);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    initializeChat();
  }, []);

  useEffect(() => {
    const updateKnowledge = async () => {
      if (!conversationState.websiteContent) return;

      try {
        const response = await fetch('/api/knowledge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            websiteContent: conversationState.websiteContent,
            messages,
          }),
        });

        const data = await response.json();
        if (data.knowledge) {
          setKnowledge(data.knowledge);
        }
      } catch (error) {
        console.error('Failed to update knowledge:', error);
      }
    };

    updateKnowledge();
  }, [messages, conversationState.websiteContent]);

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationState,
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

      if (data.conversationState) {
        setConversationState(data.conversationState);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
        <BusinessKnowledgeSidebar knowledge={knowledge} />
      </div>
    </div>
  );
}
