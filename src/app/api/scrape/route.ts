import { NextResponse } from 'next/server';
import { WebScraperService } from '@/services/webscraper';
import { BusinessAnalyzer } from '@/services/businessAnalyzer';

const scraper = new WebScraperService(10); // Initialize with max pages
const analyzer = new BusinessAnalyzer(process.env.OPENAI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Scraping website:', url);
    const scrapedData = await scraper.scrapeWebsite(url);
    
    // Combine all page content for analysis
    const websiteContent = scrapedData.pages
      .map(page => `
        Title: ${page.title}
        Description: ${page.description}
        Content: ${page.content}
      `)
      .join('\n\n');

    // Analyze the content
    await analyzer.analyzeWebsiteContent(websiteContent);
    const businessInfo = analyzer.getBusinessInfo();

    return NextResponse.json({
      analysis: businessInfo,
      images: scrapedData.images,
    });
  } catch (error) {
    console.error('Error scraping website:', error);
    return NextResponse.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    );
  }
}
