import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, Globe, Upload, FileText, Database, 
  Settings, MessageSquare, ArrowRight, 
  CheckCircle, Loader2, X, Plus,
  Eye, Play, Download, Code,
  Link, Trash2, RefreshCw
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface KnowledgeSource {
  id: string;
  type: 'url' | 'file' | 'text';
  name: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  size?: number;
}

interface AgentData {
  name: string;
  description: string;
  instructions: string;
  knowledgeSources: KnowledgeSource[];
  settings: {
    temperature: number;
    maxTokens: number;
    language: string;
  };
}

const WorkflowBuilder = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [agentData, setAgentData] = useState<AgentData>({
    name: '',
    description: '',
    instructions: '',
    knowledgeSources: [],
    settings: {
      temperature: 0.7,
      maxTokens: 1000,
      language: 'en'
    }
  });
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [testMessages, setTestMessages] = useState<Array<{role: string, content: string}>>([]);
  const [testInput, setTestInput] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const steps = [
    { id: 1, name: 'Basic Info', icon: Bot },
    { id: 2, name: 'Knowledge Base', icon: Database },
    { id: 3, name: 'Instructions', icon: Settings },
    { id: 4, name: 'Preview & Test', icon: MessageSquare },
    { id: 5, name: 'Deploy', icon: CheckCircle }
  ];

  const crawlWebsite = async (url: string) => {
    setCrawlLoading(true);
    try {
      const response = await supabase.functions.invoke('scrape-website', {
        body: { url, discoverLinks: true }
      });

      if (response.data?.links) {
        setDiscoveredUrls(response.data.links);
        setSelectedUrls(response.data.links.slice(0, 10)); // Pre-select first 10
        toast({
          title: "Website crawled successfully",
          description: `Found ${response.data.links.length} pages to index`,
        });
      }
    } catch (error) {
      toast({
        title: "Crawl failed",
        description: "Could not crawl the website. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setCrawlLoading(false);
    }
  };

  const addUrlSource = () => {
    if (!urlInput.trim()) return;

    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type: 'url',
      name: urlInput,
      content: urlInput,
      status: 'pending'
    };

    setAgentData(prev => ({
      ...prev,
      knowledgeSources: [...prev.knowledgeSources, newSource]
    }));
    setUrlInput('');
  };

  const addSelectedUrls = () => {
    const newSources: KnowledgeSource[] = selectedUrls.map(url => ({
      id: Date.now().toString() + Math.random(),
      type: 'url' as const,
      name: url,
      content: url,
      status: 'pending' as const
    }));

    setAgentData(prev => ({
      ...prev,
      knowledgeSources: [...prev.knowledgeSources, ...newSources]
    }));
    setDiscoveredUrls([]);
    setSelectedUrls([]);
  };

  const addTextSource = () => {
    if (!textInput.trim()) return;

    const newSource: KnowledgeSource = {
      id: Date.now().toString(),
      type: 'text',
      name: `Text content (${textInput.length} chars)`,
      content: textInput,
      status: 'completed'
    };

    setAgentData(prev => ({
      ...prev,
      knowledgeSources: [...prev.knowledgeSources, newSource]
    }));
    setTextInput('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const newSource: KnowledgeSource = {
        id: Date.now().toString() + Math.random(),
        type: 'file',
        name: file.name,
        content: '', // Will be processed
        status: 'pending',
        size: file.size
      };

      setAgentData(prev => ({
        ...prev,
        knowledgeSources: [...prev.knowledgeSources, newSource]
      }));
    });
  };

  const removeSource = (id: string) => {
    setAgentData(prev => ({
      ...prev,
      knowledgeSources: prev.knowledgeSources.filter(s => s.id !== id)
    }));
  };

  const testAgent = async () => {
    if (!testInput.trim()) return;

    const newMessage = { role: 'user', content: testInput };
    setTestMessages(prev => [...prev, newMessage]);
    setTestInput('');

    // Simulate AI response
    setTimeout(() => {
      const response = { 
        role: 'assistant', 
        content: `Based on the knowledge you've provided, I can help with: ${testInput}. This is a test response showing how your agent will interact with users.`
      };
      setTestMessages(prev => [...prev, response]);
    }, 1000);
  };

  const deployAgent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: agentData.name,
          description: agentData.description,
          instructions: agentData.instructions,
          is_active: true
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Create knowledge base entries
      for (const source of agentData.knowledgeSources) {
        await supabase
          .from('knowledge_bases')
          .insert({
            agent_id: agent.id,
            name: source.name,
            type: source.type,
            content: source.type === 'text' ? source.content : null,
            url: source.type === 'url' ? source.content : null,
          });
      }

      toast({
        title: "Agent deployed successfully!",
        description: "Your AI agent is now live and ready to use.",
      });

      // Reset form
      setAgentData({
        name: '',
        description: '',
        instructions: '',
        knowledgeSources: [],
        settings: { temperature: 0.7, maxTokens: 1000, language: 'en' }
      });
      setCurrentStep(1);

    } catch (error: any) {
      toast({
        title: "Deployment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const WorkflowSidebar = () => (
    <Sidebar className="w-64 border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workflow Steps</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {steps.map((step) => (
                <SidebarMenuItem key={step.id}>
                  <SidebarMenuButton 
                    onClick={() => setCurrentStep(step.id)}
                    isActive={currentStep === step.id}
                    className="w-full"
                  >
                    <step.icon className="h-4 w-4" />
                    <span>{step.name}</span>
                    {currentStep > step.id && (
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
              <p className="text-muted-foreground">Give your AI agent a name and description</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={agentData.name}
                  onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Customer Support Assistant"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={agentData.description}
                  onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your agent will help with..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Knowledge Base</h2>
              <p className="text-muted-foreground">Add content to train your AI agent</p>
            </div>

            {/* URL Crawling */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Website Crawling
                </CardTitle>
                <CardDescription>
                  Enter a website URL to automatically discover and crawl all pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => crawlWebsite(urlInput)}
                    disabled={crawlLoading || !urlInput.trim()}
                  >
                    {crawlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crawl'}
                  </Button>
                </div>

                {discoveredUrls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      Found {discoveredUrls.length} pages. Select which ones to include:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-3">
                      {discoveredUrls.map((url, index) => (
                        <label key={index} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedUrls.includes(url)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUrls(prev => [...prev, url]);
                              } else {
                                setSelectedUrls(prev => prev.filter(u => u !== url));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="truncate">{url}</span>
                        </label>
                      ))}
                    </div>
                    <Button onClick={addSelectedUrls} disabled={selectedUrls.length === 0}>
                      Add {selectedUrls.length} Selected Pages
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={addUrlSource}
                    disabled={!urlInput.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Single URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Upload documents (PDF, TXT, DOC, DOCX, JSON)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    Drag and drop files here, or click to browse
                  </p>
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
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Direct Text Input
                </CardTitle>
                <CardDescription>
                  Paste or type content directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your content here..."
                  rows={6}
                />
                <Button 
                  onClick={addTextSource}
                  disabled={!textInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text Content
                </Button>
              </CardContent>
            </Card>

            {/* Knowledge Sources List */}
            {agentData.knowledgeSources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Knowledge Sources ({agentData.knowledgeSources.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {agentData.knowledgeSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          {source.type === 'url' && <Link className="h-4 w-4 text-blue-500" />}
                          {source.type === 'file' && <FileText className="h-4 w-4 text-green-500" />}
                          {source.type === 'text' && <FileText className="h-4 w-4 text-purple-500" />}
                          <div>
                            <p className="text-sm font-medium truncate max-w-md">{source.name}</p>
                            {source.size && (
                              <p className="text-xs text-muted-foreground">
                                {(source.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            source.status === 'completed' ? 'default' :
                            source.status === 'processing' ? 'secondary' :
                            source.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {source.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSource(source.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Agent Instructions</h2>
              <p className="text-muted-foreground">Define how your agent should behave and respond</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Instructions</CardTitle>
                <CardDescription>
                  Tell your agent how to behave, what tone to use, and any specific guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={agentData.instructions}
                  onChange={(e) => setAgentData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="You are a helpful customer support assistant. Always be polite, professional, and try to solve the customer's problem. If you don't know something, admit it and offer to connect them with a human agent..."
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="temperature">Response Creativity (Temperature): {agentData.settings.temperature}</Label>
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={agentData.settings.temperature}
                    onChange={(e) => setAgentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, temperature: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Response Length</Label>
                  <Input
                    type="number"
                    id="maxTokens"
                    value={agentData.settings.maxTokens}
                    onChange={(e) => setAgentData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, maxTokens: parseInt(e.target.value) || 1000 }
                    }))}
                    min="100"
                    max="4000"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Preview & Test</h2>
              <p className="text-muted-foreground">Test your agent before deploying</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agent Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Name</h4>
                    <p className="text-sm text-muted-foreground">{agentData.name || 'Unnamed Agent'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">{agentData.description || 'No description'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Knowledge Sources</h4>
                    <p className="text-sm text-muted-foreground">{agentData.knowledgeSources.length} sources</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Instructions Length</h4>
                    <p className="text-sm text-muted-foreground">{agentData.instructions.length} characters</p>
                  </div>
                </CardContent>
              </Card>

              {/* Live Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Live Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-60 border rounded p-3 overflow-y-auto bg-muted/30">
                      {testMessages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Start a conversation to test your agent
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {testMessages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-2 rounded text-sm ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder="Type a test message..."
                        onKeyPress={(e) => e.key === 'Enter' && testAgent()}
                      />
                      <Button onClick={testAgent} disabled={!testInput.trim()}>
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Deploy Your Agent</h2>
              <p className="text-muted-foreground">Your agent is ready to go live</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Ready to Deploy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">Knowledge Sources</h4>
                    <p className="text-2xl font-bold text-primary">{agentData.knowledgeSources.length}</p>
                  </div>
                  <div className="p-4 border rounded">
                    <h4 className="font-medium">Instructions</h4>
                    <p className="text-2xl font-bold text-primary">
                      {agentData.instructions.length > 0 ? '✓' : '⚠️'}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={deployAgent} 
                  disabled={loading || !agentData.name.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      Deploy Agent
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Workflow Builder</h1>
          <div className="flex items-center gap-2 mt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 h-0.5 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {renderStepContent()}
        
        <div className="flex gap-2 mt-6">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < 5 && (
            <Button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 1 && !agentData.name.trim()}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <SidebarProvider>
        <WorkflowSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderStepContent()}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default WorkflowBuilder;