import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryBrowser from '../CategoryBrowser';
import { CategoryHierarchy } from '@/types/components';

const mockCategories: CategoryHierarchy = {
  'stocks': {
    id: 'stocks',
    name: 'Stocks',
    slug: 'stocks',
    description: 'Learn about stock market investing',
    articleCount: 45,
    children: [
      {
        id: 'stocks-basics',
        name: 'Stock Basics',
        slug: 'stocks-basics',
        description: 'Fundamental concepts of stock investing',
        articleCount: 15,
        parent: 'stocks'
      },
      {
        id: 'stocks-analysis',
        name: 'Stock Analysis',
        slug: 'stocks-analysis',
        description: 'Technical and fundamental analysis',
        articleCount: 20,
        parent: 'stocks'
      }
    ]
  },
  'mutual-funds': {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    slug: 'mutual-funds',
    description: 'Comprehensive guide to mutual fund investing',
    articleCount: 38,
    children: [
      {
        id: 'sip',
        name: 'SIP',
        slug: 'sip',
        description: 'Systematic Investment Plans',
        articleCount: 18,
        parent: 'mutual-funds'
      }
    ]
  },
  'loans': {
    id: 'loans',
    name: 'Loans',
    slug: 'loans',
    description: 'Everything about loans in India',
    articleCount: 25
  }
};

describe('CategoryBrowser', () => {
  const mockOnCategorySelect = jest.fn();
  const mockOnToggleExpand = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category browser with title and description', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    expect(screen.getByText(/Explore .* articles across all categories/)).toBeInTheDocument();
  });

  it('displays all root categories', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    expect(screen.getByText('Stocks')).toBeInTheDocument();
    expect(screen.getByText('Mutual Funds')).toBeInTheDocument();
    expect(screen.getByText('Loans')).toBeInTheDocument();
  });

  it('shows article counts when showArticleCount is true', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        showArticleCount={true}
      />
    );
    
    expect(screen.getByText('45')).toBeInTheDocument(); // Stocks
    expect(screen.getByText('38')).toBeInTheDocument(); // Mutual Funds
    expect(screen.getByText('25')).toBeInTheDocument(); // Loans
  });

  it('hides article counts when showArticleCount is false', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        showArticleCount={false}
      />
    );
    
    // Article count badges should not be visible
    expect(screen.queryByText('45')).not.toBeInTheDocument();
    expect(screen.queryByText('38')).not.toBeInTheDocument();
    expect(screen.queryByText('25')).not.toBeInTheDocument();
  });

  it('calls onCategorySelect when category is clicked', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    fireEvent.click(screen.getByText('Stocks'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith('stocks');
    
    fireEvent.click(screen.getByText('Mutual Funds'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith('mutual-funds');
  });

  it('highlights selected category', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        selectedCategory="stocks"
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    const stocksCategory = screen.getByText('Stocks').closest('div');
    expect(stocksCategory).toHaveClass('bg-primary-100');
  });

  it('shows expand/collapse button for categories with children', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    // Stocks and Mutual Funds have children, Loans doesn't
    const expandButtons = screen.getAllByRole('button');
    expect(expandButtons).toHaveLength(2); // One for stocks, one for mutual-funds
  });

  it('expands category when expand button is clicked', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        onToggleExpand={mockOnToggleExpand}
        expandedCategories={[]}
      />
    );
    
    const expandButtons = screen.getAllByRole('button');
    fireEvent.click(expandButtons[0]); // Click first expand button
    
    expect(mockOnToggleExpand).toHaveBeenCalled();
  });

  it('shows child categories when parent is expanded', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        expandedCategories={['stocks']}
      />
    );
    
    expect(screen.getByText('Stock Basics')).toBeInTheDocument();
    expect(screen.getByText('Stock Analysis')).toBeInTheDocument();
  });

  it('hides child categories when parent is collapsed', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        expandedCategories={[]}
      />
    );
    
    expect(screen.queryByText('Stock Basics')).not.toBeInTheDocument();
    expect(screen.queryByText('Stock Analysis')).not.toBeInTheDocument();
  });

  it('manages internal expanded state when onToggleExpand is not provided', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    // Initially, children should not be visible
    expect(screen.queryByText('Stock Basics')).not.toBeInTheDocument();
    
    // Click expand button
    const expandButtons = screen.getAllByRole('button');
    fireEvent.click(expandButtons[0]);
    
    // Now children should be visible
    expect(screen.getByText('Stock Basics')).toBeInTheDocument();
    expect(screen.getByText('Stock Analysis')).toBeInTheDocument();
  });

  it('displays category descriptions', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    expect(screen.getByText('Learn about stock market investing')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive guide to mutual fund investing')).toBeInTheDocument();
    expect(screen.getByText('Everything about loans in India')).toBeInTheDocument();
  });

  it('calculates and displays total statistics', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    // Total categories: 3 root categories
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Total articles: 45 + 38 + 25 = 108
    expect(screen.getByText('108')).toBeInTheDocument();
  });

  it('handles empty categories gracefully', () => {
    render(
      <CategoryBrowser
        categories={{}}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    expect(screen.getByText('No categories available')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Total categories
  });

  it('applies correct indentation for nested categories', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        expandedCategories={['stocks']}
      />
    );
    
    const stockBasics = screen.getByText('Stock Basics').closest('div');
    expect(stockBasics).toHaveStyle('padding-left: 28px'); // 12 + 1 * 16
  });

  it('prevents event propagation when expand button is clicked', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    const expandButtons = screen.getAllByRole('button');
    fireEvent.click(expandButtons[0]);
    
    // onCategorySelect should not be called when expand button is clicked
    expect(mockOnCategorySelect).not.toHaveBeenCalled();
  });

  it('handles categories without descriptions', () => {
    const categoriesWithoutDesc = {
      'test': {
        id: 'test',
        name: 'Test Category',
        slug: 'test',
        articleCount: 10
      }
    };
    
    render(
      <CategoryBrowser
        categories={categoriesWithoutDesc}
        onCategorySelect={mockOnCategorySelect}
      />
    );
    
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('rotates expand icon when category is expanded', () => {
    render(
      <CategoryBrowser
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        expandedCategories={['stocks']}
      />
    );
    
    const expandButton = screen.getAllByRole('button')[0];
    const icon = expandButton.querySelector('svg');
    expect(icon).toHaveClass('rotate-90');
  });
});