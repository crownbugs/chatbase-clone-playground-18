import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  url: string;
  knowledgeBaseId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, knowledgeBaseId } = await req.json() as ScrapeRequest;

    if (!url || !knowledgeBaseId) {
      throw new Error('URL and knowledge base ID are required');
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    console.log(`Scraping website: ${url}`);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Chatbot-Scraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract text content from HTML (simple approach)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!textContent || textContent.length < 100) {
      throw new Error('Could not extract meaningful content from the webpage');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update knowledge base with scraped content
    const { error: updateError } = await supabaseClient
      .from('knowledge_bases')
      .update({
        content: textContent,
        url: url,
        processed: true,
        metadata: {
          scraped_at: new Date().toISOString(),
          content_length: textContent.length,
          source_url: url,
        }
      })
      .eq('id', knowledgeBaseId);

    if (updateError) {
      throw updateError;
    }

    // Create embeddings for better search (simplified chunking)
    const chunks = chunkText(textContent, 1000);
    const embeddingsData = chunks.map(chunk => ({
      knowledge_base_id: knowledgeBaseId,
      content: chunk,
      metadata: {
        source_url: url,
        chunk_index: chunks.indexOf(chunk),
      }
    }));

    if (embeddingsData.length > 0) {
      await supabaseClient
        .from('embeddings')
        .insert(embeddingsData);
    }

    console.log(`Successfully scraped ${url}, created ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Website scraped successfully',
        contentLength: textContent.length,
        chunksCreated: chunks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Website scraping error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }
    currentChunk += sentence + '. ';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}