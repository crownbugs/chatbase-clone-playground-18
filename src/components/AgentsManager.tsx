import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

const AgentsManager = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Agents</h2>
          <p className="text-muted-foreground">
            Create and manage your AI chatbots
          </p>
        </div>
        <Button 
          onClick={() => {
            toast({
              title: "Coming Soon",
              description: "Agent creation will be available after Supabase setup",
            });
          }}
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No Agents Yet</CardTitle>
          <CardDescription>
            You haven't created any AI agents yet. Once Supabase is set up, you'll be able to create and manage your chatbots here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features coming after Supabase setup:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Create custom AI agents</li>
            <li>Train with your data sources</li>
            <li>Embed on your website</li>
            <li>Analytics and insights</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentsManager;