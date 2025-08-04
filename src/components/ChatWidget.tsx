import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  agentId: string;
}

const ChatWidget = ({ isOpen, onToggle, agentId }: ChatWidgetProps) => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Widget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Chat functionality will be available after Supabase setup.
          </p>
          <p className="text-sm text-muted-foreground">
            Agent ID: {agentId}
          </p>
          <Button onClick={onToggle} variant="outline" className="w-full">
            Close Preview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWidget;