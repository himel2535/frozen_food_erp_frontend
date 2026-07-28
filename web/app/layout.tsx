import type { Metadata } from 'next';
import { Nunito, Noto_Sans_Bengali } from 'next/font/google';
import '@/styles/globals.css';
import { AppReadyProvider } from '@/hooks/use-app-ready';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
});

export const metadata: Metadata = {
  title: 'Toys Factory ERP',
  description: 'Enterprise workspace for Toys Factory ERP',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoSansBengali.variable} h-full`}>
      <body className="bg-slate-50 font-sans text-slate-800 antialiased min-h-full">
        <AppReadyProvider>{children}</AppReadyProvider>
      </body>
    </html>
  );
}
