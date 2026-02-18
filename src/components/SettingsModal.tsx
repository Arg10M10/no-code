import React from "react";
import { Settings, SlidersHorizontal, Cpu, Key, Plug, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SettingsContent from "@/components/SettingsContent";

type Section = "general" | "ai" | "api" | "integrations" | "danger";

const SettingsModal: React.FC = () => {
  const [section, setSection] = React.useState<Section>("general");

  const items: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: "general", label: "General", icon: SlidersHorizontal },
    { key: "ai", label: "AI", icon: Cpu },
    { key: "api", label: "API Keys", icon: Key },
    { key: "integrations", label: "Integrations", icon: Plug },
    { key: "danger", label: "Danger Zone", icon: ShieldAlert },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-2 -mr-1 sm:mr-0 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[1000px] h-[80vh] flex flex-col p-0 gap-0 border-white/10 bg-background/95 backdrop-blur-xl sm:rounded-xl overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/40 space-y-1 shrink-0">
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>Configure your experience and connections</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          <aside className="hidden sm:flex w-64 border-r border-border/40 p-3 flex-col gap-1 overflow-y-auto shrink-0 bg-muted/20">
            {items.map((it) => {
              const Icon = it.icon;
              const active = section === it.key;
              return (
                <Button
                  key={it.key}
                  variant="ghost"
                  className={[
                    "justify-start h-10 px-3 font-medium",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  ].join(" ")}
                  onClick={() => setSection(it.key)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {it.label}
                </Button>
              );
            })}
          </aside>

          {/* Mobile navigation (simplified, horizontal on top if sidebar hidden) */}
          <div className="sm:hidden border-b border-border/40 overflow-x-auto whitespace-nowrap p-2 flex gap-2 shrink-0 bg-muted/20">
             {items.map((it) => {
              const Icon = it.icon;
              const active = section === it.key;
              return (
                <Button
                  key={it.key}
                  variant="ghost"
                  size="sm"
                  className={[
                    "h-8",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground",
                  ].join(" ")}
                  onClick={() => setSection(it.key)}
                >
                  <Icon className="h-3.5 w-3.5 mr-2" />
                  {it.label}
                </Button>
              );
            })}
          </div>

          <main className="flex-1 overflow-y-auto bg-background/50">
            <SettingsContent section={section} />
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;