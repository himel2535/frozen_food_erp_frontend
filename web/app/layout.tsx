import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '@/styles/globals.css';
import { AppReadyProvider } from '@/hooks/use-app-ready';
import { AppFeedbackProviders } from '@/components/shared/AppFeedbackProviders';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Toys Factory ERP',
  description: 'Enterprise workspace for Toys Factory ERP',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <body className="bg-slate-50 font-sans text-slate-800 antialiased min-h-full" suppressHydrationWarning>
        <AppReadyProvider>
          {children}
          <AppFeedbackProviders />
        </AppReadyProvider>
      </body>
    </html>
  );
}
