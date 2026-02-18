import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Lock, Monitor, Moon, Sun, CreditCard, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiKeySettings from "@/components/ApiKeySettings";

export type Section = "general" | "profile" | "billing" | "appearance" | "notifications" | "ai" | "api" | "integrations" | "danger";

interface SettingsContentProps {
  section: Section;
}

const SectionProfile = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-medium">Profile</h3>
      <p className="text-sm text-muted-foreground">Manage your public profile and personal details.</p>
    </div>
    <Separator />
    <div className="space-y-4 max-w-md">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-muted-foreground">
          JP
        </div>
        <Button variant="outline" size="sm">Change Avatar</Button>
      </div>
      <div className="grid gap-2">
        <Label>Display Name</Label>
        <Input placeholder="John Doe" />
      </div>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input placeholder="john@example.com" disabled />
        <p className="text-[0.8rem] text-muted-foreground">Managed via GitHub</p>
      </div>
    </div>
  </div>
);

const SectionAppearance = () => (
   <div className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-medium">Appearance</h3>
      <p className="text-sm text-muted-foreground">Customize the look and feel of the application.</p>
    </div>
    <Separator />
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label className="mb-2">Theme Preference</Label>
        <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-accent hover:border-primary/50 cursor-pointer transition-all border-primary bg-primary/5">
                <Monitor className="h-6 w-6" />
                <span className="text-xs font-medium">System</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-accent hover:border-primary/50 cursor-pointer transition-all">
                <Sun className="h-6 w-6" />
                <span className="text-xs font-medium">Light</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-accent hover:border-primary/50 cursor-pointer transition-all">
                <Moon className="h-6 w-6" />
                <span className="text-xs font-medium">Dark</span>
            </div>
        </div>
      </div>
      <div className="flex items-center justify-between max-w-md">
        <div className="space-y-0.5">
          <Label>Reduced Motion</Label>
          <p className="text-xs text-muted-foreground">Reduce animations for accessibility</p>
        </div>
        <Switch />
      </div>
    </div>
  </div>
);

const SectionNotifications = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-medium">Notifications</h3>
      <p className="text-sm text-muted-foreground">Configure how you receive alerts.</p>
    </div>
    <Separator />
    <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-xs text-muted-foreground">Receive updates about your projects</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Project Generation</Label>
            <p className="text-xs text-muted-foreground">Notify when AI completes a task</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marketing</Label>
            <p className="text-xs text-muted-foreground">News about features and plans</p>
          </div>
          <Switch />
        </div>
    </div>
  </div>
);

const SectionBilling = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium">Billing & Plans</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      <Separator />
      
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold">Free Plan</h4>
                    <p className="text-sm text-muted-foreground">Currently active</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-bold">$0<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            </div>
        </div>
        <div className="space-y-2 mb-6">
            <div className="text-sm flex justify-between">
                <span>Credits used</span>
                <span className="font-medium">1,250 / 10,000</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[12.5%] rounded-full" />
            </div>
        </div>
        <Button className="w-full" onClick={() => navigate("/pricing")}>Upgrade to Pro</Button>
      </div>
    </div>
  );
};

const SectionGeneral = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium">General</h3>
        <p className="text-sm text-muted-foreground">Basic settings for your workspace.</p>
      </div>
      <Separator />
      <div className="grid gap-4 max-w-md">
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
          <div className="space-y-0.5">
            <Label htmlFor="auto-update">Auto-update</Label>
            <p className="text-xs text-muted-foreground">Keep the app up to date automatically</p>
          </div>
          <Switch id="auto-update" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Version</span>
            <span className="text-sm font-mono bg-secondary px-2 py-0.5 rounded">v1.2.0</span>
        </div>
      </div>
    </div>
  );
};

const SectionAI = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium">AI Configuration</h3>
        <p className="text-sm text-muted-foreground">Fine-tune how the AI behaves.</p>
      </div>
      <Separator />
      <div className="grid gap-4 max-w-md">
        <div className="grid gap-2">
          <Label htmlFor="reasoning-size">Reasoning Depth</Label>
          <Select defaultValue="default">
            <SelectTrigger id="reasoning-size" className="w-full">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Fast (Compact)</SelectItem>
              <SelectItem value="default">Balanced (Default)</SelectItem>
              <SelectItem value="extended">Deep (Extended)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[0.8rem] text-muted-foreground">Controls the length of the internal reasoning process.</p>
        </div>
      </div>
    </div>
  );
};

const SectionIntegrations = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-fade-in">
       <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">Connect with third-party tools.</p>
      </div>
      <Separator />
      <div className="p-4 border border-dashed rounded-lg text-center space-y-3">
         <div className="mx-auto h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
         </div>
         <div>
            <h4 className="font-medium">Pro Feature</h4>
            <p className="text-sm text-muted-foreground">GitHub, Figma, and Vercel integrations are available on Pro.</p>
         </div>
         <Button size="sm" onClick={() => navigate("/pricing")}>
            Upgrade to Pro
         </Button>
      </div>
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Irreversible actions.</p>
      </div>
      <Separator />
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
        <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
            Delete Account
        </Button>
      </div>
    </div>
  );
};

const SettingsContent: React.FC<SettingsContentProps> = ({ section }) => {
  return (
    <div className="p-6 h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-10">
            {section === "general" && <SectionGeneral />}
            {section === "profile" && <SectionProfile />}
            {section === "appearance" && <SectionAppearance />}
            {section === "notifications" && <SectionNotifications />}
            {section === "billing" && <SectionBilling />}
            {section === "ai" && <SectionAI />}
            {section === "api" && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-medium">API Keys</h3>
                        <p className="text-sm text-muted-foreground">Manage your connection to LLM providers.</p>
                    </div>
                    <Separator />
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