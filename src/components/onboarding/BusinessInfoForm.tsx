import { useState } from 'react';
import { IBusinessInfo } from '@/types/onboarding';

interface IBusinessInfoFormProps {
  onSubmit: (info: Partial<IBusinessInfo>) => Promise<void>;
  currentStep: number;
}

const BUSINESS_TOOLS = [
  'Gmail',
  'Microsoft Outlook',
  'Apple Mail',
  'Other email client',
  'Spreadsheets',
  'Paper documents',
  'Project management tool',
];

const REVENUE_OPTIONS = [
  { label: '$0-5K', value: '0-5000' },
  { label: '$5-20K', value: '5000-20000' },
  { label: '$20-50K', value: '20000-50000' },
  { label: '$50-200K', value: '50000-200000' },
  { label: '$200K+', value: '200000+' },
];

const BUSINESS_AGE_OPTIONS = [
  { label: 'Haven\'t started', value: '0' },
  { label: 'Under a year', value: '<1' },
  { label: '1-2 years', value: '1-2' },
  { label: '3-4 years', value: '3-4' },
  { label: '5+ years', value: '5+' },
];

export default function BusinessInfoForm({ onSubmit, currentStep }: IBusinessInfoFormProps): JSX.Element {
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [businessAge, setBusinessAge] = useState<string>('');
  const [revenue, setRevenue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const info: Partial<IBusinessInfo> = {};
      
      switch (currentStep) {
        case 1:
          info.businessType = selectedTool;
          break;
        case 2:
          // Convert businessAge to a number if it's not "Haven't started"
          info.averageProjectValue = revenue ? parseInt(revenue.split('-')[0]) : null;
          break;
      }

      await onSubmit(info);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = (): JSX.Element => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#1D1D1D] mb-2">
              What's the main tool you use to run your business?
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {BUSINESS_TOOLS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => setSelectedTool(tool)}
                  className={`text-left px-4 py-3 rounded-lg border ${
                    selectedTool === tool
                      ? 'border-[#F06C5C] bg-[#FFF5F4]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1D1D1D] mb-2">
                How long have you had your business?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_AGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBusinessAge(option.value)}
                    className={`px-4 py-3 rounded-lg border ${
                      businessAge === option.value
                        ? 'border-[#F06C5C] bg-[#FFF5F4]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1D1D1D] mb-2">
                What's your average annual business revenue?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {REVENUE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRevenue(option.value)}
                    className={`px-4 py-3 rounded-lg border ${
                      revenue === option.value
                        ? 'border-[#F06C5C] bg-[#FFF5F4]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderStep()}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || (!selectedTool && !businessAge && !revenue)}
          className="btn-primary"
        >
          Next
        </button>
      </div>
    </form>
  );
}
