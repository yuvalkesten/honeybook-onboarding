import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'HoneyBook Onboarding',
  description: 'Personalized business setup with HoneyBook',
};

interface IRootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: IRootLayoutProps): JSX.Element {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
