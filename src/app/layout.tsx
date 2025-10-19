import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WebVitals } from '@/components/performance/WebVitals';
import RootLayoutClient from '@/components/layout/RootLayoutClient';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'VISE INVESTO - Indian Investment Platform',
    template: '%s | VISE INVESTO',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  description: 'VISE INVESTO - Comprehensive financial education and investment platform for India. Learn about stocks, mutual funds, loans, credit cards, and brokers.',
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
    siteName: 'VISE INVESTO',
    title: 'VISE INVESTO - Indian Investment Platform',
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
    title: 'VISE INVESTO - Indian Investment Platform',
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
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}