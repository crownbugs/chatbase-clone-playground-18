import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot, 
  Upload, 
  Globe, 
  FileText, 
  Database, 
  Settings, 
  Loader2, 
  Palette,
  MessageSquare,
  Link,
  TestTube,
  Rocket,
  Brain,
  Zap,
  Target,
  Eye,
  Shield,
  Clock,
  BarChart3,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface AgentConfig {
  // Basic Info
  name: string;
  description: string;
  purpose: string;
  
  // Knowledge Base
  dataSource: 'website' | 'files' | 'text' | 'database' | 'multiple';
  websites: string[];
  uploadedFiles: File[];
  textContent: string;
  databaseConfig: string;
  
  // Behavior & Personality
  instructions: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'custom';
  customTone: string;
  language: string;
  fallbackResponse: string;
  
  // AI Model Settings
  model: string;
  temperature: number;
  maxTokens: number;
  
  // Appearance
  chatTitle: string;
  chatSubtitle: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'center';
  avatar: string;
  
  // Lead Generation
  leadCaptureEnabled: boolean;
  leadCaptureMessage: string;
  requiredFields: string[];
  
  // Integration & Deployment
  allowedDomains: string[];
  rateLimit: number;
  analytics: boolean;
  conversations: boolean;
  
  // Advanced Features
  smartRouting: boolean;
  sentimentAnalysis: boolean;
  multilingual: boolean;
  voiceEnabled: boolean;
}

