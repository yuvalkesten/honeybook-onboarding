import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export interface ImageInfo {
  url: string;
  alt: string;
  context: string; // Surrounding text or caption
  isLogo?: boolean;
}

export interface PageSection {
  type: 'services' | 'portfolio' | 'testimonials' | 'about' | 'contact' | 'other';
  title: string;
  content: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  content: string;
  images: ImageInfo[];
  sections: PageSection[];
}

export interface ScrapedWebsite {
  pages: ScrapedPage[];
  images: ImageInfo[];
}

export class WebScraperService {
  private maxPages: number;

  constructor(maxPages: number = 10) {
    this.maxPages = maxPages;
  }

  public async scrapeWebsite(url: string): Promise<ScrapedWebsite> {
    const visited = new Set<string>();
    const pages: ScrapedPage[] = [];
    const images: ImageInfo[] = [];
    const queue: string[] = [url];
    const baseUrl = new URL(url).origin;

    while (queue.length > 0 && pages.length < this.maxPages) {
      const currentUrl = queue.shift();
      if (!currentUrl || visited.has(currentUrl)) continue;

      visited.add(currentUrl);
      
      try {
        console.log('Scraping page:', currentUrl);
        const page = await this.scrapePage(currentUrl);
        pages.push(page);
        
        // Add images from this page
        images.push(...page.images);
        
        // Add new URLs to queue
        const newUrls = this.extractUrls(page.content, baseUrl)
          .filter(url => !visited.has(url) && url.startsWith(baseUrl));
        queue.push(...newUrls);
        
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log(`Skipping non-existent page: ${currentUrl}`);
          continue;
        }
        console.error(`Failed to scrape ${currentUrl}:`, error);
        continue;
      }
    }

    return { pages, images };
  }

  private extractUrls(content: string, baseUrl: string): string[] {
    const urlPattern = /href=["'](https?:\/\/[^"']+|\/[^"']+)["']/g;
    const matches = content.matchAll(urlPattern);
    return Array.from(matches)
      .map(match => this.normalizeUrl(match[1], baseUrl))
      .filter(Boolean);
  }

  private extractSections($: cheerio.CheerioAPI): PageSection[] {
    const sections: PageSection[] = [];
    
    // Helper function to determine section type
    const getSectionType = (el: cheerio.Element): PageSection['type'] => {
      const $el = $(el);
      const text = $el.text().toLowerCase();
      const id = $el.attr('id')?.toLowerCase() || '';
      const className = $el.attr('class')?.toLowerCase() || '';
      
      if (text.includes('service') || id.includes('service') || className.includes('service')) {
        return 'services';
      }
      if (text.includes('portfolio') || id.includes('portfolio') || className.includes('portfolio')) {
        return 'portfolio';
      }
      if (text.includes('testimonial') || id.includes('testimonial') || className.includes('testimonial')) {
        return 'testimonials';
      }
      if (text.includes('about') || id.includes('about') || className.includes('about')) {
        return 'about';
      }
      if (text.includes('contact') || id.includes('contact') || className.includes('contact')) {
        return 'contact';
      }
      return 'other';
    };

    // Look for sections in common containers
    $('section, div[class*="section"], div[id*="section"]').each((_, el) => {
      const type = getSectionType(el);
      sections.push({
        type,
        title: $(el).find('h1, h2, h3').first().text().trim() || type,
        content: $(el).text().trim(),
      });
    });

    // If no sections found, create one main section
    if (sections.length === 0) {
      sections.push({
        type: 'other',
        title: 'Main Content',
        content: $('body').text().trim(),
      });
    }

    return sections;
  }

  private async scrapePage(url: string): Promise<ScrapedPage> {
    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      try {
        // Create new page
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to URL
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });

        // Wait for content to load
        await page.waitForSelector('body', { timeout: 5000 });

        // Get page content
        const content = await page.content();
        const $ = cheerio.load(content);

        // Remove script tags and comments to clean the content
        $('script').remove();
        $('style').remove();
        $('iframe').remove();
        $('noscript').remove();
        $('*').contents().each(function() {
          if (this.type === 'comment') {
            $(this).remove();
          }
        });

        // Extract title
        const title = $('title').text().trim() || $('h1').first().text().trim() || '';

        // Extract meta description
        const description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          '';

        // Extract main content
        const mainContent = $('body').text().trim()
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .slice(0, 50000);

        // Extract sections
        const sections = this.extractSections($);

        // Extract images
        const images: ImageInfo[] = [];

        // Find all img tags
        $('img').each((_, el) => {
          const $img = $(el);
          const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
          const srcset = $img.attr('srcset') || $img.attr('data-srcset');
          
          if (src) {
            const imageUrl = this.normalizeUrl(src, url);
            if (imageUrl && !imageUrl.startsWith('data:')) {
              images.push({
                url: imageUrl,
                alt: $img.attr('alt') || '',
                context: $img.parent().text().trim(),
                isLogo: this.isLikelyLogo($img),
              });
            }
          }

          if (srcset) {
            const srcsetUrls = srcset.split(',')
              .map(s => s.trim().split(' ')[0])
              .filter(s => s && !s.startsWith('data:'))
              .map(s => this.normalizeUrl(s, url))
              .filter(Boolean);

            srcsetUrls.forEach(imageUrl => {
              if (imageUrl && !images.some(img => img.url === imageUrl)) {
                images.push({
                  url: imageUrl,
                  alt: $img.attr('alt') || '',
                  context: $img.parent().text().trim(),
                  isLogo: this.isLikelyLogo($img),
                });
              }
            });
          }
        });

        // Find background images
        $('[style*="background"]').each((_, el) => {
          const style = $(el).attr('style') || '';
          const matches = style.match(/url\(['"]?([^'"]+)['"]?\)/g);
          if (matches) {
            matches.forEach(match => {
              const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
              const imageUrl = this.normalizeUrl(url, url);
              if (imageUrl && !imageUrl.startsWith('data:') && !images.some(img => img.url === imageUrl)) {
                images.push({
                  url: imageUrl,
                  alt: '',
                  context: $(el).text().trim(),
                  isLogo: false,
                });
              }
            });
          }
        });

        console.log(`Found ${images.length} images on page ${url}`);

        return {
          url,
          title,
          description,
          content: mainContent,
          images,
          sections,
        };

      } finally {
        await browser.close();
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw error;
        }
        console.error(`Failed to fetch ${url}:`, error.message);
      } else {
        console.error(`Error scraping ${url}:`, error);
      }
      throw new Error(`Failed to scrape page: ${url}`);
    }
  }

  private isLikelyLogo($img: cheerio.Cheerio): boolean {
    const alt = $img.attr('alt')?.toLowerCase() || '';
    const className = $img.attr('class')?.toLowerCase() || '';
    const src = $img.attr('src')?.toLowerCase() || '';
    
    return alt.includes('logo') || 
           className.includes('logo') || 
           src.includes('logo') ||
           $img.closest('header').length > 0;
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      if (!url || url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
        return '';
      }

      // Handle protocol-relative URLs (starting with //)
      if (url.startsWith('//')) {
        return new URL(`https:${url}`).href;
      }

      const resolvedUrl = new URL(url, baseUrl);
      return resolvedUrl.href;
    } catch (error) {
      console.error(`Failed to normalize URL: ${url}`, error);
      return '';
    }
  }
}
