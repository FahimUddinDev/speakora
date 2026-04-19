import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/store/provider';
import AIProviderModal from '@/components/AIProviderModal';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Speakora — AI English Conversation Partner',
  description:
    'Practice English naturally with Speakora. Real-time conversations, roleplay scenarios, grammar correction, and voice chat — powered by local AI.',
  keywords: ['English learning', 'AI conversation', 'language practice', 'grammar correction'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <StoreProvider>
          {children}
          <AIProviderModal />
        </StoreProvider>
      </body>
    </html>
  );
}
