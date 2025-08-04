import { useParams } from "react-router-dom";
import { useState } from "react";
import ChatWidget from "@/components/ChatWidget";

const Chat = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Chat Coming Soon</h1>
        <p className="text-muted-foreground">Chat functionality will be available after Supabase setup.</p>
        <p className="text-sm text-muted-foreground mt-2">Agent ID: {chatbotId}</p>
      </div>
    </div>
  );
};

export default Chat;