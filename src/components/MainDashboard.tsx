import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, Users, TrendingUp, Bot, 
  Plus, BarChart3, Calendar, Activity
} from "lucide-react";

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  todayConversations: number;
  averageRating: number;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  _conversations_count?: number;
}

interface MainDashboardProps {
  onNavigate: (page: string) => void;
}

const MainDashboard = ({ onNavigate }: MainDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalConversations: 0,
    todayConversations: 0,
    averageRating: 0,
  });
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load agents
      const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Load conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*, agents!inner(user_id)')
        .eq('agents.user_id', user?.id);

      // Load analytics for ratings
      const { data: analytics } = await supabase
        .from('analytics')
        .select('event_data')
        .eq('event_type', 'conversation_rated');

      // Calculate stats
      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.is_active)?.length || 0;
      const totalConversations = conversations?.length || 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayConversations = conversations?.filter(c => 
        new Date(c.created_at) >= today
      )?.length || 0;

      // Calculate average rating from analytics
      const ratings = analytics?.map(a => {
        const data = a.event_data as any;
        return data?.rating;
      }).filter(r => r && typeof r === 'number') || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length 
        : 0;

      setStats({
        totalAgents,
        activeAgents,
        totalConversations,
        todayConversations,
        averageRating,
      });

      setRecentAgents(agents?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your AI agents today.
          </p>
        </div>
        <Button onClick={() => onNavigate('agents')} className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          Create New Agent
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{stats.totalAgents}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    {stats.activeAgents} active
                  </span>
                </div>
              </div>
              <Bot className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">
                    {stats.todayConversations} today
                  </span>
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">
                  {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}★` : 'N/A'}
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-muted-foreground">
                    Average rating
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.todayConversations * 30}</p>
                <div className="flex items-center mt-1">
                  <Activity className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-500">
                    Projected
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Agents</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onNavigate('agents')}>
                View All
              </Button>
            </div>
            <CardDescription>
              Your most recently created AI agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No agents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first AI agent to get started
                </p>
                <Button onClick={() => onNavigate('agents')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAgents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
                    <div className="flex-1">
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {agent.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created {formatDate(agent.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={agent.is_active ? "default" : "secondary"}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('agents')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Agent
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('integrations')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Integration Code
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => onNavigate('settings')}
            >
              <Users className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainDashboard;