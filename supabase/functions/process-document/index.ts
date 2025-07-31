import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  fileName: string;
  knowledgeBaseId: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, knowledgeBaseId, userId } = await req.json() as ProcessDocumentRequest;

    if (!fileName || !knowledgeBaseId || !userId) {
      throw new Error('File name, knowledge base ID, and user ID are required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('documents')
      .download(`${userId}/${fileName}`);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'File not found'}`);
    }

    // Convert file to text
    let textContent = '';
    const fileType = fileName.split('.').pop()?.toLowerCase();

    try {
      if (fileType === 'txt') {
        textContent = await fileData.text();
      } else if (fileType === 'json') {
        const jsonData = await fileData.text();
        textContent = JSON.stringify(JSON.parse(jsonData), null, 2);
      } else {
        // For other file types, try to extract text
        textContent = await fileData.text();
        
        // Basic cleanup for common file formats
        if (fileType === 'html' || fileType === 'htm') {
          textContent = textContent
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    } catch (error) {
      throw new Error(`Failed to process file content: ${error.message}`);
    }

    if (!textContent || textContent.length < 50) {
      throw new Error('Could not extract meaningful content from the file');
    }

    // Update knowledge base with document content
    const { error: updateError } = await supabaseClient
      .from('knowledge_bases')
      .update({
        content: textContent,
        processed: true,
        metadata: {
          processed_at: new Date().toISOString(),
          content_length: textContent.length,
          file_name: fileName,
          file_type: fileType,
        }
      })
      .eq('id', knowledgeBaseId);

    if (updateError) {
      throw updateError;
    }

    // Create embeddings for better search
    const chunks = chunkText(textContent, 1000);
    const embeddingsData = chunks.map(chunk => ({
      knowledge_base_id: knowledgeBaseId,
      content: chunk,
      metadata: {
        file_name: fileName,
        chunk_index: chunks.indexOf(chunk),
      }
    }));

    if (embeddingsData.length > 0) {
      await supabaseClient
        .from('embeddings')
        .insert(embeddingsData);
    }

    console.log(`Successfully processed document: ${fileName}, created ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        contentLength: textContent.length,
        chunksCreated: chunks.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Document processing error:', error);
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
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single paragraph is too long, split by sentences
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/[.!?]+\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
          }
          currentChunk += sentence + '. ';
        }
      } else {
        currentChunk = paragraph + '\n\n';
      }
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 50);
}