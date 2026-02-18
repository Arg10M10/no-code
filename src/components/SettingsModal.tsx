import React from "react";
import { 
  Settings, SlidersHorizontal, Cpu, Key, Plug, ShieldAlert, 
  User, CreditCard, Bell, Palette
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SettingsContent, { Section } from "@/components/SettingsContent";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  trigger?: React.ReactNode;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ trigger }) => {
  const [section, setSection] = React.useState<Section>("general");
  const [open, setOpen] = React.useState(false);

  const groups = [
    {
      title: "Account",
      items: [
        { key: "profile", label: "Profile", icon: User },
        { key: "billing", label: "Billing & Plans", icon: CreditCard },
      ]
    },
    {
      title: "App Settings",
      items: [
        { key: "general", label: "General", icon: SlidersHorizontal },
        { key: "appearance", label: "Appearance", icon: Palette },
        { key: "notifications", label: "Notifications", icon: Bell },
      ]
    },
    {
      title: "Intelligence",
      items: [
        { key: "ai", label: "AI Models", icon: Cpu },
        { key: "api", label: "API Keys", icon: Key },
      ]
    },
    {
      title: "System",
      items: [
        { key: "integrations", label: "Integrations", icon: Plug },
        { key: "danger", label: "Danger Zone", icon: ShieldAlert },
      ]
    }
  ] as const;

  // Flattened list for mobile
  const allItems = groups.flatMap(g => g.items);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <button
            type="button"
            className="p-2 -mr-1 sm:mr-0 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[1000px] h-[85vh] flex flex-col p-0 gap-0 border-white/10 bg-background/95 backdrop-blur-xl sm:rounded-2xl overflow-hidden shadow-2xl">
        
        <div className="flex flex-1 min-h-0">
          {/* Sidebar Desktop */}
          <aside className="hidden md:flex w-64 border-r border-border/40 flex-col bg-muted/30">
            <div className="p-6 pb-2 shrink-0">
                <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your workspace</p>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                {groups.map((group) => (
                    <div key={group.title}>
                        <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = section === item.key;
                                return (
                                    <Button
                                        key={item.key}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "w-full justify-start h-9 px-3 font-medium transition-all",
                                            isActive 
                                              ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                        )}
                                        onClick={() => setSection(item.key as Section)}
                                    >
                                        <Icon className={cn("h-4 w-4 mr-3", isActive ? "text-primary" : "text-muted-foreground/70")} />
                                        {item.label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-4 border-t border-border/40 shrink-0">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">Demo User</p>
                        <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                    </div>
                </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0 bg-background/50">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-background/95 backdrop-blur z-10 shrink-0">
                <span className="font-semibold">Settings</span>
                {/* Mobile allows native close button of DialogContent */}
            </header>

            {/* Mobile Nav */}
            <div className="md:hidden border-b border-border/40 overflow-x-auto whitespace-nowrap p-2 flex gap-2 shrink-0 bg-muted/20">
             {allItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.key;
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 rounded-full px-4 border",
                    active
                      ? "bg-background border-border text-foreground shadow-sm"
                      : "border-transparent text-muted-foreground"
                  )}
                  onClick={() => setSection(item.key as Section)}
                >
                  <Icon className="h-3.5 w-3.5 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>

            <main className="flex-1 overflow-hidden relative">
                <SettingsContent section={section} />
            </main>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;