import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string;
  sameDomain?: boolean;
  maxPages?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, sameDomain = true, maxPages = 10 }: ScrapeRequest = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting scrape for URL: ${url}, same domain: ${sameDomain}, max pages: ${maxPages}`);

    // Validate URL
    let baseUrl: URL;
    try {
      baseUrl = new URL(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const scrapedData: any[] = [];
    const urlsToScrape = [url];
    const scrapedUrls = new Set<string>();
    const baseDomain = baseUrl.hostname;

    while (urlsToScrape.length > 0 && scrapedData.length < maxPages) {
      const currentUrl = urlsToScrape.shift();
      if (!currentUrl || scrapedUrls.has(currentUrl)) continue;

      try {
        console.log(`Scraping: ${currentUrl}`);
        scrapedUrls.add(currentUrl);

        // Fetch the page
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ChatbotScraper/1.0)',
          },
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${currentUrl}: ${response.status}`);
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          console.log(`Skipping non-HTML content: ${currentUrl}`);
          continue;
        }

        const html = await response.text();
        
        // Extract text content and metadata
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Remove script and style tags, then extract text
        const cleanHtml = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Extract links if we want to scrape same domain
        const links: string[] = [];
        if (sameDomain && scrapedData.length < maxPages) {
          const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi);
          for (const match of linkMatches) {
            try {
              const linkUrl = new URL(match[1], currentUrl);
              if (linkUrl.hostname === baseDomain && 
                  !scrapedUrls.has(linkUrl.href) && 
                  !urlsToScrape.includes(linkUrl.href)) {
                links.push(linkUrl.href);
                urlsToScrape.push(linkUrl.href);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        }

        scrapedData.push({
          url: currentUrl,
          title,
          content: cleanHtml.slice(0, 8000), // Limit content length
          wordCount: cleanHtml.split(/\s+/).length,
          links: links.slice(0, 10), // Limit links per page
          scrapedAt: new Date().toISOString(),
        });

        console.log(`Successfully scraped: ${currentUrl} (${cleanHtml.length} chars)`);

      } catch (error) {
        console.error(`Error scraping ${currentUrl}:`, error);
        continue;
      }

      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Scraping completed. Total pages: ${scrapedData.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: scrapedData,
        totalPages: scrapedData.length,
        domain: baseDomain,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape website',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});