import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AgentBuilder from "@/components/AgentBuilder";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import IntegrationHub from "@/components/IntegrationHub";
import ChatWidget from "@/components/ChatWidget";
import { 
  LayoutDashboard, Bot, BarChart3, Plug, Users, Settings, 
  MessageSquare, Plus, TrendingUp, Clock, CheckCircle,
  Search, Menu, Bell, ChevronRight
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'training';
  conversations: number;
  satisfaction: number;
  lastActive: string;
}

const Dashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const agents: Agent[] = [
    { id: '1', name: 'Customer Support Bot', status: 'active', conversations: 1234, satisfaction: 4.8, lastActive: '2 min ago' },
    { id: '2', name: 'Sales Assistant', status: 'active', conversations: 856, satisfaction: 4.6, lastActive: '5 min ago' },
    { id: '3', name: 'Technical Support', status: 'training', conversations: 0, satisfaction: 0, lastActive: 'Never' },
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'integrations':
        return <IntegrationHub />;
      case 'agents':
        return <AgentBuilder />;
      default:
        return <DashboardOverview agents={agents} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} border-r bg-card transition-all duration-200`}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            {!sidebarCollapsed && (
              <>
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">C</span>
                </div>
                <span className="text-xl font-bold">Chatbase</span>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="w-4 h-4" />
                {!sidebarCollapsed && <span className="ml-2">{item.label}</span>}
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {sidebarItems.find(item => item.id === activeView)?.label || 'Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {activeView === 'overview' && 'Monitor and manage your AI agents'}
                {activeView === 'agents' && 'Create and configure your AI agents'}
                {activeView === 'analytics' && 'Track performance and insights'}
                {activeView === 'integrations' && 'Connect your agents to any platform'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      {/* Chat Widget */}
      <ChatWidget isOpen={chatWidgetOpen} onToggle={() => setChatWidgetOpen(!chatWidgetOpen)} />
    </div>
  );
};

const DashboardOverview = ({ agents }: { agents: Agent[] }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +1 this month
              </p>
            </div>
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Conversations</p>
              <p className="text-2xl font-bold">2,090</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% today
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
              <p className="text-2xl font-bold">4.7</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +0.2 this week
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="text-2xl font-bold">1.2s</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                -0.3s improved
              </p>
            </div>
            <Clock className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-auto p-4 flex flex-col items-center gap-2">
            <Plus className="w-6 h-6" />
            <span>Create New Agent</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Plug className="w-6 h-6" />
            <span>Add Integration</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            <span>View Analytics</span>
          </Button>
        </div>
      </Card>

      {/* Agents List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your AI Agents</h3>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </div>

        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{agent.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'training' ? 'secondary' : 'outline'}>
                      {agent.status}
                    </Badge>
                    <span>•</span>
                    <span>{agent.conversations} conversations</span>
                    <span>•</span>
                    <span>⭐ {agent.satisfaction}/5.0</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{agent.lastActive}</span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New conversation started', agent: 'Customer Support Bot', time: '2 min ago', type: 'conversation' },
            { action: 'Agent training completed', agent: 'Sales Assistant', time: '1 hour ago', type: 'training' },
            { action: 'Integration added', agent: 'Website Chat', time: '3 hours ago', type: 'integration' },
            { action: 'Performance threshold reached', agent: 'Customer Support Bot', time: '1 day ago', type: 'milestone' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                {activity.type === 'conversation' && <MessageSquare className="w-4 h-4 text-primary" />}
                {activity.type === 'training' && <Bot className="w-4 h-4 text-primary" />}
                {activity.type === 'integration' && <Plug className="w-4 h-4 text-primary" />}
                {activity.type === 'milestone' && <CheckCircle className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.agent}</p>
              </div>
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;