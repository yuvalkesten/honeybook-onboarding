import { IOnboardingGuidance } from '@/types/gpt';

export const onboardingGuidance: IOnboardingGuidance[] = [
  {
    id: 'initial_greeting',
    priority: 1,
    category: 'business',
    requiredInfo: ['businessName', 'businessDescription'],
    promptTemplate: "Hi! I'm your HoneyBook assistant. I'll help you set up your account and customize it for your business. To get started, could you tell me your business name and a brief description of what you do?",
    followUpQuestions: [
      'What type of services do you offer?',
      'How long have you been in business?',
    ],
    validationRules: {
      required: true,
    },
  },
  {
    id: 'website_info',
    priority: 2,
    category: 'business',
    requiredInfo: ['websiteUrl'],
    promptTemplate: "Great to meet you! Could you share your website URL? I'll take a look and help customize your HoneyBook experience based on your services and brand.",
    followUpQuestions: [
      "If you don't have a website yet, no worries! We can set things up manually.",
    ],
  },
  {
    id: 'service_details',
    priority: 3,
    category: 'service',
    requiredInfo: ['primaryServices', 'averageProjectValue', 'serviceLocation'],
    promptTemplate: "Based on what I see on your website, you offer several services. Could you confirm these are your main offerings and let me know if I missed anything?",
    followUpQuestions: [
      "What's your typical project value?",
      'Do you work with clients remotely or in-person?',
    ],
  },
  {
    id: 'client_management',
    priority: 4,
    category: 'client',
    requiredInfo: ['clientCommunication', 'bookingProcess', 'painPoints'],
    promptTemplate: 'How do you currently manage client communications and bookings?',
    followUpQuestions: [
      "What's your biggest challenge in managing clients?",
      'How do you currently handle client contracts and payments?',
    ],
  },
];
