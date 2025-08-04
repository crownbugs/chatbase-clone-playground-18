import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your chatbot performance and user interactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Coming Soon</CardTitle>
          <CardDescription>
            Analytics dashboard will be available after Supabase setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features coming soon:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Conversation metrics</li>
            <li>User engagement analytics</li>
            <li>Performance insights</li>
            <li>Real-time monitoring</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;