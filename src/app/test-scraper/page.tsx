'use client';

import { useState } from 'react';

interface ScrapedData {
  pages: any[];
  images: any[];
  analysis?: any;
}

interface IConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

const JsonView = ({ data }: { data: any }) => {
  if (!data) return null;
  
  if (typeof data !== 'object') {
    return <span className="text-gray-800">{JSON.stringify(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="pl-4 border-l border-gray-200">
        {data.map((item, index) => (
          <div key={index} className="mt-2">
            <span className="text-gray-500">[{index}]</span>
            <JsonView data={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pl-4 border-l border-gray-200">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mt-2">
          <span className="text-blue-600 font-medium">{key}:</span>{' '}
          <JsonView data={value} />
        </div>
      ))}
    </div>
  );
};

interface ImageInfo {
  url: string;
  alt: string;
  context: string;
  isLogo?: boolean;
  downloaded?: any;
}

interface ChatWindowProps {
  messages: IConversationMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  scrapedData: ScrapedData;
}

const ChatWindow = ({ messages, onSendMessage, isLoading, scrapedData }: ChatWindowProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage(message);
    setMessage('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div className={`bg-${message.role === 'assistant' ? 'blue' : 'gray'}-100 p-2 rounded-lg ${message.role === 'assistant' ? 'text-blue-600' : 'text-gray-600'}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default function TestScraper() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ScrapedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<IConversationMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setData(null);
    setMessages([]);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape website');
      }

      setData(result.data);
      
      // Get initial greeting from the chat API
      try {
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [],
            scrapedData: result.data,
          }),
        });

        const chatResult = await chatResponse.json();

        if (!chatResponse.ok) {
          throw new Error(chatResult.error || 'Failed to start chat');
        }

        const initialMessage: IConversationMessage = {
          role: 'assistant',
          content: chatResult.message,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
      } catch (err) {
        console.error('Failed to get initial greeting:', err);
        const fallbackMessage: IConversationMessage = {
          role: 'assistant',
          content: "I've analyzed the website. What would you like to know about this business?",
          timestamp: new Date(),
        };
        setMessages([fallbackMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!data) return;

    const userMessage: IConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          scrapedData: data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      const assistantMessage: IConversationMessage = {
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: IConversationMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const ImageDetails = ({ image }: { image: ImageInfo }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Image Details</h3>
          <button
            onClick={() => setSelectedImage(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image.downloaded?.localPath.replace('public', '') || image.url}
              alt={image.alt}
              className="object-contain w-full h-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">Original URL:</h4>
              <a href={image.url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:underline break-all">
                {image.url}
              </a>
            </div>
            
            <div>
              <h4 className="font-medium">Alt Text:</h4>
              <p>{image.alt || 'None'}</p>
            </div>

            {image.downloaded && (
              <>
                <div>
                  <h4 className="font-medium">File Size:</h4>
                  <p>{formatBytes(image.downloaded.size)}</p>
                </div>

                <div>
                  <h4 className="font-medium">MIME Type:</h4>
                  <p>{image.downloaded.mimeType}</p>
                </div>

                <div>
                  <h4 className="font-medium">Local Path:</h4>
                  <p className="break-all">{image.downloaded.localPath}</p>
                </div>

                {image.downloaded.dimensions && (
                  <div>
                    <h4 className="font-medium">Dimensions:</h4>
                    <p>{image.downloaded.dimensions.width}x{image.downloaded.dimensions.height}</p>
                  </div>
                )}
              </>
            )}

            <div className="col-span-2">
              <h4 className="font-medium">Context:</h4>
              <p className="mt-1 text-gray-600">{image.context || 'No context available'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold mb-4">Website Scraper Test</h1>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Scraping...' : 'Scrape'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h2 className="text-red-800 font-medium mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Chat with Your Data</h2>
              <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                scrapedData={data}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
              <div className="prose max-w-none">
                <JsonView data={data} />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedImage && <ImageDetails image={selectedImage} />}
    </div>
  );
}
