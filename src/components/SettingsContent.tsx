import React, { useState, useEffect } from "react";
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
import { Monitor, Moon, Sun, CreditCard, Lock, AlertTriangle, Check, BrainCircuit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApiKeySettings from "@/components/ApiKeySettings";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";

export type Section = "general" | "billing" | "appearance" | "ai" | "api" | "integrations" | "danger";

interface SettingsContentProps {
  section: Section;
}

const THEME_KEY = "app-theme";
const REDUCED_MOTION_KEY = "reduced-motion";
type Theme = "light"; // Only 'light' is allowed now

const SectionAppearance = () => {
  // Default to Light theme, and only allow Light
  const [theme, setTheme] = useState<Theme>(() => "light"); // Always 'light'
  const [reducedMotion, setReducedMotion] = useState(() => storage.getJSON<boolean>(REDUCED_MOTION_KEY, false));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark"); // Remove both to ensure only 'light' is applied
    root.classList.add("light"); // Always apply light theme
    storage.setJSON(THEME_KEY, "light"); // Persist 'light' as the only theme
  }, [theme]); // theme dependency is kept for consistency, though it will always be 'light'

  useEffect(() => {
    storage.setJSON(REDUCED_MOTION_KEY, reducedMotion);
    if (reducedMotion) {
      document.documentElement.classList.add("motion-reduce");
    } else {
      document.documentElement.classList.remove("motion-reduce");
    }
  }, [reducedMotion]);

  return (
   <div className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-medium">Appearance</h3>
      <p className="text-sm text-muted-foreground">Customize the look and feel of the application.</p>
    </div>
    <Separator />
    <div className="space-y-6">
      <div className="grid gap-3">
        <Label className="text-base">Theme</Label>
        <p className="text-xs text-muted-foreground mb-2">Select your preferred interface theme.</p>
        <div className="grid grid-cols-1 gap-4 max-w-lg"> {/* Only one column for light theme */}
            <button 
                // This button will always be "selected" as it's the only option
                className={cn(
                    "flex flex-col items-center gap-2 p-4 border rounded-xl cursor-default", // cursor-default as it's not interactive
                    "border-primary bg-primary/5 text-primary" // Always styled as selected
                )}
            >
                <Sun className="h-6 w-6" />
                <span className="text-xs font-medium">Light</span>
            </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between max-w-lg p-4 rounded-lg border bg-card/50">
        <div className="space-y-0.5">
          <Label className="text-base">Reduced Motion</Label>
          <p className="text-xs text-muted-foreground">Minimize animations for a more static experience.</p>
        </div>
        <Switch 
            checked={reducedMotion} 
            onCheckedChange={setReducedMotion} 
        />
      </div>
    </div>
  </div>
)};

const SectionBilling = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium">Billing & Plans</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>
      <Separator />
      
      <div className="rounded-xl border bg-card p-6 shadow-sm max-w-2xl">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
            <p className="text-xs text-muted-foreground">Credits reset in 14 days.</p>
        </div>
        <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate("/pricing")}>Upgrade to Pro</Button>
            <Button variant="outline" className="flex-1">Manage Billing</Button>
        </div>
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
      <div className="grid gap-6 max-w-lg">
        <div className="grid gap-2">
          <Label>Language</Label>
          <div className="h-10 w-full px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground flex items-center justify-between">
             English (United States)
             <Lock className="h-3 w-3 opacity-50" />
          </div>
          <p className="text-[0.8rem] text-muted-foreground">System language is currently locked to English.</p>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
          <div className="space-y-0.5">
            <Label>Auto-update</Label>
            <p className="text-xs text-muted-foreground">Keep the app up to date automatically</p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Version</span>
            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded border">v2.4.0-beta</span>
        </div>
      </div>
    </div>
  );
};

const SectionAI = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium">AI Intelligence</h3>
        <p className="text-sm text-muted-foreground">Configure model behavior and reasoning capabilities.</p>
      </div>
      <Separator />
      
      <div className="grid gap-6 max-w-2xl">
         <div className="rounded-xl border bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-background p-6">
            <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <BrainCircuit className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4 flex-1">
                    <div>
                        <h4 className="font-semibold text-foreground">Reasoning Depth</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Controls how much "thought" the AI puts into planning before writing code.
                        </p>
                    </div>
                    
                    <Select defaultValue="default">
                        <SelectTrigger className="w-full bg-background/50">
                        <SelectValue placeholder="Select depth" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="compact">
                            <span className="font-medium">Fast (Compact)</span> - Good for small tweaks
                        </SelectItem>
                        <SelectItem value="default">
                            <span className="font-medium">Balanced (Default)</span> - Recommended
                        </SelectItem>
                        <SelectItem value="extended">
                            <span className="font-medium">Deep (Extended)</span> - For complex architectures
                        </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
         </div>

         <div className="space-y-4">
            <h4 className="text-sm font-medium">Beta Features</h4>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                        Visual Component Mapping
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">New</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">AI identifies existing UI components from screenshots.</p>
                </div>
                <Switch />
            </div>
         </div>
      </div>
    </div>
  );
};

const SectionIntegrations = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div>
        <h3 className="text-lg font-medium">Integrations</h3>
        <p className="text-sm text-muted-foreground">Connect with third-party tools.</p>
      </div>
      <Separator />
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20">
         <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Lock className="h-5 w-5 text-muted-foreground" />
         </div>
         <h4 className="text-lg font-semibold mb-2">Coming Soon</h4>
         <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            We are working on native integrations for GitHub, Vercel, and Figma. Stay tuned for updates!
         </p>
         <Button variant="outline" disabled>Notify me when ready</Button>
      </div>
    </div>
  );
};

const SectionDanger = () => {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText === "DELETE";

  const handleDeleteAll = () => {
    if (isMatch) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Irreversible actions regarding your local data.</p>
      </div>
      <Separator />
      
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-4 flex-1">
                <div>
                    <h4 className="font-semibold text-destructive">Delete All Local Data</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        This will wipe all projects, chats, API keys, and settings stored in your browser's Local Storage. 
                        This action cannot be undone.
                    </p>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-xs">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
                    <div className="flex gap-3">
                        <Input 
                            value={confirmText} 
                            onChange={e => setConfirmText(e.target.value)}
                            className="bg-background max-w-[200px]"
                            placeholder="DELETE"
                        />
                        <Button 
                            variant="destructive" 
                            disabled={!isMatch}
                            onClick={handleDeleteAll}
                        >
                            {isMatch ? "Confirm Deletion" : "Delete All"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SettingsContent: React.FC<SettingsContentProps> = ({ section }) => {
  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto pb-10">
            {section === "general" && <SectionGeneral />}
            {section === "appearance" && <SectionAppearance />}
            {section === "billing" && <SectionBilling />}
            {section === "ai" && <SectionAI />}
            {section === "api" && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h3 className="text-lg font-medium">API Keys</h3>
                        <p className="text-sm text-muted-foreground">Manage your connections to LLM providers.</p>
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