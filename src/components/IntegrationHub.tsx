import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, MessageSquare, Smartphone, Code, Zap, Puzzle } from "lucide-react";
import { WebScraper } from "./WebScraper";

const IntegrationHub = () => {
  const integrations = [
    {
      id: 'website',
      name: 'Website Widget',
      description: 'Embed your chatbot on any website with a simple script tag',
      icon: Globe,
      status: 'available',
      category: 'Web'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      description: 'Connect your chatbot to WhatsApp Business API',
      icon: MessageSquare,
      status: 'coming-soon',
      category: 'Messaging'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Add your chatbot to Slack workspaces',
      icon: MessageSquare,
      status: 'coming-soon',
      category: 'Messaging'
    },
    {
      id: 'mobile',
      name: 'Mobile SDK',
      description: 'Integrate chatbot into your mobile applications',
      icon: Smartphone,
      status: 'coming-soon',
      category: 'Mobile'
    },
    {
      id: 'api',
      name: 'REST API',
      description: 'Custom integration using our REST API',
      icon: Code,
      status: 'available',
      category: 'API'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with 3000+ apps through Zapier',
      icon: Zap,
      status: 'coming-soon',
      category: 'Automation'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your chatbots to various platforms and scrape web content
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="scraper">Web Scraper</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-primary" />
                      <Badge 
                        variant={integration.status === 'available' ? 'default' : 'secondary'}
                      >
                        {integration.status === 'available' ? 'Available' : 'Coming Soon'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{integration.category}</Badge>
                      <Button 
                        size="sm" 
                        disabled={integration.status !== 'available'}
                        variant={integration.status === 'available' ? 'default' : 'secondary'}
                      >
                        {integration.status === 'available' ? 'Configure' : 'Coming Soon'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="h-5 w-5" />
                Custom Integration
              </CardTitle>
              <CardDescription>
                Need a custom integration? Contact us to discuss your requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scraper">
          <WebScraper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationHub;