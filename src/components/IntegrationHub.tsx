import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Copy, ExternalLink, Code, Smartphone, Monitor, 
  MessageCircle, Settings, Palette, Volume2 
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  embed_code?: string;
  is_active: boolean;
}

const IntegrationHub = () => {
  const [selectedTab, setSelectedTab] = useState('chat-bubble');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);
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
        .select('id, name, embed_code, is_active')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAgents(data || []);
      if (data && data.length > 0) {
        setSelectedAgent(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  const integrationTypes = [
    { id: 'chat-bubble', label: 'Chat Bubble', icon: MessageCircle },
    { id: 'iframe', label: 'iFrame Embed', icon: Monitor },
    { id: 'api', label: 'API Integration', icon: Code },
    { id: 'mobile', label: 'Mobile SDK', icon: Smartphone },
  ];

  const chatBubbleCode = selectedAgentData?.embed_code || '';

  const iframeCode = `<iframe
  src="${window.location.origin}/chat/${selectedAgent}"
  width="100%"
  height="600"
  frameborder="0">
</iframe>`;

  const apiExample = `// Example API call to your agent
const response = await fetch('${window.location.origin}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agentId: '${selectedAgent}',
    message: 'Hello, how can I help?',
    visitorId: 'visitor_' + Date.now()
  })
});

const data = await response.json();
console.log(data.message);`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Integration Hub</h1>
          <p className="text-muted-foreground">Add your AI agent to any platform with these simple integrations</p>
        </div>
        
        {agents.length > 0 && (
          <div className="min-w-64">
            <Label>Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} {!agent.is_active && "(Inactive)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p>Loading your agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Agents Available</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI agent to get integration codes.
          </p>
          <Button onClick={() => window.location.href = '/?page=agents'}>
            Create Agent
          </Button>
        </Card>
      ) : !selectedAgentData ? (
        <div className="text-center py-12">
          <p>Please select an agent to view integration options.</p>
        </div>
      ) : (
        <>
          {/* Integration Type Tabs */}
          <div className="flex gap-2 border-b">
            {integrationTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedTab === type.id ? 'default' : 'ghost'}
                onClick={() => setSelectedTab(type.id)}
                className="flex items-center gap-2"
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Code/Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {selectedTab === 'chat-bubble' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageCircle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Chat Bubble Integration</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    Add a floating chat bubble to your website that users can click to start a conversation.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label>Agent ID</Label>
                      <div className="flex gap-2">
                        <Input value={selectedAgent} readOnly />
                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedAgent)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Embed Code</Label>
                      <div className="relative">
                        <Textarea
                          value={chatBubbleCode}
                          readOnly
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(chatBubbleCode)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedTab === 'iframe' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">iFrame Embed</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    Embed the chat interface directly into your webpage as a static element.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label>iFrame Code</Label>
                      <div className="relative">
                        <Textarea
                          value={iframeCode}
                          readOnly
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(iframeCode)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {selectedTab === 'api' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">API Integration</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    Build custom integrations using our REST API for maximum flexibility.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label>JavaScript Example</Label>
                      <div className="relative">
                        <Textarea
                          value={apiExample}
                          readOnly
                          rows={10}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(apiExample)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        API Documentation
                      </Button>
                      <Button variant="outline">
                        <Code className="w-4 h-4 mr-2" />
                        View SDKs
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {selectedTab === 'mobile' && (
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Mobile SDK</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    Integrate your AI agent into iOS and Android apps with our native SDKs.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 text-center">
                        <h4 className="font-medium mb-2">iOS SDK</h4>
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </Card>
                      <Card className="p-4 text-center">
                        <h4 className="font-medium mb-2">Android SDK</h4>
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </Card>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Widget Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="widget-enabled">Enable Widget</Label>
                    <Switch id="widget-enabled" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled">Sound Notifications</Label>
                    <Switch id="sound-enabled" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-open">Auto-open on page load</Label>
                    <Switch id="auto-open" />
                  </div>

                  <div>
                    <Label>Widget Position</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm">Bottom Right</Button>
                      <Button variant="ghost" size="sm">Bottom Left</Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Appearance</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <div className="w-8 h-8 bg-black rounded border-2 border-primary"></div>
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      <div className="w-8 h-8 bg-green-500 rounded"></div>
                      <div className="w-8 h-8 bg-red-500 rounded"></div>
                    </div>
                  </div>

                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm">Light</Button>
                      <Button variant="ghost" size="sm">Dark</Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Integrations</span>
                    <Badge>{agents.filter(a => a.is_active).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Agents</span>
                    <Badge>{agents.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selected Agent</span>
                    <Badge>{selectedAgentData?.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IntegrationHub;