import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Bot, Edit, Trash2, MessageSquare, 
  Settings, Copy, ExternalLink, Loader2,
  Search, Filter
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_active: boolean;
  embed_code?: string;
  created_at: string;
  updated_at: string;
}

const AgentsManager = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    instructions: 'You are a helpful AI assistant. Be friendly, professional, and provide accurate information.',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    is_active: true,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAgents();
    }
  }, [user]);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    setCreateLoading(true);
    try {
      const embedCode = `<script>
window.chatbaseConfig = {
  chatbotId: "AGENT_ID_PLACEHOLDER",
  domain: "${window.location.host}"
};
</script>
<script
  src="https://${window.location.host}/embed.min.js"
  defer>
</script>`;

      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...newAgent,
          user_id: user?.id,
          embed_code: embedCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Update embed code with actual agent ID
      const updatedEmbedCode = embedCode.replace('AGENT_ID_PLACEHOLDER', data.id);
      await supabase
        .from('agents')
        .update({ embed_code: updatedEmbedCode })
        .eq('id', data.id);

      toast({
        title: "Success!",
        description: "Agent created successfully.",
      });

      setShowCreateDialog(false);
      setNewAgent({
        name: '',
        description: '',
        instructions: 'You are a helpful AI assistant. Be friendly, professional, and provide accurate information.',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000,
        is_active: true,
      });
      loadAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const updateAgent = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update(agent)
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Agent updated successfully.",
      });

      setEditingAgent(null);
      loadAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Agent deleted successfully.",
      });

      loadAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAgentStatus = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: !agent.is_active })
        .eq('id', agent.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Agent ${!agent.is_active ? 'activated' : 'deactivated'}.`,
      });

      loadAgents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyEmbedCode = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard.",
    });
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Agents</h1>
            <p className="text-muted-foreground">Manage your AI chatbot agents</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Agents</h1>
          <p className="text-muted-foreground">Manage your AI chatbot agents</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Configure your AI chatbot agent settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="My Support Bot"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="A helpful customer support agent"
                />
              </div>

              <div>
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAgent.instructions}
                  onChange={(e) => setNewAgent({ ...newAgent, instructions: e.target.value })}
                  rows={4}
                  placeholder="You are a helpful AI assistant..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select 
                    value={newAgent.model} 
                    onValueChange={(value) => setNewAgent({ ...newAgent, model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature ({newAgent.temperature})</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newAgent.temperature}
                    onChange={(e) => setNewAgent({ ...newAgent, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={newAgent.max_tokens}
                  onChange={(e) => setNewAgent({ ...newAgent, max_tokens: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newAgent.is_active}
                  onCheckedChange={(checked) => setNewAgent({ ...newAgent, is_active: checked })}
                />
                <Label htmlFor="isActive">Activate immediately</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createAgent} disabled={createLoading} className="flex-1">
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Agent
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {agents.length === 0 ? "No agents yet" : "No agents found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {agents.length === 0 
                ? "Create your first AI agent to get started with chatbots"
                : "Try adjusting your search terms"
              }
            </p>
            {agents.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    {agent.description && (
                      <CardDescription className="mt-1">
                        {agent.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={agent.is_active ? "default" : "secondary"}>
                    {agent.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Model: {agent.model || 'gpt-4o-mini'}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAgentStatus(agent)}
                  >
                    {agent.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAgent(agent)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyEmbedCode(agent.embed_code || '')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(agent.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Agent Dialog */}
      {editingAgent && (
        <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update your agent configuration
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Agent Name</Label>
                <Input
                  id="editName"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Input
                  id="editDescription"
                  value={editingAgent.description || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editInstructions">System Instructions</Label>
                <Textarea
                  id="editInstructions"
                  value={editingAgent.instructions || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, instructions: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editModel">Model</Label>
                  <Select 
                    value={editingAgent.model || 'gpt-4o-mini'} 
                    onValueChange={(value) => setEditingAgent({ ...editingAgent, model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editTemperature">Temperature ({editingAgent.temperature || 0.7})</Label>
                  <Input
                    id="editTemperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingAgent.temperature || 0.7}
                    onChange={(e) => setEditingAgent({ ...editingAgent, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editMaxTokens">Max Tokens</Label>
                <Input
                  id="editMaxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={editingAgent.max_tokens || 1000}
                  onChange={(e) => setEditingAgent({ ...editingAgent, max_tokens: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => updateAgent(editingAgent)} className="flex-1">
                  Update Agent
                </Button>
                <Button variant="outline" onClick={() => setEditingAgent(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AgentsManager;