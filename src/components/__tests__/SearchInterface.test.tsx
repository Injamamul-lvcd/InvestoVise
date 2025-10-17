import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SearchInterface from '../SearchInterface';
import { SearchSuggestion } from '@/types/components';

const mockSuggestions: SearchSuggestion[] = [
  { text: 'SIP investment', type: 'term', count: 25 },
  { text: 'Mutual Funds', type: 'category', count: 38 },
  { text: 'tax planning', type: 'tag', count: 15 },
  { text: 'Understanding SIP Investments', type: 'article', count: 1 },
  { text: 'ELSS funds', type: 'term', count: 12 }
];

describe('SearchInterface', () => {
  const mockOnSearch = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    expect(screen.getByPlaceholderText(/Search financial articles/)).toBeInTheDocument();
  });

  it('renders custom placeholder when provided', () => {
    const customPlaceholder = 'Search for investment guides...';
    render(<SearchInterface onSearch={mockOnSearch} placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked', async () => {
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    const searchButton = screen.getByText('Search');
    
    await user.type(searchInput, 'SIP investment');
    await user.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('SIP investment', {});
  });

  it('calls onSearch when Enter key is pressed', async () => {
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    
    await user.type(searchInput, 'mutual funds');
    await user.keyboard('{Enter}');
    
    expect(mockOnSearch).toHaveBeenCalledWith('mutual funds', {});
  });

  it('does not call onSearch with empty query', async () => {
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const searchButton = screen.getByText('Search');
    await user.click(searchButton);
    
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('trims whitespace from search query', async () => {
    render(<SearchInterface onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    const searchButton = screen.getByText('Search');
    
    await user.type(searchInput, '  SIP investment  ');
    await user.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('SIP investment', {});
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<SearchInterface onSearch={mockOnSearch} isLoading={true} />);
    
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
  });

  it('displays suggestions when typing', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'SIP');
    
    expect(screen.getByText('SIP investment')).toBeInTheDocument();
  });

  it('filters suggestions based on query', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'mutual');
    
    expect(screen.getByText('Mutual Funds')).toBeInTheDocument();
    expect(screen.queryByText('SIP investment')).not.toBeInTheDocument();
  });

  it('handles suggestion click', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'SIP');
    
    const suggestion = screen.getByText('SIP investment');
    await user.click(suggestion);
    
    expect(mockOnSearch).toHaveBeenCalledWith('SIP investment', {});
  });

  it('navigates suggestions with arrow keys', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'S');
    
    // Arrow down should highlight first suggestion
    await user.keyboard('{ArrowDown}');
    
    // Enter should select highlighted suggestion
    await user.keyboard('{Enter}');
    
    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('closes suggestions with Escape key', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'SIP');
    
    expect(screen.getByText('SIP investment')).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('SIP investment')).not.toBeInTheDocument();
    });
  });

  it('shows advanced filters when showFilters is true', () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={true} />);
    
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });

  it('hides advanced filters when showFilters is false', () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={false} />);
    
    expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();
  });

  it('toggles advanced filters visibility', async () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={true} />);
    
    const toggleButton = screen.getByText('Advanced Filters');
    
    // Initially filters should be hidden
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    
    await user.click(toggleButton);
    
    // Now filters should be visible
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('applies category filter', async () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={true} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'investment');
    
    // Open advanced filters
    await user.click(screen.getByText('Advanced Filters'));
    
    // Select category
    const categorySelect = screen.getByDisplayValue('All Categories');
    await user.selectOptions(categorySelect, 'stocks');
    
    expect(mockOnSearch).toHaveBeenCalledWith('investment', { category: 'stocks' });
  });

  it('applies sort filter', async () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={true} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'investment');
    
    // Open advanced filters
    await user.click(screen.getByText('Advanced Filters'));
    
    // Change sort order
    const sortSelect = screen.getByDisplayValue('Relevance');
    await user.selectOptions(sortSelect, 'date');
    
    expect(mockOnSearch).toHaveBeenCalledWith('investment', { sortBy: 'date' });
  });

  it('applies tags filter', async () => {
    render(<SearchInterface onSearch={mockOnSearch} showFilters={true} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'investment');
    
    // Open advanced filters
    await user.click(screen.getByText('Advanced Filters'));
    
    // Add tags
    const tagsInput = screen.getByPlaceholderText(/e.g., investment, sip, tax-saving/);
    await user.type(tagsInput, 'sip, mutual-funds');
    
    expect(mockOnSearch).toHaveBeenCalledWith('investment', { tags: ['sip', 'mutual-funds'] });
  });

  it('clears all filters', async () => {
    const initialFilters = { category: 'stocks', sortBy: 'date' as const };
    render(
      <SearchInterface 
        onSearch={mockOnSearch} 
        showFilters={true} 
        initialFilters={initialFilters}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'investment');
    
    // Open advanced filters
    await user.click(screen.getByText('Advanced Filters'));
    
    // Clear all filters
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('investment', {});
  });

  it('displays suggestion icons correctly', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'S');
    
    // Should show different icons for different suggestion types
    expect(document.querySelectorAll('svg')).toHaveLength(6); // Search icon + 5 suggestion icons
  });

  it('shows suggestion counts when available', async () => {
    render(<SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'SIP');
    
    expect(screen.getByText('(25)')).toBeInTheDocument();
  });

  it('limits suggestions to 8 items', async () => {
    const manySuggestions = Array.from({ length: 15 }, (_, i) => ({
      text: `Suggestion ${i}`,
      type: 'term' as const,
      count: i
    }));
    
    render(<SearchInterface onSearch={mockOnSearch} suggestions={manySuggestions} />);
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'S');
    
    // Should only show 8 suggestions
    const suggestionElements = screen.getAllByText(/Suggestion/);
    expect(suggestionElements).toHaveLength(8);
  });

  it('closes suggestions when clicking outside', async () => {
    render(
      <div>
        <SearchInterface onSearch={mockOnSearch} suggestions={mockSuggestions} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const searchInput = screen.getByPlaceholderText(/Search financial articles/);
    await user.type(searchInput, 'SIP');
    
    expect(screen.getByText('SIP investment')).toBeInTheDocument();
    
    // Click outside
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('SIP investment')).not.toBeInTheDocument();
    });
  });
});