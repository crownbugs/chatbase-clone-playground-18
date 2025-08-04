import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Users, TrendingUp, Plus } from "lucide-react";

const MainDashboard = () => {
  const stats = [
    {
      title: "Total Agents",
      value: "0",
      description: "AI chatbots created",
      icon: Bot,
    },
    {
      title: "Conversations",
      value: "0",
      description: "Total conversations",
      icon: MessageSquare,
    },
    {
      title: "Active Users",
      value: "0",
      description: "Users this month",
      icon: Users,
    },
    {
      title: "Satisfaction",
      value: "0%",
      description: "Average rating",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your AI chatbot management platform
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Set up your first AI chatbot in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once Supabase is configured, you'll be able to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Create your first AI agent</li>
            <li>Train it with your data</li>
            <li>Embed it on your website</li>
            <li>Monitor conversations and analytics</li>
          </ul>
          <Button className="w-full" disabled>
            Setup Required
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainDashboard;