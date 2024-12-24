import { BusinessKnowledge, BusinessService, SocialMediaLinks } from '@/types/business';
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter, FaPinterest, FaTiktok, FaGlobe } from 'react-icons/fa';
import { useEffect, useState } from 'react';

interface BusinessKnowledgeSidebarProps {
  knowledge: BusinessKnowledge;
}

const SocialMediaIcon = ({ type, url }: { type: keyof SocialMediaLinks; url: string }) => {
  const icons = {
    instagram: FaInstagram,
    facebook: FaFacebook,
    linkedin: FaLinkedin,
    twitter: FaTwitter,
    pinterest: FaPinterest,
    tiktok: FaTiktok,
    website: FaGlobe,
  };

  const Icon = icons[type];
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-600 hover:text-blue-600 transition-colors"
    >
      <Icon className="w-6 h-6" />
    </a>
  );
};

const ServiceCard = ({ service }: { service: BusinessService }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
    {service.imageUrl && (
      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
        <img
          src={service.imageUrl}
          alt={service.title}
          className="object-cover w-full h-full"
        />
      </div>
    )}
    <h3 className="font-medium text-gray-900">{service.title}</h3>
    <p className="text-sm text-gray-600">{service.description}</p>
    {service.price && (
      <p className="text-sm font-medium text-green-600">{service.price}</p>
    )}
  </div>
);

export default function BusinessKnowledgeSidebar({ knowledge }: BusinessKnowledgeSidebarProps) {
  const { businessName, yearsInBusiness, services, socialMedia } = knowledge;
  const socialLinks = Object.entries(socialMedia).filter(([_, url]) => url) as [keyof SocialMediaLinks, string][];

  // Client-side only time formatting
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    setFormattedTime(knowledge.lastUpdated.toLocaleString());
  }, [knowledge.lastUpdated]);

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-full overflow-y-auto p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Business Profile</h2>
        
        {businessName && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
            <p className="text-gray-900">{businessName}</p>
          </div>
        )}

        {yearsInBusiness && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500">Years in Business</h3>
            <p className="text-gray-900">{yearsInBusiness} years</p>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Social Media</h3>
            <div className="flex gap-4">
              {socialLinks.map(([type, url]) => (
                <SocialMediaIcon key={type} type={type} url={url} />
              ))}
            </div>
          </div>
        )}
      </div>

      {services.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-4">Services</h3>
          <div className="space-y-4">
            {services.map((service, index) => (
              <ServiceCard key={index} service={service} />
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        {formattedTime && `Last updated: ${formattedTime}`}
      </div>
    </div>
  );
}
