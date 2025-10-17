import { IArticle } from './database';

// Search and filtering types
export interface SearchFilters {
  category?: string;
  subcategory?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  article: IArticle;
  score: number;
  highlights?: {
    title?: string;
    excerpt?: string;
    content?: string;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'category' | 'tag' | 'article' | 'term';
  count?: number;
}

// Category navigation types
export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
  children?: CategoryNode[];
  parent?: string;
}

export interface CategoryHierarchy {
  [key: string]: CategoryNode;
}

// Component props types
export interface ArticleViewerProps {
  article: IArticle;
  showRelated?: boolean;
  onViewCountUpdate?: (articleId: string) => void;
}

export interface CategoryBrowserProps {
  categories: CategoryHierarchy;
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  showArticleCount?: boolean;
  expandedCategories?: string[];
  onToggleExpand?: (categoryId: string) => void;
}

export interface SearchInterfaceProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  placeholder?: string;
  showFilters?: boolean;
  initialFilters?: SearchFilters;
}

export interface RelatedContentProps {
  currentArticle: IArticle;
  relatedArticles?: IArticle[];
  maxItems?: number;
  onArticleClick?: (article: IArticle) => void;
}

// Utility types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}