const WorkflowBuilder = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    purpose: '',
    dataSource: 'website',
    websites: [''],
    uploadedFiles: [],
    textContent: '',
    databaseConfig: '',
    instructions: '',
    tone: 'professional',
    customTone: '',
    language: 'en',
    fallbackResponse: "I'm sorry, I don't have information about that. Can you please rephrase your question or contact our support team?",
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    chatTitle: 'Chat with us',
    chatSubtitle: 'We\'re here to help!',
    primaryColor: '#000000',
    position: 'bottom-right',
    avatar: '',
    leadCaptureEnabled: false,
    leadCaptureMessage: 'Before we continue, could you please share your contact information?',
    requiredFields: ['email'],
    allowedDomains: [''],
    rateLimit: 100,
    analytics: true,
    conversations: true,
    smartRouting: false,
    sentimentAnalysis: false,
    multilingual: false,
    voiceEnabled: false,
  });

  const steps: WorkflowStep[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      description: 'Set up your agent\'s name, purpose, and description',
      completed: !!config.name && !!config.purpose,
      required: true,
    },
    {
      id: 'knowledge',
      title: 'Knowledge Base',
      description: 'Add data sources to train your AI agent',
      completed: config.dataSource === 'website' ? config.websites.some(w => w) : 
                 config.dataSource === 'files' ? config.uploadedFiles.length > 0 :
                 config.dataSource === 'text' ? !!config.textContent : false,
      required: true,
    },
    {
      id: 'personality',
      title: 'Personality & Behavior',
      description: 'Define how your agent communicates and behaves',
      completed: !!config.instructions && !!config.tone,
      required: true,
    },
    {
      id: 'appearance',
      title: 'Chat Widget Design',
      description: 'Customize the look and feel of your chat widget',
      completed: !!config.chatTitle && !!config.primaryColor,
      required: true,
    },
    {
      id: 'features',
      title: 'Advanced Features',
      description: 'Configure lead capture, analytics, and smart features',
      completed: true, // Optional step
      required: false,
    },
    {
      id: 'deploy',
      title: 'Deploy & Test',
      description: 'Test your agent and deploy to your website',
      completed: false,
      required: true,
    },
  ];

  useEffect(() => {
    const completedSteps = steps.filter(step => step.completed).length;
    setProgress((completedSteps / steps.length) * 100);
  }, [config]);

  const addWebsite = () => {
    setConfig(prev => ({
      ...prev,
      websites: [...prev.websites, '']
    }));
  };

  const updateWebsite = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      websites: prev.websites.map((w, i) => i === index ? value : w)
    }));
  };

  const removeWebsite = (index: number) => {
    setConfig(prev => ({
      ...prev,
      websites: prev.websites.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setConfig(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setConfig(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const addDomain = () => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: [...prev.allowedDomains, '']
    }));
  };

  const updateDomain = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.map((d, i) => i === index ? value : d)
    }));
  };

  const removeDomain = (index: number) => {
    setConfig(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter((_, i) => i !== index)
    }));
  };

  const deployAgent = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
          name: config.name,
          description: config.description,
          instructions: config.instructions,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Create knowledge bases for each data source
      const knowledgeBases = [];

      if (config.dataSource === 'website' || config.dataSource === 'multiple') {
        for (const website of config.websites.filter(w => w)) {
          const { data: kb, error: kbError } = await supabase
            .from('knowledge_bases')
            .insert({
              agent_id: agent.id,
              name: `Website: ${website}`,
              type: 'website',
              url: website,
            })
            .select()
            .single();

          if (kbError) throw kbError;
          knowledgeBases.push(kb);

          // Start website scraping
          await supabase.functions.invoke('scrape-website', {
            body: {
              url: website,
              knowledgeBaseId: kb.id,
            },
          });
        }
      }

      if (config.dataSource === 'text' || config.dataSource === 'multiple') {
        if (config.textContent) {
          const { data: kb, error: kbError } = await supabase
            .from('knowledge_bases')
            .insert({
              agent_id: agent.id,
              name: 'Text Content',
              type: 'text',
              content: config.textContent,
              processed: true,
            })
            .select()
            .single();

          if (kbError) throw kbError;
          knowledgeBases.push(kb);
        }
      }

      if (config.dataSource === 'files' || config.dataSource === 'multiple') {
        for (const file of config.uploadedFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(`${user.id}/${fileName}`, file);

          if (!uploadError) {
            const { data: kb, error: kbError } = await supabase
              .from('knowledge_bases')
              .insert({
                agent_id: agent.id,
                name: `File: ${file.name}`,
                type: 'files',
                metadata: { fileName },
              })
              .select()
              .single();

            if (kbError) throw kbError;
            knowledgeBases.push(kb);

            await supabase.functions.invoke('process-document', {
              body: {
                fileName,
                knowledgeBaseId: kb.id,
                userId: user.id,
              },
            });
          }
        }
      }

      toast({
        title: "Success! 🎉",
        description: "Your AI agent has been created and deployed successfully.",
      });

      // Move to next step to show deployment info
      setCurrentStep(steps.length - 1);

    } catch (error: any) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create agent.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Bot className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Let's Create Your AI Agent</h2>
              <p className="text-muted-foreground mt-2">Start with the basics - what will your agent be called and what's its purpose?</p>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Customer Support Bot"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Select
                  value={config.purpose}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, purpose: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What will your agent help with?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-support">Customer Support</SelectItem>
                    <SelectItem value="sales">Sales & Lead Generation</SelectItem>
                    <SelectItem value="faq">FAQ Assistant</SelectItem>
                    <SelectItem value="booking">Appointment Booking</SelectItem>
                    <SelectItem value="ecommerce">E-commerce Assistant</SelectItem>
                    <SelectItem value="education">Educational Tutor</SelectItem>
                    <SelectItem value="custom">Custom Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe what your agent will do and how it will help your users..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'knowledge':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Train Your Agent</h2>
              <p className="text-muted-foreground mt-2">Add knowledge sources so your agent can provide accurate, helpful responses</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Tabs value={config.dataSource} onValueChange={(value: any) => setConfig(prev => ({ ...prev, dataSource: value }))}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="multiple" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Multiple
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="website" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Website URLs
                      </CardTitle>
                      <CardDescription>
                        Add website URLs that contain information your agent should know about
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {config.websites.map((website, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={website}
                            onChange={(e) => updateWebsite(index, e.target.value)}
                            placeholder="https://your-website.com"
                          />
                          {config.websites.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeWebsite(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" onClick={addWebsite} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Website
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Documents
                      </CardTitle>
                      <CardDescription>
                        Upload PDFs, Word docs, text files, or other documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">Drop files here or click to upload</h3>
                        <p className="text-muted-foreground mb-4">Supports PDF, DOC, DOCX, TXT, JSON, HTML</p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.txt,.doc,.docx,.json,.html,.htm,.md"
                        />
                        <Button onClick={() => document.getElementById('file-upload')?.click()}>
                          Choose Files
                        </Button>
                      </div>
                      
                      {config.uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="font-medium">Uploaded Files:</h4>
                          {config.uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Text Content
                      </CardTitle>
                      <CardDescription>
                        Paste or type the information you want your agent to know
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={config.textContent}
                        onChange={(e) => setConfig(prev => ({ ...prev, textContent: e.target.value }))}
                        placeholder="Enter your knowledge content here... This could be FAQs, product information, company policies, or any other text-based information your agent should know about."
                        rows={10}
                        className="min-h-[200px]"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="multiple" className="space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-lg">Use multiple knowledge sources to create a more comprehensive agent</p>
                  </div>
                  
                  {/* Website Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Websites
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {config.websites.map((website, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={website}
                            onChange={(e) => updateWebsite(index, e.target.value)}
                            placeholder="https://your-website.com"
                          />
                          {config.websites.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeWebsite(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" onClick={addWebsite} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Website
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Files Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">Upload additional documents</p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload-multiple"
                          accept=".pdf,.txt,.doc,.docx,.json,.html,.htm,.md"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file-upload-multiple')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                      
                      {config.uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {config.uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Text Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Additional Text Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={config.textContent}
                        onChange={(e) => setConfig(prev => ({ ...prev, textContent: e.target.value }))}
                        placeholder="Add any additional text-based information..."
                        rows={6}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Shape Your Agent's Personality</h2>
              <p className="text-muted-foreground mt-2">Define how your agent communicates and behaves with users</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Communication Style</CardTitle>
                  <CardDescription>Choose how your agent should communicate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tone of Voice</Label>
                    <Select
                      value={config.tone}
                      onValueChange={(value: any) => setConfig(prev => ({ ...prev, tone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional & Formal</SelectItem>
                        <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                        <SelectItem value="casual">Casual & Conversational</SelectItem>
                        <SelectItem value="formal">Formal & Business-like</SelectItem>
                        <SelectItem value="custom">Custom Tone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.tone === 'custom' && (
                    <div className="space-y-2">
                      <Label>Custom Tone Description</Label>
                      <Input
                        value={config.customTone}
                        onChange={(e) => setConfig(prev => ({ ...prev, customTone: e.target.value }))}
                        placeholder="Describe the tone you want (e.g., enthusiastic and helpful)"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Primary Language</Label>
                    <Select
                      value={config.language}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Instructions</CardTitle>
                  <CardDescription>
                    Detailed instructions on how your agent should behave and respond
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.instructions}
                    onChange={(e) => setConfig(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="You are a helpful customer support agent for [Your Company]. Always be polite, professional, and helpful. If you don't know something, offer to connect the user with a human agent. Focus on solving problems and providing clear, actionable solutions..."
                    rows={8}
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fallback Response</CardTitle>
                  <CardDescription>
                    What should your agent say when it doesn't know the answer?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={config.fallbackResponse}
                    onChange={(e) => setConfig(prev => ({ ...prev, fallbackResponse: e.target.value }))}
                    placeholder="I'm sorry, I don't have information about that. Can you please rephrase your question or contact our support team?"
                    rows={3}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Model Settings</CardTitle>
                  <CardDescription>Advanced settings for AI behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>AI Model</Label>
                      <Select
                        value={config.model}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Creativity Level</Label>
                      <Select
                        value={config.temperature.toString()}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, temperature: parseFloat(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.1">Conservative (0.1)</SelectItem>
                          <SelectItem value="0.7">Balanced (0.7)</SelectItem>
                          <SelectItem value="1.0">Creative (1.0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Response Length</Label>
                      <Select
                        value={config.maxTokens.toString()}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, maxTokens: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">Short (500 tokens)</SelectItem>
                          <SelectItem value="1000">Medium (1000 tokens)</SelectItem>
                          <SelectItem value="2000">Long (2000 tokens)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Palette className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Design Your Chat Widget</h2>
              <p className="text-muted-foreground mt-2">Customize the appearance to match your brand</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Chat Window Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chat Title</Label>
                        <Input
                          value={config.chatTitle}
                          onChange={(e) => setConfig(prev => ({ ...prev, chatTitle: e.target.value }))}
                          placeholder="Chat with us"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Chat Subtitle</Label>
                        <Input
                          value={config.chatSubtitle}
                          onChange={(e) => setConfig(prev => ({ ...prev, chatSubtitle: e.target.value }))}
                          placeholder="We're here to help!"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-16"
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Widget Position</Label>
                        <Select
                          value={config.position}
                          onValueChange={(value: any) => setConfig(prev => ({ ...prev, position: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 rounded-lg p-4 min-h-[300px] relative">
                        <div className="absolute bottom-4 right-4">
                          <div className="bg-white rounded-lg shadow-lg p-4 w-64">
                            <div className="flex items-center gap-2 mb-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                🤖
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{config.chatTitle || 'Chat with us'}</h4>
                                <p className="text-xs text-gray-500">{config.chatSubtitle || "We're here to help!"}</p>
                              </div>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="bg-gray-100 rounded p-2">
                                Hello! How can I help you today?
                              </div>
                              <div 
                                className="text-white rounded p-2 ml-auto max-w-[80%] text-right"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                Hi there!
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Advanced Features</h2>
              <p className="text-muted-foreground mt-2">Configure lead capture, analytics, and smart features</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Lead Generation
                  </CardTitle>
                  <CardDescription>
                    Capture visitor information during conversations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Enable Lead Capture</Label>
                      <p className="text-sm text-muted-foreground">Ask for visitor contact information</p>
                    </div>
                    <Switch
                      checked={config.leadCaptureEnabled}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, leadCaptureEnabled: checked }))}
                    />
                  </div>

                  {config.leadCaptureEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Lead Capture Message</Label>
                        <Textarea
                          value={config.leadCaptureMessage}
                          onChange={(e) => setConfig(prev => ({ ...prev, leadCaptureMessage: e.target.value }))}
                          placeholder="Before we continue, could you please share your contact information?"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Required Fields</Label>
                        <div className="flex flex-wrap gap-2">
                          {['email', 'name', 'phone', 'company'].map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={field}
                                checked={config.requiredFields.includes(field)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConfig(prev => ({ ...prev, requiredFields: [...prev.requiredFields, field] }));
                                  } else {
                                    setConfig(prev => ({ ...prev, requiredFields: prev.requiredFields.filter(f => f !== field) }));
                                  }
                                }}
                              />
                              <Label htmlFor={field} className="capitalize">{field}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics & Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">Track conversations and user interactions</p>
                    </div>
                    <Switch
                      checked={config.analytics}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, analytics: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Conversation History</Label>
                      <p className="text-sm text-muted-foreground">Save conversation history for review</p>
                    </div>
                    <Switch
                      checked={config.conversations}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, conversations: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Smart Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Smart Routing</Label>
                      <p className="text-sm text-muted-foreground">Automatically route complex queries to humans</p>
                    </div>
                    <Switch
                      checked={config.smartRouting}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, smartRouting: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Sentiment Analysis</Label>
                      <p className="text-sm text-muted-foreground">Detect customer satisfaction in real-time</p>
                    </div>
                    <Switch
                      checked={config.sentimentAnalysis}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sentimentAnalysis: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Multilingual Support</Label>
                      <p className="text-sm text-muted-foreground">Auto-detect and respond in user's language</p>
                    </div>
                    <Switch
                      checked={config.multilingual}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, multilingual: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Voice Interaction</Label>
                      <p className="text-sm text-muted-foreground">Enable voice input and responses</p>
                    </div>
                    <Switch
                      checked={config.voiceEnabled}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, voiceEnabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security & Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Allowed Domains</Label>
                    <p className="text-sm text-muted-foreground">Restrict widget to specific domains (leave empty for all domains)</p>
                    {config.allowedDomains.map((domain, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={domain}
                          onChange={(e) => updateDomain(index, e.target.value)}
                          placeholder="your-domain.com"
                        />
                        {config.allowedDomains.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeDomain(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" onClick={addDomain} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Domain
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Rate Limit (messages per hour)</Label>
                    <Select
                      value={config.rateLimit.toString()}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, rateLimit: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 messages/hour</SelectItem>
                        <SelectItem value="100">100 messages/hour</SelectItem>
                        <SelectItem value="250">250 messages/hour</SelectItem>
                        <SelectItem value="500">500 messages/hour</SelectItem>
                        <SelectItem value="1000">1000 messages/hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'deploy':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold">Deploy Your Agent</h2>
              <p className="text-muted-foreground mt-2">Test your agent and add it to your website</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Test Your Agent
                  </CardTitle>
                  <CardDescription>
                    Try out your agent before deploying it to your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-muted-foreground mb-4">Chat widget preview will appear here</p>
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open Test Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="w-5 h-5" />
                    Integration Code
                  </CardTitle>
                  <CardDescription>
                    Add this code to your website to deploy your agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <code className="text-sm">
                      {`<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://rebur.co/embed.min.js';
    script.setAttribute('data-chatbot-id', 'your-agent-id');
    document.head.appendChild(script);
  })();
</script>`}
                    </code>
                  </div>
                  <Button className="mt-4" variant="outline">
                    Copy Code
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button onClick={deployAgent} disabled={loading} size="lg" className="px-8">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Agent
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Workflow Builder</h1>
          <p className="text-xl text-muted-foreground">Create your AI agent in minutes</p>
        </div>

        {/* Progress */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {steps.map((step, index) => (
              <Button
                key={step.id}
                variant={currentStep === index ? "default" : step.completed ? "outline" : "ghost"}
                size="sm"
                className={`flex items-center gap-2 ${step.completed ? 'border-green-500' : ''}`}
                onClick={() => setCurrentStep(index)}
              >
                {step.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                <span className="hidden sm:inline">{index + 1}.</span>
                {step.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {renderStep()}
              
              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  ← Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>

                <Button
                  onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                  disabled={currentStep === steps.length - 1 || !steps[currentStep].completed}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;