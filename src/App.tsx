import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import MainDashboard from "@/components/MainDashboard";
import AgentsManager from "@/components/AgentsManager";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import IntegrationHub from "@/components/IntegrationHub";
import Settings from "@/components/Settings";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<MainDashboard />} />
              <Route path="agents" element={<AgentsManager />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="integrations" element={<IntegrationHub />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat/:chatbotId" element={<Chat />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
