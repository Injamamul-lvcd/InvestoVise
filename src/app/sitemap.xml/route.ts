import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { Article } from '@/models/Article';
import { generateSitemapUrls, generateArticleSitemapUrls, generateXmlSitemap } from '@/lib/sitemap';

export async function GET() {
  try {
    await connectDB();
    
    // Get static pages
    const staticUrls = generateSitemapUrls();
    
    // Get published articles
    const articles = await Article.find({ isPublished: true })
      .select('slug updatedAt publishedAt')
      .lean();
    
    const articleUrls = generateArticleSitemapUrls(articles);
    
    // Combine all URLs
    const allUrls = [...staticUrls, ...articleUrls];
    
    // Generate XML sitemap
    const xmlSitemap = generateXmlSitemap(allUrls);
    
    return new NextResponse(xmlSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}