import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "./Navbar";
import MainDashboard from "./MainDashboard";
import AgentsManager from "./AgentsManager";
import AnalyticsDashboard from "./AnalyticsDashboard";
import IntegrationHub from "./IntegrationHub";
import Settings from "./Settings";
import ChatWidget from "./ChatWidget";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load the first active agent for the chat widget
  useEffect(() => {
    if (user) {
      loadActiveAgent();
    }
  }, [user]);

  const loadActiveAgent = async () => {
    try {
      const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (data) {
        setActiveAgent(data.id);
      }
    } catch (error) {
      console.log('No active agents found');
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const toggleChatWidget = () => {
    setShowChatWidget(!showChatWidget);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <MainDashboard onNavigate={handleNavigate} />;
      case 'agents':
        return <AgentsManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'integrations':
        return <IntegrationHub />;
      case 'settings':
        return <Settings />;
      default:
        return <MainDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      
      <main className="container mx-auto px-4 py-6">
        {renderCurrentPage()}
      </main>

      {/* Chat Widget - Only show if user has active agents */}
      {activeAgent && (
        <ChatWidget
          isOpen={showChatWidget}
          onToggle={toggleChatWidget}
          agentId={activeAgent}
        />
      )}
    </div>
  );
};

export default AppLayout;
