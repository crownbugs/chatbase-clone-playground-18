import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

      {/* Demo Chat Widget */}
      <ChatWidget
        isOpen={showChatWidget}
        onToggle={toggleChatWidget}
        agentId="demo"
      />
    </div>
  );
};

export default AppLayout;