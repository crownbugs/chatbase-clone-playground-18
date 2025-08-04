import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const [profile, setProfile] = useState({
    full_name: '',
    company: '',
    website: '',
    openai_api_key: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    toast({
      title: "Coming Soon",
      description: "Settings will be available after Supabase setup",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and API configurations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings Coming Soon</CardTitle>
          <CardDescription>
            User settings and configuration will be available after Supabase setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features coming soon: Profile management, API keys, billing, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;