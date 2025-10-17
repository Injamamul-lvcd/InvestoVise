import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar, Footer } from '@/components/layout';
import { WebVitals } from '@/components/performance/WebVitals';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'InvestoVise - Indian Investment Platform',
    template: '%s | InvestoVise',
  },
  description: 'Comprehensive financial education and investment platform for India. Learn about stocks, mutual funds, loans, credit cards, and brokers.',
  keywords: ['investment', 'finance', 'India', 'stocks', 'mutual funds', 'loans', 'credit cards', 'brokers', 'financial education'],
  authors: [{ name: 'InvestoVise Team' }],
  creator: 'InvestoVise',
  publisher: 'InvestoVise',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://investovise.com',
    siteName: 'InvestoVise',
    title: 'InvestoVise - Indian Investment Platform',
    description: 'Comprehensive financial education and investment platform for India',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'InvestoVise - Indian Investment Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@investovise',
    creator: '@investovise',
    title: 'InvestoVise - Indian Investment Platform',
    description: 'Comprehensive financial education and investment platform for India',
    images: ['/images/og-default.jpg'],
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WebVitals />
        <div id="root" className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 transition-colors duration-200 pt-16">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}