import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import '@/styles/globals.css';
import { AppReadyProvider } from '@/hooks/use-app-ready';
import { AppFeedbackProviders } from '@/components/shared/AppFeedbackProviders';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Food Fun Agro Foods',
  description: 'Enterprise workspace for Food Fun Agro Foods',
  icons: {
    icon: [{ url: '/images/logo-toys.png', type: 'image/png' }],
    apple: [{ url: '/images/logo-toys.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <body className="bg-slate-50 font-sans text-slate-800 antialiased min-h-full" suppressHydrationWarning>
        <AppReadyProvider>
          {children}
          <AppFeedbackProviders />
        </AppReadyProvider>
      </body>
    </html>
  );
}
