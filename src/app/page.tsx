import { StructuredData } from '@/components/seo/StructuredData';

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'InvestoVise',
    description: 'Comprehensive financial education and investment platform for India',
    url: 'https://investovise.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://investovise.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://twitter.com/investovise',
      'https://facebook.com/investovise',
      'https://linkedin.com/company/investovise',
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Indian Investment Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your comprehensive guide to financial education, investment tools, and 
            financial products tailored for the Indian market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary text-lg px-8 py-3">
              Explore Content
            </button>
            <button className="btn-secondary text-lg px-8 py-3">
              Financial Tools
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4 text-primary-700">
              Educational Content
            </h3>
            <p className="text-gray-600">
              Learn about Indian financial markets, investment strategies, and regulations.
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4 text-secondary-700">
              Financial Tools
            </h3>
            <p className="text-gray-600">
              Use our calculators for SIP, EMI, tax planning, and retirement planning.
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-xl font-semibold mb-4 text-accent-700">
              Product Comparison
            </h3>
            <p className="text-gray-600">
              Compare loans, credit cards, and brokers to find the best options.
            </p>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}