import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Upload, Globe, FileText, Database, Settings, Loader2 } from "lucide-react";

interface AgentData {
  name: string;
  description: string;
  instructions: string;
  dataSource: 'website' | 'files' | 'text' | 'database';
  sourceConfig: string;
}

const AgentBuilder = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const [agentData, setAgentData] = useState<AgentData>({
    name: '',
    description: '',
    instructions: '',
    dataSource: 'website',
    sourceConfig: ''
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const dataSourceOptions = [
    { value: 'website', label: 'Website URL', icon: Globe },
    { value: 'files', label: 'Upload Files', icon: Upload },
    { value: 'text', label: 'Text Input', icon: FileText },
    { value: 'database', label: 'Database', icon: Database }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };

  const handleCreateAgent = async () => {
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
          name: agentData.name,
          description: agentData.description,
          instructions: agentData.instructions,
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Create knowledge base
      const { data: knowledgeBase, error: kbError } = await supabase
        .from('knowledge_bases')
        .insert({
          agent_id: agent.id,
          name: `${agentData.name} Knowledge Base`,
          type: agentData.dataSource,
          content: agentData.dataSource === 'text' ? agentData.sourceConfig : null,
          url: agentData.dataSource === 'website' ? agentData.sourceConfig : null,
        })
        .select()
        .single();

      if (kbError) throw kbError;

      // Process data source
      if (agentData.dataSource === 'website' && agentData.sourceConfig) {
        // Scrape website
        const response = await supabase.functions.invoke('scrape-website', {
          body: {
            url: agentData.sourceConfig,
            knowledgeBaseId: knowledgeBase.id,
          },
        });

        if (response.error) {
          console.error('Website scraping failed:', response.error);
        }
      } else if (agentData.dataSource === 'files' && uploadedFiles.length > 0) {
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
          }
        }
      } else if (agentData.dataSource === 'text' && agentData.sourceConfig) {
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

      // Reset form
      setStep(1);
      setAgentData({
        name: '',
        description: '',
        instructions: '',
        dataSource: 'website',
        sourceConfig: ''
      });
      setUploadedFiles([]);

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Your AI Agent</h1>
        <p className="text-muted-foreground">Build a custom AI agent tailored to your business needs</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepNum <= step 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {stepNum}
            </div>
            {stepNum < 4 && (
              <div
                className={`w-16 h-0.5 ${
                  stepNum < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <p className="text-muted-foreground">Let's start with the basics about your AI agent</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={agentData.name}
                  onChange={(e) => setAgentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Customer Support Bot"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={agentData.description}
                  onChange={(e) => setAgentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your agent will do..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold">Data Source</h2>
              <p className="text-muted-foreground">Choose how to train your AI agent</p>
            </div>

            <div>
              <Label>Data Source Type</Label>
              <Select
                value={agentData.dataSource}
                onValueChange={(value: 'website' | 'files' | 'text' | 'database') => 
                  setAgentData(prev => ({ ...prev, dataSource: value }))
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
                {agentData.dataSource === 'website' && 'Website URL'}
                {agentData.dataSource === 'files' && 'Upload Files'}
                {agentData.dataSource === 'text' && 'Training Text'}
                {agentData.dataSource === 'database' && 'Database Connection'}
              </Label>
              
              {agentData.dataSource === 'files' ? (
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
                  value={agentData.sourceConfig}
                  onChange={(e) => setAgentData(prev => ({ ...prev, sourceConfig: e.target.value }))}
                  placeholder={
                    agentData.dataSource === 'website' ? 'https://your-website.com' :
                    agentData.dataSource === 'text' ? 'Enter your training text here...' :
                    'Database connection string'
                  }
                  rows={4}
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Settings className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold">Configuration</h2>
              <p className="text-muted-foreground">Set up your agent's behavior and responses</p>
            </div>

            <div>
              <Label htmlFor="instructions">Agent Instructions</Label>
              <Textarea
                id="instructions"
                value={agentData.instructions}
                onChange={(e) => setAgentData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Give your agent specific instructions on how to behave, what tone to use, and how to respond to customers..."
                rows={6}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold">Review & Create</h2>
              <p className="text-muted-foreground">Review your agent configuration</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Agent Details</h3>
                <p><strong>Name:</strong> {agentData.name}</p>
                <p><strong>Description:</strong> {agentData.description}</p>
                <p><strong>Data Source:</strong> {agentData.dataSource}</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Instructions</h3>
                <p className="text-sm">{agentData.instructions}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Previous
          </Button>

          {step < 4 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreateAgent} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agent
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AgentBuilder;