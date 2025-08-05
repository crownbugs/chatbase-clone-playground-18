import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Globe, FileText, ExternalLink, Clock } from 'lucide-react';

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  links: string[];
  scrapedAt: string;
}

interface ScrapeResult {
  success: boolean;
  data?: ScrapedPage[];
  totalPages?: number;
  domain?: string;
  error?: string;
}

export const WebScraper = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [sameDomain, setSameDomain] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setScrapeResult(null);
    
    try {
      console.log('Starting scrape for URL:', url);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: {
          url: url,
          sameDomain: sameDomain,
          maxPages: maxPages,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        console.error('Scraping error:', error);
        throw new Error(error.message || 'Failed to scrape website');
      }

      if (data.success) {
        toast({
          title: "Success",
          description: `Successfully scraped ${data.totalPages} pages from ${data.domain}`,
        });
        setScrapeResult(data);
      } else {
        throw new Error(data.error || 'Failed to scrape website');
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scrape website",
        variant: "destructive",
      });
      setScrapeResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Web Scraper</h2>
        <p className="text-muted-foreground">
          Scrape and crawl websites to extract content for your AI chatbots
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Scraper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPages">Max Pages</Label>
                <Input
                  id="maxPages"
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 5)}
                  min="1"
                  max="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameDomain"
                    checked={sameDomain}
                    onChange={(e) => setSameDomain(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="sameDomain" className="text-sm">
                    Only scrape same domain
                  </Label>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <Label>Scraping Progress</Label>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Scraping pages... This may take a few moments.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Scraping..." : "Start Scraping"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {scrapeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Scraping Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scrapeResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {scrapeResult.totalPages} pages scraped
                  </Badge>
                  <Badge variant="outline">
                    Domain: {scrapeResult.domain}
                  </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scrapeResult.data?.map((page, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm truncate flex-1">
                            {page.title || 'Untitled Page'}
                          </h4>
                          <Badge variant="secondary" className="ml-2">
                            {page.wordCount} words
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{page.url}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{new Date(page.scrapedAt).toLocaleTimeString()}</span>
                        </div>

                        <div className="text-sm">
                          <p className="text-muted-foreground line-clamp-3">
                            {page.content.slice(0, 200)}...
                          </p>
                        </div>

                        {page.links.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Links found: </span>
                            <span className="text-muted-foreground">
                              {page.links.length} internal links
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="pt-4">
                  <Textarea
                    value={JSON.stringify(scrapeResult, null, 2)}
                    readOnly
                    rows={8}
                    className="font-mono text-xs"
                    placeholder="Scraped data will appear here..."
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-destructive">
                  Failed to scrape website: {scrapeResult.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};