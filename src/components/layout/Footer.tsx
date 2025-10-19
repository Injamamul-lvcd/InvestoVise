'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Investing',
      links: [
        { name: 'Stocks', href: '/investing/stocks' },
        { name: 'Mutual Funds', href: '/investing/mutual-funds' },
        { name: 'SIP Calculator', href: '/calculators/sip' },
        { name: 'ELSS Funds', href: '/investing/elss' },
      ]
    },
    {
      title: 'Products',
      links: [
        { name: 'Credit Cards', href: '/demo/credit-cards' },
        { name: 'Home Loans', href: '/loans/home-loans' },
        { name: 'Personal Loans', href: '/loans/personal-loans' },
        { name: 'Stock Brokers', href: '/brokers/stock-brokers' },
      ]
    },
    {
      title: 'Tools',
      links: [
        { name: 'EMI Calculator', href: '/calculators/emi' },
        { name: 'Tax Calculator', href: '/calculators/tax' },
        { name: 'Market News', href: '/news/market' },
        { name: 'Goal Planner', href: '/calculators/goal-planner' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
      ]
    }
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-3">
              {/* Bull Logo */}
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-amber-500/25">
                <svg className="w-5 h-5 text-white drop-shadow-sm" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 4c-2 0-4 1-5 3l-2 4c-1 2 0 4 2 5l1 1v3c0 2 1 3 3 3h4c2 0 3-1 3-3v-3l1-1c2-1 3-3 2-5l-2-4c-1-2-3-3-5-3z"/>
                  <path d="M12 6c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2zm6 0c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                  <circle cx="13" cy="12" r="1" opacity="0.8"/>
                  <circle cx="19" cy="12" r="1" opacity="0.8"/>
                  <path d="M14 15h4c0 1-1 2-2 2s-2-1-2-2z" opacity="0.9"/>
                  <path d="M24 20l4-4-4-4v2h-6v4h6v2z" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">InvestoVise</h3>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Wealth Builder</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
              Your trusted partner for financial education and investment guidance in India.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="#" className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © {currentYear} InvestoVise. All rights reserved.
              </p>
              <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-500">
                <span>Made with ❤️ in India</span>
                <span>•</span>
                <span>SEBI Registered</span>
                <span>•</span>
                <span>ISO 27001 Certified</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
              <Link href="/sitemap" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                Sitemap
              </Link>
              <Link href="/rss" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                RSS
              </Link>
              <Link href="/api-docs" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200">
                API
              </Link>
            </div>
          </div>
          
          {/* Compact Disclaimer */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Disclaimer:</strong> InvestoVise provides educational content for informational purposes only. 
              We are not SEBI registered investment advisors. Consult qualified financial advisors before making investment decisions. 
              Investments are subject to market risks.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;