import { NextResponse } from 'next/server';
import { WebScraperService } from '@/services/webscraper';
import { ContentAnalyzer } from '@/services/contentAnalyzer';

const scraper = new WebScraperService(10); // Initialize with max pages
const analyzer = new ContentAnalyzer(process.env.OPENAI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`Starting scrape for ${url}`);
    const scrapedData = await scraper.scrapeWebsite(url);
    console.log(`Found ${scrapedData.images.length} images on page ${url}`);
    console.log('Scraping completed.');
    console.log(`Pages found: ${scrapedData.pages.length}`);
    console.log(`Raw images found: ${scrapedData.images.length}`);

    // Extract main content from pages
    const content = scrapedData.pages
      .map(page => `
URL: ${page.url}
Title: ${page.title || 'No title'}
Content:
${page.content}
      `)
      .join('\n\n');

    console.log('Starting content analysis...');
    
    // Analyze content with GPT-4
    const analysis = await analyzer.analyzeWithGPT4(content);
    
    // Even if analysis fails or is incomplete, we can still return what we have
    return NextResponse.json({
      content,
      analysis: analysis || {},
      images: scrapedData.images,
    });

  } catch (error) {
    console.error('Scraping error:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to process website',
        details: error instanceof Error ? error.message : 'Unknown error',
        partial: false
      },
      { status: 500 }
    );
  }
}
