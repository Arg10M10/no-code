import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiKeySettings from "@/components/ApiKeySettings";

type Section = "general" | "ai" | "api" | "integrations" | "danger";

interface SettingsContentProps {
  section: Section;
}

const SectionGeneral = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">General</h3>
      <div className="grid gap-4">
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
    </div>
  );
};

const SectionAI = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">AI Settings</h3>
      <div className="grid gap-4">
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
    </div>
  );
};

const SectionIntegrations = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Integrations <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      </h3>
      <p className="text-sm text-muted-foreground">
        Integrations are available on the Pro plan.
      </p>
      <Button size="sm" onClick={() => navigate("/pricing")}>
        Upgrade to Pro
      </Button>
    </div>
  );
};

const SectionDanger = () => {
  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
      <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
        Delete Account
      </Button>
    </div>
  );
};

const SettingsContent: React.FC<SettingsContentProps> = ({ section }) => {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-6">
        {section === "general" && <SectionGeneral />}
        {section === "ai" && <SectionAI />}
        {section === "api" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <ApiKeySettings />
          </div>
        )}
        {section === "integrations" && <SectionIntegrations />}
        {section === "danger" && <SectionDanger />}
      </div>
    </div>
  );
};

export default SettingsContent;