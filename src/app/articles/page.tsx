import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = generatePageMetadata(
  'Financial Articles & Guides',
  'Comprehensive financial education articles covering investments, loans, credit cards, and financial planning in India.',
  '/articles',
  ['financial articles', 'investment guides', 'financial education', 'India finance']
);

export default function ArticlesPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Financial Articles & Guides',
    description: 'Comprehensive financial education articles covering investments, loans, credit cards, and financial planning in India.',
    url: 'https://investovise.com/articles',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Financial Articles',
      description: 'Educational articles about Indian financial markets and investment opportunities',
    },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">
            Financial Articles & Guides
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 mb-8 transition-colors duration-200">
            Explore our comprehensive collection of financial education articles, 
            investment guides, and market insights tailored for Indian investors.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Article cards will be populated here */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-200">Understanding SIP Investments</h2>
              <p className="text-gray-600 dark:text-slate-300 mb-4 transition-colors duration-200">
                Learn about Systematic Investment Plans and how they can help you build wealth over time.
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400 transition-colors duration-200">
                <span>5 min read</span>
                <span>Investment</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-200">Credit Card Rewards Guide</h2>
              <p className="text-gray-600 dark:text-slate-300 mb-4 transition-colors duration-200">
                Maximize your credit card rewards and cashback with these proven strategies.
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400 transition-colors duration-200">
                <span>7 min read</span>
                <span>Credit Cards</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white transition-colors duration-200">Home Loan EMI Calculator</h2>
              <p className="text-gray-600 dark:text-slate-300 mb-4 transition-colors duration-200">
                Calculate your home loan EMI and understand the factors that affect your payments.
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400 transition-colors duration-200">
                <span>4 min read</span>
                <span>Loans</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}