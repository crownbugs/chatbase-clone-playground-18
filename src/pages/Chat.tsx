import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "@/components/ChatWidget";

const Chat = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [isOpen, setIsOpen] = useState(true);
  const [agentExists, setAgentExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatbotId) {
      checkAgentExists();
    }
  }, [chatbotId]);

  const checkAgentExists = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, is_active')
        .eq('id', chatbotId)
        .eq('is_active', true)
        .single();

      setAgentExists(!!data);
    } catch (error) {
      console.log('Agent not found or inactive');
      setAgentExists(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading chat...</p>
      </div>
    );
  }

  if (!agentExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Chat Not Available</h1>
          <p className="text-muted-foreground">This chatbot is not available or has been disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatWidget 
        isOpen={isOpen} 
        onToggle={() => setIsOpen(!isOpen)} 
        agentId={chatbotId || 'demo'}
      />
    </div>
  );
};

export default Chat;