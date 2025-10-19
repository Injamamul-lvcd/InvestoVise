'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'News',
    href: '/news',
    children: [
      { name: 'All News', href: '/news' },
      { name: 'Market News', href: '/news?category=market' },
      { name: 'Economic News', href: '/news?category=economy' },
      { name: 'Policy Updates', href: '/news?category=policy' },
      { name: 'Company News', href: '/news?category=company' },
    ]
  },
  {
    name: 'Articles',
    href: '/articles',
    children: [
      { name: 'All Articles', href: '/articles' },
      { name: 'Investment Guide', href: '/articles?category=investment' },
      { name: 'Stocks', href: '/articles?category=stocks' },
      { name: 'Mutual Funds', href: '/articles?category=mutual-funds' },
      { name: 'SIP Guide', href: '/articles?category=sip' },
      { name: 'Tax Planning', href: '/articles?category=tax' },
    ]
  },
  {
    name: 'Loans',
    href: '/loans',
    children: [
      { name: 'Compare All Loans', href: '/loans' },
      { name: 'Home Loans', href: '/loans?type=home' },
      { name: 'Personal Loans', href: '/loans?type=personal' },
      { name: 'Car Loans', href: '/loans?type=car' },
      { name: 'Business Loans', href: '/loans?type=business' },
    ]
  },
  {
    name: 'Credit Cards',
    href: '/credit-cards',
    children: [
      { name: 'Compare All Cards', href: '/credit-cards' },
      { name: 'Cashback Cards', href: '/credit-cards?type=cashback' },
      { name: 'Reward Cards', href: '/credit-cards?type=rewards' },
      { name: 'Travel Cards', href: '/credit-cards?type=travel' },
      { name: 'Business Cards', href: '/credit-cards?type=business' },
    ]
  },
  {
    name: 'Brokers',
    href: '/brokers',
    children: [
      { name: 'Compare All Brokers', href: '/brokers' },
      { name: 'Discount Brokers', href: '/brokers?type=discount' },
      { name: 'Full Service Brokers', href: '/brokers?type=full-service' },
      { name: 'Online Brokers', href: '/brokers?type=online' },
    ]
  },
  {
    name: 'Tools',
    href: '/calculators',
    badge: 'New',
    children: [
      { name: 'All Calculators', href: '/calculators' },
      { name: 'SIP Calculator', href: '/calculators?calc=sip' },
      { name: 'EMI Calculator', href: '/calculators?calc=emi' },
      { name: 'Tax Calculator', href: '/calculators?calc=tax' },
      { name: 'Retirement Calculator', href: '/calculators?calc=retirement' },
      { name: 'Goal Planner', href: '/calculators?calc=goal' },
    ]
  },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up any pending timeouts
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout);
      }
    };
  }, [dropdownTimeout]);

  const handleDropdownToggle = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const openDropdown = (name: string) => {
    // Clear any existing timeout
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setActiveDropdown(name);
  };

  const closeDropdown = () => {
    // Set a timeout to close dropdown (like Investopedia)
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
    setDropdownTimeout(timeout);
  };

  const cancelCloseDropdown = () => {
    // Cancel the close timeout when mouse enters dropdown area
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
  };

  const keepDropdownOpen = (name: string) => {
    // Keep dropdown open and cancel any close timeout
    cancelCloseDropdown();
    setActiveDropdown(name);
  };

  const isActivePath = (href: string) => {
    // Handle exact matches first
    if (pathname === href) {
      return true;
    }

    // Handle query parameters for the same base path
    const [basePath, query] = href.split('?');
    const [currentBasePath] = pathname.split('?');

    if (basePath === currentBasePath && query) {
      // Check if the current URL contains the same query parameters
      const currentUrl = typeof window !== 'undefined' ? window.location.search : '';
      return currentUrl.includes(query.split('=')[1]);
    }

    // Handle sub-paths but be more specific to avoid conflicts
    if (href !== '/' && pathname.startsWith(href + '/')) {
      // Make sure we're not matching broader paths
      // For example, /articles shouldn't match /articles-admin
      const nextChar = pathname.charAt(href.length);
      return nextChar === '/' || nextChar === '';
    }

    return false;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${isDarkMode
      ? `bg-slate-900/95 border-b border-slate-700/50 ${isScrolled ? 'shadow-2xl shadow-slate-900/30' : ''}`
      : `bg-white/98 border-b border-slate-300/60 ${isScrolled ? 'shadow-2xl shadow-slate-900/15' : 'shadow-lg shadow-slate-900/5'}`
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-3">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="flex items-center space-x-3">
                {/* VISE INVESTO YouTube Logo */}
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-black border-2 ${
                  isDarkMode 
                    ? 'border-white shadow-xl shadow-yellow-500/40' 
                    : 'border-gray-200 shadow-xl shadow-yellow-500/30'
                }`}>
                  {/* YouTube Channel Bull Logo */}
                  <svg className="w-8 h-8 text-yellow-400 drop-shadow-sm" viewBox="0 0 100 100" fill="currentColor">
                    {/* Bull silhouette inspired by your YouTube logo */}
                    {/* Bull horns */}
                    <path d="M35 25c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z"/>
                    <path d="M65 25c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z"/>
                    {/* Bull head and body */}
                    <path d="M30 30c0-3 3-5 6-5h28c3 0 6 2 6 5v15c0 8-4 12-8 15-2 2-5 3-12 3s-10-1-12-3c-4-3-8-7-8-15V30z"/>
                    {/* Bull legs */}
                    <rect x="35" y="60" width="4" height="15" rx="2"/>
                    <rect x="45" y="60" width="4" height="15" rx="2"/>
                    <rect x="55" y="60" width="4" height="15" rx="2"/>
                    <rect x="65" y="60" width="4" height="15" rx="2"/>
                    {/* Bull tail */}
                    <path d="M70 45c3 0 5 1 7 3l2 2c1 1 1 2 0 3l-2 2c-2 2-4 3-7 3"/>
                  </svg>
                  {/* Premium glow effect */}
                  <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-20 transition-all duration-300 blur-sm"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1">
                    <span className={`text-lg font-bold tracking-tight transition-all duration-200 ${isDarkMode ? 'text-white group-hover:text-yellow-400' : 'text-slate-900 group-hover:text-yellow-600'
                      }`}>
                      VISE
                    </span>
                    <span className={`text-lg font-bold tracking-tight transition-all duration-200 ${isDarkMode ? 'text-yellow-400 group-hover:text-yellow-300' : 'text-yellow-600 group-hover:text-yellow-700'
                      }`}>
                      INVESTO
                    </span>
                  </div>
                  <span className={`text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${isDarkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-700'
                    }`}>
                    YouTube Channel
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-1 ml-6">
              {navigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.children ? (
                    <div
                      className="relative"
                      onMouseEnter={() => keepDropdownOpen(item.name)}
                      onMouseLeave={closeDropdown}
                    >
                      <button
                        className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group whitespace-nowrap relative overflow-hidden ${isActivePath(item.href)
                          ? isDarkMode
                            ? 'text-amber-400 bg-gradient-to-r from-amber-500/15 to-orange-500/15 shadow-lg shadow-amber-500/25 border border-amber-500/30'
                            : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg shadow-amber-500/20 border border-amber-200/60'
                          : isDarkMode
                            ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 hover:shadow-lg hover:scale-105'
                            : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50 hover:shadow-lg hover:scale-105'
                          }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span className="relative flex items-center">
                          {item.name}
                          {item.badge && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg shadow-green-500/30 animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <svg className={`ml-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-180 relative`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Enhanced Dropdown Menu */}
                      {activeDropdown === item.name && (
                        <div
                          className={`absolute left-0 top-full w-80 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform animate-in slide-in-from-top-2 ${isDarkMode
                            ? 'bg-slate-800/95 border-slate-700/50 shadow-slate-900/60'
                            : 'bg-white/95 border-slate-200/50 shadow-slate-900/20'
                            }`}
                          onMouseEnter={() => keepDropdownOpen(item.name)}
                          onMouseLeave={closeDropdown}
                        >
                          <div className="py-2">
                            {item.children.map((child, index) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`flex items-center px-5 py-3.5 text-sm font-medium transition-all duration-200 group ${isActivePath(child.href)
                                  ? isDarkMode
                                    ? 'text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-2 border-amber-400'
                                    : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border-l-2 border-amber-500'
                                  : isDarkMode
                                    ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-700/50 hover:border-l-2 hover:border-amber-400/50'
                                    : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50 hover:border-l-2 hover:border-amber-500/50'
                                  } ${index === 0 ? 'rounded-t-2xl' : ''} ${index === item.children!.length - 1 ? 'rounded-b-2xl' : ''}`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                <div className={`w-2 h-2 rounded-full mr-4 transition-all duration-200 ${isActivePath(child.href)
                                  ? 'bg-amber-500 shadow-lg shadow-amber-500/50'
                                  : isDarkMode
                                    ? 'bg-slate-600 group-hover:bg-amber-400'
                                    : 'bg-slate-300 group-hover:bg-amber-500'
                                  }`}></div>
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105 ${isActivePath(item.href)
                        ? isDarkMode
                          ? 'text-amber-400 bg-gradient-to-r from-amber-500/15 to-orange-500/15 shadow-lg shadow-amber-500/25 border border-amber-500/30'
                          : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg shadow-amber-500/20 border border-amber-200/60'
                        : isDarkMode
                          ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 hover:shadow-lg'
                          : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50 hover:shadow-lg'
                        }`}
                    >
                      <span className="flex items-center">
                        {item.name}
                        {item.badge && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg shadow-green-500/30 animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Search, Theme Toggle and Auth */}
          <div className="hidden lg:flex items-center space-x-1.5 flex-shrink-0 min-w-0">
            {/* Enhanced Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-4 w-4 transition-all duration-200 ${isDarkMode ? 'text-slate-400 group-focus-within:text-amber-400' : 'text-slate-400 group-focus-within:text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search investments, loans, cards..."
                className={`block w-44 pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:w-56 ${isDarkMode
                  ? 'bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-400 focus:ring-amber-500 focus:border-amber-500 focus:ring-offset-slate-900 shadow-inner focus:bg-slate-800/80'
                  : 'bg-slate-50/80 border border-slate-200/50 text-slate-900 placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500 focus:ring-offset-white shadow-inner focus:bg-white/90'
                  }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <kbd className={`hidden sm:inline-flex items-center px-2 py-0.5 border border-gray-200 dark:border-slate-600 rounded text-xs font-sans font-medium transition-colors duration-200 ${isDarkMode ? 'text-slate-400 bg-slate-700/50' : 'text-slate-500 bg-gray-100'
                  }`}>
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 shadow-md ${isDarkMode
                ? 'bg-slate-800/60 text-amber-400 hover:bg-slate-700/60 hover:text-amber-300 hover:shadow-lg hover:shadow-amber-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700 hover:shadow-lg'
                }`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Enhanced Auth Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Link
                href="/auth/login"
                className={`group flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${isDarkMode
                  ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 hover:shadow-lg border-slate-700/50 hover:border-amber-500/50'
                  : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50 hover:shadow-lg border-slate-200/50 hover:border-amber-500/50'
                  }`}
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </Link>
              <Link
                href="/auth/signup"
                className="group relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-105 border border-amber-400/20 whitespace-nowrap flex-shrink-0 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center space-x-2">
                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Start Investing</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile menu button and theme toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 ${isDarkMode
                ? 'bg-gray-800/50 text-yellow-400 hover:bg-gray-700/50'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 border ${isDarkMode
                ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 border-slate-700/50 hover:border-amber-500/50'
                : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50 border-slate-200/50 hover:border-amber-500/50'
                }`}
            >
              {isOpen ? (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className={`px-4 pt-4 pb-6 space-y-4 backdrop-blur-xl border-t transition-all duration-200 ${isDarkMode
            ? 'bg-slate-900/95 border-slate-800/50'
            : 'bg-white/95 border-slate-200/50'
            }`}>
            {/* Mobile Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                className={`block w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 shadow-inner ${isDarkMode
                  ? 'bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-400 focus:ring-amber-500 focus:border-amber-500'
                  : 'bg-slate-50/80 border border-slate-200/50 text-slate-900 placeholder-slate-500 focus:ring-amber-500 focus:border-amber-500'
                  }`}
              />
            </div>

            {/* Mobile Navigation Items */}
            <div className="space-y-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.name)}
                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 ${isActivePath(item.href)
                          ? isDarkMode
                            ? 'text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
                            : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
                          : isDarkMode
                            ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60'
                            : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50'
                          }`}
                      >
                        <span className="flex items-center">
                          {item.name}
                          {item.badge && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg shadow-green-500/30 animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === item.name ? 'rotate-180' : ''
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeDropdown === item.name && (
                        <div className="mt-2 ml-4 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActivePath(child.href)
                                ? isDarkMode
                                  ? 'text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-2 border-amber-400'
                                  : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border-l-2 border-amber-500'
                                : isDarkMode
                                  ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/40 hover:border-l-2 hover:border-amber-400/50'
                                  : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50 hover:border-l-2 hover:border-amber-500/50'
                                }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <div className={`w-2 h-2 rounded-full mr-4 transition-all duration-200 ${isActivePath(child.href)
                                ? 'bg-amber-500 shadow-lg shadow-amber-500/50'
                                : isDarkMode
                                  ? 'bg-slate-600 group-hover:bg-amber-400'
                                  : 'bg-slate-300 group-hover:bg-amber-500'
                                }`}></div>
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block px-5 py-3.5 rounded-2xl text-base font-semibold transition-all duration-200 ${isActivePath(item.href)
                        ? isDarkMode
                          ? 'text-amber-400 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20'
                          : 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50'
                        : isDarkMode
                          ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/60'
                          : 'text-slate-700 hover:text-amber-700 hover:bg-slate-50'
                        }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Auth */}
            <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-800/50' : 'border-slate-200/50'}`}>
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className={`flex-1 text-center px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 shadow-md ${isDarkMode
                    ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-amber-400 hover:shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-amber-700 hover:shadow-lg'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex-1 text-center bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 border border-amber-400/20"
                  onClick={() => setIsOpen(false)}
                >
                  Invest
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;