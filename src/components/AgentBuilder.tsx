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
  Search, Filter, Globe, Upload, FileText, Database, ChevronLeft, ChevronRight
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
  dataSource?: 'website' | 'files' | 'text' | 'database';
  sourceConfig?: string;
}

const AgentBuilder = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    instructions: 'You are a helpful AI assistant. Be friendly, professional, and provide accurate information.',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    is_active: true,
    dataSource: 'website' as 'website' | 'files' | 'text' | 'database',
    sourceConfig: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Data source options for knowledge base
  const dataSourceOptions = [
    { value: 'website', label: 'Website URL', icon: Globe },
    { value: 'files', label: 'Upload Files', icon: Upload },
    { value: 'text', label: 'Text Input', icon: FileText },
    { value: 'database', label: 'Database', icon: Database }
  ];

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const createAgent = async () => {
    setCreateLoading(true);
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create an agent.",
          variant: "destructive",
        });
        return;
      }

      // Create agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: newAgent.name,
          description: newAgent.description,
          instructions: newAgent.instructions,
          model: newAgent.model,
          temperature: newAgent.temperature,
          max_tokens: newAgent.max_tokens,
          is_active: newAgent.is_active,
          dataSource: newAgent.dataSource,
          sourceConfig: newAgent.sourceConfig
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Generate embed code
      const embedCode = `<script>
window.chatbaseConfig = {
  chatbotId: "${agent.id}",
  domain: "${window.location.host}"
};
</script>
<script
  src="https://${window.location.host}/embed.min.js"
  defer>
</script>`;

      // Update agent with embed code
      await supabase
        .from('agents')
        .update({ embed_code: embedCode })
        .eq('id', agent.id);

      // Create knowledge base
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('knowledge_bases')
        .insert({
          agent_id: agent.id,
          name: `${newAgent.name} Knowledge Base`,
          type: newAgent.dataSource,
          content: newAgent.dataSource === 'text' ? newAgent.sourceConfig : null,
          url: newAgent.dataSource === 'website' ? newAgent.sourceConfig : null,
        })
        .select()
        .single();

      if (kbError) throw kbError;

      // Process data source
      if (newAgent.dataSource === 'website' && newAgent.sourceConfig) {
        // Scrape website
        const response = await supabase.functions.invoke('scrape-website', {
          body: {
            url: newAgent.sourceConfig,
            knowledgeBaseId: knowledgeBase.id,
          },
        });

        if (response.error) {
          console.error('Website scraping failed:', response.error);
          toast({
            title: "Warning",
            description: "Website scraping may not have completed successfully",
            variant: "default",
          });
        }
      } else if (newAgent.dataSource === 'files' && uploadedFiles.length > 0) {
        // Upload and process files
        for (const file of uploadedFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`${user.id}/${fileName}`, file);

          if (!uploadError) {
            await supabase.functions.invoke('process-document', {
              body: {
                fileName,
                knowledgeBaseId: knowledgeBase.id,
                userId: user.id,
              },
            });
          } else {
            console.error('File upload failed:', uploadError);
          }
        }
      } else if (newAgent.dataSource === 'text' && newAgent.sourceConfig) {
        // Update knowledge base with processed text
        await supabase
          .from('knowledge_bases')
          .update({ processed: true })
          .eq('id', knowledgeBase.id);
      }

      toast({
        title: "Success!",
        description: "Your AI agent has been created successfully.",
      });

      // Reset form and close dialog
      setShowCreateDialog(false);
      setCreateStep(1);
      setUploadedFiles([]);
      setNewAgent({
        name: '',
        description: '',
        instructions: 'You are a helpful AI assistant. Be friendly, professional, and provide accurate information.',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 1000,
        is_active: true,
        dataSource: 'website',
        sourceConfig: ''
      });
      
      loadAgents();
    } catch (error: any) {
      console.error('Agent creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create agent.",
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
        
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setCreateStep(1);
            setUploadedFiles([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {createStep === 1 && "Basic Information"}
                {createStep === 2 && "Data Source"}
                {createStep === 3 && "Agent Configuration"}
              </DialogTitle>
              <DialogDescription>
                {createStep === 1 && "Let's start with the basics about your AI agent"}
                {createStep === 2 && "Choose how to train your AI agent"}
                {createStep === 3 && "Set up your agent's behavior and responses"}
              </DialogDescription>
            </DialogHeader>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNum <= createStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-16 h-0.5 ${
                        stepNum < createStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            {/* Step 1: Basic Information */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Agent Name *</Label>
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
                  <Textarea
                    id="description"
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    placeholder="A helpful customer support agent"
                    rows={3}
                  />
                </div>
              </div>
            )}
            
            {/* Step 2: Data Source */}
            {createStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Data Source Type *</Label>
                  <Select
                    value={newAgent.dataSource}
                    onValueChange={(value: 'website' | 'files' | 'text' | 'database') => 
                      setNewAgent({ ...newAgent, dataSource: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sourceConfig">
                    {newAgent.dataSource === 'website' && 'Website URL *'}
                    {newAgent.dataSource === 'files' && 'Upload Files *'}
                    {newAgent.dataSource === 'text' && 'Training Text *'}
                    {newAgent.dataSource === 'database' && 'Database Connection *'}
                  </Label>
                  
                  {newAgent.dataSource === 'files' ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Upload documents (PDF, TXT, DOC, etc.)</p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.txt,.doc,.docx,.json,.html,.htm"
                        />
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selected files:</p>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      id="sourceConfig"
                      value={newAgent.sourceConfig}
                      onChange={(e) => setNewAgent({ ...newAgent, sourceConfig: e.target.value })}
                      placeholder={
                        newAgent.dataSource === 'website' ? 'https://your-website.com' :
                        newAgent.dataSource === 'text' ? 'Enter your training text here...' :
                        'Database connection string'
                      }
                      rows={4}
                    />
                  )}
                </div>
              </div>
            )}
            
            {/* Step 3: Configuration */}
            {createStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="instructions">System Instructions *</Label>
                  <Textarea
                    id="instructions"
                    value={newAgent.instructions}
                    onChange={(e) => setNewAgent({ ...newAgent, instructions: e.target.value })}
                    rows={6}
                    placeholder="You are a helpful AI assistant..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model *</Label>
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
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens *</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="4000"
                    value={newAgent.max_tokens}
                    onChange={(e) => setNewAgent({ ...newAgent, max_tokens: parseInt(e.target.value) || 1000 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Controls response length (100-4000)</p>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={newAgent.is_active}
                    onCheckedChange={(checked) => setNewAgent({ ...newAgent, is_active: checked })}
                  />
                  <Label htmlFor="isActive">Activate immediately</Label>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCreateStep(createStep - 1)}
                disabled={createStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              {createStep < 3 ? (
                <Button onClick={() => setCreateStep(createStep + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={createAgent} disabled={createLoading}>
                  {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Agent
                </Button>
              )}
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

export default AgentBuilder;
