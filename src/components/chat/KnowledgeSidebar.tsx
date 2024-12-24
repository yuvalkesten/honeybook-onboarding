import { IConversationMessage } from '@/types/onboarding';

interface KnowledgeBaseProps {
  messages: IConversationMessage[];
  scrapedData: any;
  className?: string;
}

interface KnowledgeSection {
  title: string;
  items: string[];
  color?: string;
}

const KnowledgeSidebar = ({ messages, scrapedData, className = '' }: KnowledgeBaseProps) => {
  const extractServices = (data: any): string[] => {
    try {
      if (data?.analysis?.services) {
        return data.analysis.services.map((s: any) => s.name || s);
      }
      return [];
    } catch {
      return [];
    }
  };

  const extractValues = (data: any): string[] => {
    try {
      return data?.analysis?.brandPersonality?.values || 
             data?.analysis?.values || 
             [];
    } catch {
      return [];
    }
  };

  const extractImages = (data: any): string[] => {
    try {
      return (data?.images || [])
        .filter((img: any) => img.url && !img.isLogo)
        .map((img: any) => img.context || 'Unnamed image')
        .filter((context: string) => context !== 'Unnamed image')
        .slice(0, 5);
    } catch {
      return [];
    }
  };

  const sections: KnowledgeSection[] = [
    {
      title: 'Services',
      items: extractServices(scrapedData),
      color: 'text-blue-600',
    },
    {
      title: 'Values',
      items: extractValues(scrapedData),
      color: 'text-green-600',
    },
    {
      title: 'Key Visuals',
      items: extractImages(scrapedData),
      color: 'text-purple-600',
    },
  ].filter(section => section.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-6">What We Know So Far</h2>
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{section.title}</h3>
            <ul className="space-y-2">
              {section.items.map((item, index) => (
                <li 
                  key={index}
                  className={`flex items-center ${section.color || 'text-gray-600'}`}
                >
                  <span className="mr-2">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeSidebar;
