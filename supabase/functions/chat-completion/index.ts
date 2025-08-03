import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, message, conversationId, visitorId, visitorName, visitorEmail } = await req.json() as ChatRequest;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get agent configuration
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found or inactive');
    }

    // 🔑 Get the user's OpenAI API key from profiles using agent.user_id
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('openai_api_key')
      .eq('id', agent.user_id)
      .single();

    if (profileError || !userProfile?.openai_api_key) {
      throw new Error('User OpenAI API key not configured');
    }

    const openaiApiKey = userProfile.openai_api_key;

    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          agent_id: agentId,
          visitor_id: visitorId || `visitor_${Date.now()}`,
          visitor_name: visitorName,
          visitor_email: visitorEmail,
        })
        .select()
        .single();

      if (convError) throw convError;
      currentConversationId = newConversation.id;
    }

    // Save user message
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        type: 'user',
        content: message,
      });

    // Get relevant knowledge from RAG using embeddings for better semantic search
    const { data: knowledgeBases } = await supabaseClient
      .from('knowledge_bases')
      .select('*')
      .eq('agent_id', agentId)
      .eq('processed', true);

    let context = '';
    if (knowledgeBases && knowledgeBases.length > 0) {
      // First try to get embeddings for semantic search
      const { data: embeddings } = await supabaseClient
        .from('embeddings')
        .select('content, metadata')
        .in('knowledge_base_id', knowledgeBases.map(kb => kb.id))
        .limit(10);

      let relevantContent = '';
      
      if (embeddings && embeddings.length > 0) {
        // Use embeddings content with better relevance scoring
        const messageWords = message.toLowerCase().split(/\s+/);
        const scoredContent = embeddings
          .map(emb => {
            const contentWords = emb.content.toLowerCase().split(/\s+/);
            const relevanceScore = messageWords.reduce((score, word) => {
              return score + (contentWords.includes(word) ? 1 : 0);
            }, 0);
            return { content: emb.content, score: relevanceScore };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.content)
          .join('\n\n');
        
        relevantContent = scoredContent;
      }
      
      // Fallback to knowledge base content if no embeddings
      if (!relevantContent) {
        relevantContent = knowledgeBases
          .filter(kb => kb.content && kb.content.toLowerCase().includes(message.toLowerCase()))
          .map(kb => kb.content)
          .slice(0, 3)
          .join('\n\n');
      }

      if (relevantContent) {
        context = `\n\nRelevant information from knowledge base:\n${relevantContent}`;
      }
    }

    // Get recent conversation history
    const { data: recentMessages } = await supabaseClient
      .from('messages')
      .select('type, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory: ChatMessage[] = recentMessages
      ? recentMessages.reverse().map(msg => ({
          role: msg.type as 'user' | 'assistant',
          content: msg.content
        }))
      : [];

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `${agent.instructions || 'You are a helpful AI assistant.'}${context}`
      },
      ...conversationHistory.slice(0, -1),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'gpt-4o-mini',
        messages,
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 1000,
      }),
    });

    const openaiData = await response.json();

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${openaiData.error?.message || 'Unknown error'}`);
    }

    const assistantMessage = openaiData.choices[0].message.content;

    // Save assistant message
    await supabaseClient
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        type: 'assistant',
        content: assistantMessage,
      });

    // Track analytics
    await supabaseClient
      .from('analytics')
      .insert({
        agent_id: agentId,
        event_type: 'message_sent',
        event_data: {
          conversation_id: currentConversationId,
          message_length: message.length,
          response_length: assistantMessage.length,
        },
      });

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversationId: currentConversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Chat completion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
