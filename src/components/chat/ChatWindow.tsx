import { useState, useRef, useEffect } from 'react';
import { IConversationMessage } from '@/types/onboarding';
import KnowledgeSidebar from './KnowledgeSidebar';

interface IChatWindowProps {
  messages: IConversationMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  scrapedData?: any;
}

export default function ChatWindow({ 
  messages, 
  onSendMessage, 
  isLoading,
  scrapedData,
}: IChatWindowProps): JSX.Element {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      const message = inputValue.trim();
      setInputValue('');
      await onSendMessage(message);
    }
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="h-[400px] overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg p-3">
                <p>Typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {scrapedData && (
        <div className="w-80 flex-shrink-0">
          <KnowledgeSidebar 
            messages={messages} 
            scrapedData={scrapedData} 
            className="sticky top-6"
          />
        </div>
      )}
    </div>
  );
}
