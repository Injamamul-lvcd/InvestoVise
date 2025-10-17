import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/database';
import { Article } from '@/models/Article';
import { generateArticleMetadata, generateArticleStructuredData, generateBreadcrumbStructuredData } from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import { IArticle } from '@/types/database';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    await connectDB();
    const article = await Article.findOne({ slug: params.slug, isPublished: true })
      .populate('author', 'name')
      .lean() as IArticle;

    if (!article) {
      return {
        title: 'Article Not Found | InvestoVise',
        description: 'The requested article could not be found.',
      };
    }

    return generateArticleMetadata(article);
  } catch (error) {
    console.error('Error generating article metadata:', error);
    return {
      title: 'Article | InvestoVise',
      description: 'Financial education article on InvestoVise.',
    };
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  try {
    await connectDB();
    const article = await Article.findOne({ slug: params.slug, isPublished: true })
      .populate('author', 'name email')
      .lean() as IArticle;

    if (!article) {
      notFound();
    }

    // Increment view count (in a real app, you might want to do this client-side or in a separate API call)
    await Article.findByIdAndUpdate(article._id, { $inc: { viewCount: 1 } });

    const articleStructuredData = generateArticleStructuredData(article);
    
    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: 'Home', url: 'https://investovise.com' },
      { name: 'Articles', url: 'https://investovise.com/articles' },
      { name: article.category, url: `https://investovise.com/articles/category/${article.category.toLowerCase()}` },
      { name: article.title, url: `https://investovise.com/articles/${article.slug}` },
    ]);

    return (
      <>
        <StructuredData data={[articleStructuredData, breadcrumbStructuredData]} />
        
        <article className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-gray-600">
              <ol className="flex items-center space-x-2">
                <li><a href="/" className="hover:text-primary-600">Home</a></li>
                <li className="before:content-['/'] before:mx-2">
                  <a href="/articles" className="hover:text-primary-600">Articles</a>
                </li>
                <li className="before:content-['/'] before:mx-2">
                  <a href={`/articles/category/${article.category.toLowerCase()}`} className="hover:text-primary-600">
                    {article.category}
                  </a>
                </li>
                <li className="before:content-['/'] before:mx-2 text-gray-900">
                  {article.title}
                </li>
              </ol>
            </nav>

            {/* Article Header */}
            <header className="mb-8">
              <div className="mb-4">
                <span className="inline-block bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                  {article.category}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {article.title}
              </h1>
              
              {article.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-6">
                <div className="flex items-center space-x-4">
                  {article.author && (
                    <span>By {article.author.name}</span>
                  )}
                  <span>•</span>
                  <time dateTime={article.publishedAt?.toISOString()}>
                    {article.publishedAt?.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span>•</span>
                  <span>{article.viewCount || 0} views</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {article.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="mb-8">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                  loading="eager"
                />
              </div>
            )}

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Article Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Last updated: {article.updatedAt?.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                
                <div className="flex items-center space-x-4">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Share Article
                  </button>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Save for Later
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </article>
      </>
    );
  } catch (error) {
    console.error('Error loading article:', error);
    notFound();
  }
}