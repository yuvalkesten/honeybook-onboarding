import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface DownloadedImage {
  originalUrl: string;
  localPath: string;
  fileName: string;
  mimeType: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export class ImageDownloader {
  private outputDir: string;
  private downloadedImages: Map<string, DownloadedImage>;

  constructor(outputDir: string = 'public/scraped-images') {
    this.outputDir = outputDir;
    this.downloadedImages = new Map();
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private generateFileName(url: string, mimeType: string): string {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const ext = this.getExtensionFromMimeType(mimeType);
    return `${hash}${ext}`;
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const extensions: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return extensions[mimeType] || '.jpg';
  }

  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
    // In a real implementation, we would use a library like 'image-size'
    // For now, we'll return undefined
    return undefined;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.protocol === 'http:' || 
        parsedUrl.protocol === 'https:'
      ) && !url.startsWith('data:');
    } catch {
      return false;
    }
  }

  public async downloadImage(url: string): Promise<DownloadedImage | null> {
    try {
      // Check if we've already downloaded this image
      if (this.downloadedImages.has(url)) {
        return this.downloadedImages.get(url)!;
      }

      // Validate URL
      if (!this.isValidImageUrl(url)) {
        console.warn(`Invalid image URL: ${url}`);
        return null;
      }

      // Download image
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000, // 5 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Get mime type and validate it's an image
      const mimeType = response.headers['content-type'];
      if (!mimeType || !mimeType.startsWith('image/')) {
        console.warn(`Invalid mime type for URL ${url}: ${mimeType}`);
        return null;
      }

      // Generate filename and save path
      const fileName = this.generateFileName(url, mimeType);
      const localPath = path.join(this.outputDir, fileName);

      // Save the file
      fs.writeFileSync(localPath, response.data);

      // Get file size
      const stats = fs.statSync(localPath);

      // Create download record
      const downloadedImage: DownloadedImage = {
        originalUrl: url,
        localPath,
        fileName,
        mimeType,
        size: stats.size,
        dimensions: await this.getImageDimensions(localPath),
      };

      // Store in cache
      this.downloadedImages.set(url, downloadedImage);

      return downloadedImage;
    } catch (error) {
      console.error(`Failed to download image from ${url}:`, error);
      return null;
    }
  }

  public async downloadImages(urls: string[]): Promise<DownloadedImage[]> {
    const downloads = await Promise.all(
      urls.map(url => this.downloadImage(url))
    );

    return downloads.filter((img): img is DownloadedImage => img !== null);
  }

  public getDownloadedImages(): DownloadedImage[] {
    return Array.from(this.downloadedImages.values());
  }

  public clearDownloadedImages(): void {
    this.downloadedImages.clear();
  }
}
