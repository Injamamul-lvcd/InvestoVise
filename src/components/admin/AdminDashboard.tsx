'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalClicks: number;
  totalRevenue: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    totalClicks: 0,
    totalRevenue: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalUsers: 1247,
          totalArticles: 89,
          totalClicks: 15632,
          totalRevenue: 45230,
          recentActivity: [
            {
              id: '1',
              type: 'user',
              description: 'New user registered: john.doe@example.com',
              timestamp: '2 minutes ago',
            },
            {
              id: '2',
              type: 'article',
              description: 'Article published: "Best SIP Plans for 2024"',
              timestamp: '15 minutes ago',
            },
            {
              id: '3',
              type: 'affiliate',
              description: 'Affiliate conversion: HDFC Credit Card',
              timestamp: '1 hour ago',
            },
            {
              id: '4',
              type: 'user',
              description: 'User completed loan application',
              timestamp: '2 hours ago',
            },
          ],
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2 transition-colors duration-200">Welcome back! Here's what's happening with your platform.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-slate-400">Last updated</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{new Date().toLocaleTimeString()}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-semibold">+12.5%</span>
                <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-all duration-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Articles</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalArticles}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-semibold">+8.2%</span>
                <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 group-hover:shadow-green-500/40 transition-all duration-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Affiliate Clicks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalClicks.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-semibold">+24.1%</span>
                <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/40 transition-all duration-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <span className="text-green-500 text-sm font-semibold">+18.7%</span>
                <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/40 transition-all duration-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500 dark:text-slate-400">Live</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200">
                  <div className={`p-2.5 rounded-xl shadow-lg ${
                    activity.type === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30' :
                    activity.type === 'article' ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30' :
                    'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30'
                  }`}>
                    {activity.type === 'user' && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {activity.type === 'article' && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {activity.type === 'affiliate' && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 text-left border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg hover:border-amber-500/50 transition-all duration-200 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-all duration-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">New Article</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Create content</p>
                  </div>
                </div>
              </button>

              <button className="p-4 text-left border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg hover:border-amber-500/50 transition-all duration-200 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg shadow-green-500/30 group-hover:shadow-green-500/40 transition-all duration-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">Add Partner</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">New affiliate</p>
                  </div>
                </div>
              </button>

              <button className="p-4 text-left border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg hover:border-amber-500/50 transition-all duration-200 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/40 transition-all duration-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">View Analytics</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Performance data</p>
                  </div>
                </div>
              </button>

              <button className="p-4 text-left border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-lg hover:border-amber-500/50 transition-all duration-200 group">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/40 transition-all duration-200">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">Settings</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Configure app</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}