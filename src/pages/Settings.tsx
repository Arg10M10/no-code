import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          
          <div className="grid gap-6 p-6 border border-border rounded-lg bg-card">
            {/* General Settings */}
            <div className="grid gap-4">
              <h3 className="font-medium leading-none">Settings</h3>
              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language" className="w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-update">Auto-update</Label>
                <Switch id="auto-update" defaultChecked />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span>v1.0.0</span>
              </div>
            </div>
            <Separator />
            
            {/* IA Settings */}
            <div className="grid gap-4">
              <h3 className="font-medium leading-none">IA Settings</h3>
              <div className="grid gap-2">
                <Label htmlFor="reasoning-size">Reasoning Size</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="reasoning-size" className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="extended">Extended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />

            {/* API Keys */}
            <div className="grid gap-4">
              <h3 className="font-medium leading-none">API Keys</h3>
              <div className="grid gap-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input id="openai-key" type="password" placeholder="sk-..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="google-key">Google API Key</Label>
                <Input id="google-key" type="password" placeholder="AIzaSy..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <Input id="anthropic-key" type="password" placeholder="sk-ant-..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                <Input id="openrouter-key" type="password" placeholder="sk-or-..." />
              </div>
            </div>
            <Separator />

            {/* Integrations */}
            <div className="grid gap-4">
              <h3 className="font-medium leading-none flex items-center gap-2">
                Integrations <Lock className="h-3 w-3 text-muted-foreground" />
              </h3>
              <div className="text-sm text-muted-foreground">
                Integrations are available on the Pro plan.
              </div>
              <Button size="sm" onClick={() => navigate("/pricing")}>
                Upgrade to Pro
              </Button>
            </div>
            <Separator />

            {/* Danger Zone */}
            <div className="grid gap-4">
              <h3 className="font-medium leading-none text-destructive">Danger Zone</h3>
              <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;