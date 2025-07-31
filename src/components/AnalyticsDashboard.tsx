import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, Users, MessageSquare, TrendingUp, 
  Calendar, Search, Filter, Download 
} from "lucide-react";

interface AnalyticsData {
  totalConversations: number;
  activeUsers: number;
  satisfaction: number;
  responseTime: number;
  conversationsToday: number;
  conversationsGrowth: number;
}

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalConversations: 0,
    activeUsers: 0,
    satisfaction: 0,
    responseTime: 0,
    conversationsToday: 0,
    conversationsGrowth: 0,
  });
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [topQuestions, setTopQuestions] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      // Get user's agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id);

      const agentIds = agents?.map(a => a.id) || [];

      if (agentIds.length === 0) {
        setLoading(false);
        return;
      }

      // Load conversations for user's agents
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*, messages(count)')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false });

      // Load messages for conversations
      const conversationIds = conversations?.map(c => c.id) || [];
      
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Calculate stats
      const totalConversations = conversations?.length || 0;
      const activeUsers = new Set(conversations?.map(c => c.visitor_id).filter(Boolean)).size;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const conversationsToday = conversations?.filter(c => 
        new Date(c.created_at) >= today
      )?.length || 0;

      // Mock satisfaction and response time for now
      const satisfaction = 94.5;
      const responseTime = 1.2;
      const conversationsGrowth = 12.5;

      setAnalyticsData({
        totalConversations,
        activeUsers,
        satisfaction,
        responseTime,
        conversationsToday,
        conversationsGrowth,
      });

      // Set recent conversations
      const recentConvs = conversations?.slice(0, 10).map(c => ({
        id: c.id,
        user: c.visitor_email || c.visitor_name || 'Anonymous',
        topic: messages?.find(m => m.conversation_id === c.id && m.type === 'user')?.content?.substring(0, 50) + '...' || 'No messages',
        time: new Date(c.created_at).toLocaleString(),
        status: c.status || 'ongoing'
      })) || [];

      setRecentConversations(recentConvs);

      // Mock top questions for now
      setTopQuestions([
        { question: 'How can I help you today?', count: messages?.filter(m => m.content?.toLowerCase().includes('help'))?.length || 0 },
        { question: 'What are your services?', count: messages?.filter(m => m.content?.toLowerCase().includes('service'))?.length || 0 },
        { question: 'How does this work?', count: messages?.filter(m => m.content?.toLowerCase().includes('how'))?.length || 0 },
        { question: 'Can you provide support?', count: messages?.filter(m => m.content?.toLowerCase().includes('support'))?.length || 0 },
        { question: 'Thank you', count: messages?.filter(m => m.content?.toLowerCase().includes('thank'))?.length || 0 }
      ].filter(q => q.count > 0));

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your AI agent performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['24h', '7d', '30d', '90d'].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Conversations</p>
              <p className="text-2xl font-bold">{analyticsData.totalConversations.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+{analyticsData.conversationsGrowth}%</span>
              </div>
            </div>
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{analyticsData.activeUsers.toLocaleString()}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+8.2%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Satisfaction Score</p>
              <p className="text-2xl font-bold">{analyticsData.satisfaction}%</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+2.1%</span>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold">{analyticsData.responseTime}s</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">-15.3%</span>
              </div>
            </div>
            <Calendar className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Conversations</h3>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {recentConversations.map((conversation) => (
              <div key={conversation.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                <div className="flex-1">
                  <p className="font-medium">{conversation.user}</p>
                  <p className="text-sm text-muted-foreground">{conversation.topic}</p>
                </div>
                <div className="text-right">
                  <Badge variant={conversation.status === 'resolved' ? 'secondary' : 'default'}>
                    {conversation.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{conversation.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Questions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Asked Questions</h3>
          <div className="space-y-4">
            {topQuestions.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{item.question}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(item.count / 50) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground ml-4">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Conversation Volume Over Time</h3>
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Chart visualization would go here</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;