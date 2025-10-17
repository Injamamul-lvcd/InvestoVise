'use client';

import React, { useState, useMemo } from 'react';
import { CategoryBrowserProps, CategoryNode } from '@/types/components';

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  showArticleCount = true,
  expandedCategories = [],
  onToggleExpand
}) => {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(expandedCategories);

  // Use internal state if onToggleExpand is not provided
  const isExpanded = (categoryId: string) => {
    return onToggleExpand ? expandedCategories.includes(categoryId) : internalExpanded.includes(categoryId);
  };

  const toggleExpanded = (categoryId: string) => {
    if (onToggleExpand) {
      onToggleExpand(categoryId);
    } else {
      setInternalExpanded(prev => 
        prev.includes(categoryId) 
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    }
  };

  // Organize categories into a hierarchical structure
  const organizedCategories = useMemo(() => {
    const rootCategories: CategoryNode[] = [];
    const categoryMap = new Map<string, CategoryNode>();

    // First pass: create map of all categories
    Object.values(categories).forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: organize hierarchy
    categoryMap.forEach(category => {
      if (category.parent) {
        const parent = categoryMap.get(category.parent);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }, [categories]);

  const CategoryItem: React.FC<{ 
    category: CategoryNode; 
    level: number; 
  }> = ({ category, level }) => {
    const hasChildren = category.children && category.children.length > 0;
    const expanded = isExpanded(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div className="category-item">
        <div
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-primary-100 text-primary-800 border border-primary-200' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onCategorySelect(category.id)}
        >
          <div className="flex items-center space-x-3 flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
            
            <div className="flex-1">
              <h3 className={`font-medium ${isSelected ? 'text-primary-800' : 'text-gray-900'}`}>
                {category.name}
              </h3>
              {category.description && (
                <p className={`text-sm mt-1 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {showArticleCount && (
            <span className={`text-sm px-2 py-1 rounded-full ${
              isSelected 
                ? 'bg-primary-200 text-primary-800' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {category.articleCount}
            </span>
          )}
        </div>

        {hasChildren && expanded && (
          <div className="mt-2 space-y-1">
            {category.children!.map(child => (
              <CategoryItem
                key={child.id}
                category={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const totalArticles = useMemo(() => {
    return Object.values(categories).reduce((sum, category) => sum + category.articleCount, 0);
  }, [categories]);

  return (
    <div className="category-browser bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors duration-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">Browse Categories</h2>
        <p className="text-sm text-gray-600">
          Explore {totalArticles.toLocaleString()} articles across all categories
        </p>
      </div>

      <div className="p-4">
        {organizedCategories.length > 0 ? (
          <div className="space-y-2">
            {organizedCategories.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500">No categories available</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{Object.keys(categories).length}</p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary-600">{totalArticles.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Articles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryBrowser;