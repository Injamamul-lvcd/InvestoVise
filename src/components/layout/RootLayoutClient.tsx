'use client';

import { usePathname } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <div id="root" className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 transition-colors duration-200 ${!isAdminRoute ? 'pt-16' : ''}`}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}