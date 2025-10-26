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
    { key: "ai", label: "IA", icon: Cpu },
    { key: "api", label: "API Keys", icon: Key },
    { key: "integrations", label: "Integraciones", icon: Plug },
    { key: "danger", label: "Zona de riesgo", icon: ShieldAlert },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-2 -mr-1 sm:mr-0 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Abrir configuración"
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent
        className={[
          // Ancho grande y altura moderada (ancha, no larga)
          "w-[96vw] sm:max-w-[1100px] max-w-[1200px] max-h-[78vh] p-0",
          // Efecto cristal
          "border border-white/10 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50",
          "shadow-2xl",
        ].join(" ")}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>Configura tu experiencia y conexiones</DialogDescription>
        </DialogHeader>

        {/* Layout principal: sidebar + contenido */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Sidebar: lista de botones */}
            <aside className="sm:w-56 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {items.map((it) => {
                  const Icon = it.icon;
                  const active = section === it.key;
                  return (
                    <Button
                      key={it.key}
                      variant="ghost"
                      className={[
                        "justify-start h-9",
                        // estados
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        // quitar efectos azules de foco
                        "focus-visible:ring-0 focus-visible:ring-offset-0",
                      ].join(" ")}
                      onClick={() => setSection(it.key)}
                      aria-pressed={active}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {it.label}
                    </Button>
                  );
                })}
              </div>
            </aside>

            {/* Contenido: solo scroll en el panel derecho */}
            <section className="flex-1 overflow-y-auto max-h-[58vh] rounded-md">
              <SettingsContent section={section} />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;