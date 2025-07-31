import { useParams } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import { useState } from "react";

const Chat = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [isOpen, setIsOpen] = useState(true);

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