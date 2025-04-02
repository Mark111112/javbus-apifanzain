import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as htmlParse } from 'node-html-parser';
import client from './client.js';

// Config file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '../config/config.json');

interface FanzaMappings {
  [prefix: string]: string;
}

interface FanzaSuffixes {
  [prefix: string]: string;
}

interface Config {
  fanza_mappings?: FanzaMappings;
  fanza_suffixes?: FanzaSuffixes;
}

export class FanzaScraper {
  private prefixMappings: FanzaMappings = {};
  private suffixMappings: FanzaSuffixes = {};
  private urlTemplates: string[] = [
    'https://www.dmm.co.jp/mono/dvd/-/detail/=/cid={0}/',
    'https://www.dmm.co.jp/digital/videoa/-/detail/=/cid={0}/',
    'https://www.dmm.co.jp/digital/videoc/-/detail/=/cid={0}/',
    'https://www.dmm.co.jp/digital/anime/-/detail/=/cid={0}/',
    'https://www.dmm.co.jp/mono/anime/-/detail/=/cid={0}/',
    'https://www.dmm.co.jp/digital/nikkatsu/-/detail/=/cid={0}/',
  ];
  private headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  };
  private cookies = { age_check_done: '1' };

  // Add a simple in-memory cache for summaries
  private summaryCache: {
    [movieId: string]: {
      summary: string | null;
      url?: string;
      timestamp: number;
    };
  } = {};

  // Cache expiration time in milliseconds (24 hours)
  private cacheExpirationMs = 24 * 60 * 60 * 1000;

  constructor() {
    this.loadMappingsFromFile();
  }

  private loadMappingsFromFile(): void {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
        if (fileContent.trim()) {
          const config: Config = JSON.parse(fileContent);
          this.prefixMappings = config.fanza_mappings || {};
          this.suffixMappings = config.fanza_suffixes || {};
          console.log(
            `Loaded ${Object.keys(this.prefixMappings).length} prefix mappings and ${Object.keys(this.suffixMappings).length} suffix mappings`,
          );
        }
      } else {
        console.warn('Config file not found, using empty mappings');
        // Ensure directory exists before trying to create the file
        const configDir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }
        this.setMappings({});
        this.setSuffixes({});
      }
    } catch (error) {
      console.error(
        `Failed to load mappings: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.prefixMappings = {};
      this.suffixMappings = {};
    }
  }

  public setMappings(mappings: FanzaMappings): boolean {
    this.prefixMappings = mappings;
    return this.saveConfig();
  }

  public setSuffixes(suffixes: FanzaSuffixes): boolean {
    this.suffixMappings = suffixes;
    return this.saveConfig();
  }

  private saveConfig(): boolean {
    try {
      let config: Config = {};

      if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
        if (fileContent.trim()) {
          config = JSON.parse(fileContent);
        }
      }

      // Sort mappings alphabetically
      const sortedPrefixMappings: FanzaMappings = {};
      Object.keys(this.prefixMappings)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          const value = this.prefixMappings[key];
          if (value !== undefined) {
            sortedPrefixMappings[key] = value;
          }
        });

      const sortedSuffixMappings: FanzaSuffixes = {};
      Object.keys(this.suffixMappings)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .forEach((key) => {
          const value = this.suffixMappings[key];
          if (value !== undefined) {
            sortedSuffixMappings[key] = value;
          }
        });

      config.fanza_mappings = sortedPrefixMappings;
      config.fanza_suffixes = sortedSuffixMappings;

      // Ensure directory exists
      const configDir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(
        `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  public normalizeMovieId(movieId: string): string {
    // 1. Convert to lowercase
    const idLower = movieId.toLowerCase();

    // Clean non-alphanumeric characters
    const cleanedId = idLower.replace(/[^a-z0-9]/g, '');

    // First check if it's a known prefix in the mapping table
    for (const prefix in this.prefixMappings) {
      if (cleanedId.startsWith(prefix)) {
        // Extract the number part
        const prefixRemoved = cleanedId.substring(prefix.length);
        // Find the numeric part
        const numMatch = /^(\d+)/.exec(prefixRemoved);
        if (numMatch && numMatch[1]) {
          const num = numMatch[1].padStart(3, '0'); // Pad to at least 3 digits
          console.log(`Detected known prefix ${prefix}, mapping to ${this.prefixMappings[prefix]}`);

          // Check if there's a specific suffix mapping
          let suffix = '';
          if (prefix in this.suffixMappings && this.suffixMappings[prefix] !== undefined) {
            suffix = this.suffixMappings[prefix];
            console.log(`Adding suffix mapping ${suffix}`);
          }

          // Important: Use the mapped prefix directly (including underscores)
          const result = `${this.prefixMappings[prefix]}${num}${suffix}`;
          console.log(`Special handling mapping, final ID: ${result}`);
          return result;
        }
      }
    }

    // Extract prefix and number part from the ID (standard format)
    const match = /^([a-z]+)(\d+)$/.exec(cleanedId);
    if (match && match[1] && match[2]) {
      const prefix = match[1];
      const number = match[2];

      // 2. Check if there's a mapping
      if (prefix in this.prefixMappings) {
        // Use the mapped prefix - preserve all characters in the prefix (including underscores)
        const mappedPrefix = this.prefixMappings[prefix];
        console.log(`Mapping prefix ${prefix} to ${mappedPrefix}`);

        // Ensure the number part is at least 3 digits
        const formattedNumber = number.padStart(3, '0');

        // Check if this prefix has a specific suffix mapping
        if (prefix in this.suffixMappings && this.suffixMappings[prefix] !== undefined) {
          const suffix = this.suffixMappings[prefix];
          const result = `${mappedPrefix}${formattedNumber}${suffix}`;
          console.log(`Adding suffix mapping ${suffix}, final ID: ${result}`);
          return result;
        } else {
          const result = `${mappedPrefix}${formattedNumber}`;
          console.log(`Final ID: ${result}`);
          return result;
        }
      }

      // 3. No mapping, add '00' between prefix and number
      const formattedNumber = number.padStart(3, '0');

      // Check if this prefix has a specific suffix mapping
      if (prefix in this.suffixMappings && this.suffixMappings[prefix] !== undefined) {
        const suffix = this.suffixMappings[prefix];
        const result = `${prefix}00${formattedNumber}${suffix}`;
        console.log(`No prefix mapping but adding suffix ${suffix}, final ID: ${result}`);
        return result;
      } else {
        const result = `${prefix}00${formattedNumber}`;
        console.log(`No mapping, using default format, final ID: ${result}`);
        return result;
      }
    }

    // If it doesn't match the standard letter+number format, return the original cleaned ID
    console.log(`Cannot match standard format, using original ID: ${cleanedId}`);
    return cleanedId;
  }

  public getUrlsById(movieId: string): string[] {
    // If the ID already contains an underscore, use it directly
    if (movieId.includes('_')) {
      console.log(`Using ID with underscore: ${movieId}`);
      return this.urlTemplates.map((template) => template.replace('{0}', movieId));
    }

    // First check all special prefixes in the mappings
    const movieIdLower = movieId.toLowerCase();
    const cleanedId = movieIdLower.replace(/[^a-z0-9]/g, '');

    for (const prefix in this.prefixMappings) {
      if (cleanedId.startsWith(prefix)) {
        // Remove the prefix part, keep only the number
        const prefixRemoved = cleanedId.substring(prefix.length);
        // Find the numeric part
        const numMatch = /^(\d+)/.exec(prefixRemoved);
        if (numMatch && numMatch[1]) {
          const num = numMatch[1].padStart(3, '0'); // Pad to at least 3 digits

          // Check if there's a suffix
          let suffix = '';
          if (prefix in this.suffixMappings && this.suffixMappings[prefix] !== undefined) {
            suffix = this.suffixMappings[prefix];
          }

          // Preserve all original characters in the mapped prefix (including underscores)
          const mappedId = `${this.prefixMappings[prefix]}${num}${suffix}`;
          console.log(`URL mapping: ${movieId} -> ${mappedId}`);

          return this.urlTemplates.map((template) => template.replace('{0}', mappedId));
        }
      }
    }

    // Check if the movie ID needs to be normalized
    let normalizedId: string;
    if (/^[a-z]+\d{3,}[a-z]?$/i.test(movieId.toLowerCase())) {
      // Already in standard format, use directly
      normalizedId = movieId.toLowerCase();
      console.log(`ID already in standard format: ${normalizedId}`);
    } else {
      // Needs normalization
      normalizedId = this.normalizeMovieId(movieId);
      console.log(`Normalized ID: ${movieId} -> ${normalizedId}`);
    }

    const urls = this.urlTemplates.map((template) => template.replace('{0}', normalizedId));

    // If the ID matches a specific pattern, prioritize digital videoa URL
    if (/[a-z]+00\d{3,}/i.test(normalizedId) && urls.length >= 2) {
      // Make sure we're working with valid strings
      if (typeof urls[0] === 'string' && typeof urls[1] === 'string') {
        const temp = urls[0];
        urls[0] = urls[1];
        urls[1] = temp;
        console.log(`Swapped URL priority, preferred: ${urls[0]}`);
      }
    }

    // Log all URLs for debugging
    urls.forEach((url) => console.log(`URL: ${url}`));

    return urls;
  }

  private getSummaryFromJsonLd(html: string): string | null {
    const doc = htmlParse(html);
    const scriptTag = doc.querySelector('script[type="application/ld+json"]');

    if (!scriptTag) {
      return null;
    }

    try {
      const data = JSON.parse(scriptTag.text);
      if (data.description) {
        return data.description;
      }
    } catch (error) {
      console.warn(
        `Failed to parse JSON-LD: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return null;
  }

  private getSummaryFromHtml(html: string): string | null {
    const doc = htmlParse(html);

    // Try to extract from div.mg-b20.lh4
    const summaryDiv = doc.querySelector('div.mg-b20.lh4');
    if (summaryDiv) {
      // First try p.mg-b20
      const pTag = summaryDiv.querySelector('p.mg-b20');
      if (pTag && pTag.text.trim()) {
        return pTag.text.trim();
      }

      // Then try any p tag
      const anyP = summaryDiv.querySelector('p');
      if (anyP && anyP.text.trim()) {
        return anyP.text.trim();
      }

      // Finally get the entire div text
      if (summaryDiv.text.trim()) {
        return summaryDiv.text.trim();
      }
    }

    // Try to extract from .txt.introduction p
    const introP = doc.querySelector('.txt.introduction p');
    if (introP && introP.text.trim()) {
      console.log('Getting summary from .txt.introduction p');
      return introP.text.trim();
    }

    // Try to extract from .nw-video-description
    const descDiv = doc.querySelector('.nw-video-description');
    if (descDiv && descDiv.text.trim()) {
      console.log('Getting summary from .nw-video-description');
      return descDiv.text.trim();
    }

    return null;
  }

  private getSummaryFromMeta(html: string): string | null {
    const doc = htmlParse(html);

    // Try to extract from meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute('content')) {
      const content = metaDesc.getAttribute('content');
      if (content) {
        return content.trim();
      }
    }

    // Try to extract from open graph description
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    if (ogDesc && ogDesc.getAttribute('content')) {
      const content = ogDesc.getAttribute('content');
      if (content) {
        return content.trim();
      }
    }

    return null;
  }

  public async getMovieSummary(movieId: string): Promise<{ summary: string | null; url?: string }> {
    // Try to get from cache first
    const now = Date.now();
    const cacheItem = this.summaryCache[movieId];
    if (cacheItem && now - cacheItem.timestamp < this.cacheExpirationMs) {
      console.log(`Returning cached summary for ${movieId}`);
      return { summary: cacheItem.summary, url: cacheItem.url };
    }

    // Normalize the movie ID
    const normalizedId = this.normalizeMovieId(movieId);
    console.log(`Movie ID ${movieId} has been normalized to ${normalizedId}`);

    // Get URLs with the normalized ID
    const urls = this.getUrlsById(normalizedId);

    // Try to search using the normalized ID
    for (const url of urls) {
      console.log(`Trying URL: ${url}`);
      try {
        // Make the request with cookies for age verification
        const response = await client(url, {
          headers: {
            ...this.headers,
            Cookie: 'age_check_done=1',
          },
        }).text();

        // Check if region restricted
        if (response.includes('not-available-in-your-region')) {
          console.warn('Region not available');
          continue;
        }

        // Try different summary extraction methods in order of priority
        let summary = this.getSummaryFromJsonLd(response);
        if (summary) {
          console.log('Got summary from JSON-LD');
          // Cache the result
          this.summaryCache[movieId] = { summary, url, timestamp: now };
          return { summary, url };
        }

        summary = this.getSummaryFromHtml(response);
        if (summary) {
          console.log('Got summary from HTML content');
          // Cache the result
          this.summaryCache[movieId] = { summary, url, timestamp: now };
          return { summary, url };
        }

        summary = this.getSummaryFromMeta(response);
        if (summary) {
          console.log('Got summary from Meta tags');
          // Cache the result
          this.summaryCache[movieId] = { summary, url, timestamp: now };
          return { summary, url };
        }

        console.warn('Could not find summary information in the page');
      } catch (error) {
        console.error(
          `Failed to get summary for movie ${movieId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
    }

    // If normalized ID search fails, try using the original ID format (without hyphens)
    const originalId = movieId.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (originalId !== normalizedId) {
      console.log(`Normalized ID search failed, trying original ID format: ${originalId}`);
      // Only try the DVD version URL
      const url = `https://www.dmm.co.jp/mono/dvd/-/detail/=/cid=${originalId}/`;
      console.log(`Trying original ID URL: ${url}`);

      try {
        const response = await client(url, {
          headers: {
            ...this.headers,
            Cookie: 'age_check_done=1',
          },
        }).text();

        // Check if region restricted
        if (response.includes('not-available-in-your-region')) {
          console.warn('Region not available');
        } else {
          // Try different summary extraction methods in order of priority
          let summary = this.getSummaryFromJsonLd(response);
          if (summary) {
            console.log('Got summary from JSON-LD with original ID');
            // Cache the result
            this.summaryCache[movieId] = { summary, url, timestamp: now };
            return { summary, url };
          }

          summary = this.getSummaryFromHtml(response);
          if (summary) {
            console.log('Got summary from HTML content with original ID');
            // Cache the result
            this.summaryCache[movieId] = { summary, url, timestamp: now };
            return { summary, url };
          }

          summary = this.getSummaryFromMeta(response);
          if (summary) {
            console.log('Got summary from Meta tags with original ID');
            // Cache the result
            this.summaryCache[movieId] = { summary, url, timestamp: now };
            return { summary, url };
          }

          console.warn('Could not find summary information in the page with original ID');
        }
      } catch (error) {
        console.error(
          `Failed to get summary with original ID for movie ${movieId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.warn(`Failed to get summary for movie ${movieId}`);
    // Cache the negative result too
    this.summaryCache[movieId] = { summary: null, timestamp: now };
    return { summary: null };
  }
}

// Create a singleton instance
const fanzaScraperInstance = new FanzaScraper();

// Export both the class and a default instance
export default fanzaScraperInstance;
