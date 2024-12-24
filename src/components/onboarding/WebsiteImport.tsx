import { useState } from 'react';

interface IWebsiteImportProps {
  onSubmit: (url: string) => Promise<void>;
  onSkip: () => void;
}

export default function WebsiteImport({ onSubmit, onSkip }: IWebsiteImportProps): JSX.Element {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(url.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1D1D1D] mb-2">
          Let HoneyBook jump start your account!
        </h2>
        <p className="text-[#757575]">
          Add your website below, and we'll tailor your account to match your branding and business expression.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="website-url" className="block text-sm font-medium text-[#1D1D1D] mb-1">
            Your company website
          </label>
          <input
            id="website-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="www.mysite.com"
            className="input-field"
            required
          />
          <p className="mt-2 text-sm text-[#757575]">
            By continuing, you acknowledge responsibility for your website content and agree that HoneyBook can copy your website brand elements into your HoneyBook account.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="btn-secondary"
          >
            No thanks
          </button>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary"
          >
            Import from website
          </button>
        </div>
      </form>
    </div>
  );
}
