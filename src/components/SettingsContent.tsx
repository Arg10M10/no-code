import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Monitor, Moon, Sun, CreditCard, Lock, AlertTriangle, Check, BrainCircuit, Palette } from "lucide-react";
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
type Theme = "system" | "light" | "dark";

const SectionAppearance = () => {
  const [theme, setTheme] = useState<Theme>(() => storage.getJSON<Theme>(THEME_KEY, "system"));
  const [reducedMotion, setReducedMotion] = useState(() => storage.getJSON<boolean>(REDUCED_MOTION_KEY, false));

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    storage.setJSON(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    storage.setJSON(REDUCED_MOTION_KEY, reducedMotion);
    if (reducedMotion) {
      document.documentElement.classList.add("motion-reduce");
    } else {
      document.documentElement.classList.remove("motion-reduce");
    }
  }, [reducedMotion]);

  const themeOptions = [
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Oscuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ] as const;

  return (
   <div className="space-y-6 animate-fade-in">
    <div>
      <h3 className="text-lg font-medium">Apariencia</h3>
      <p className="text-sm text-muted-foreground">Personaliza el aspecto visual de la aplicación.</p>
    </div>
    <Separator />
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base">Tema de la interfaz</Label>
        <div className="grid grid-cols-3 gap-4 max-w-xl">
            {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                    <button 
                        key={opt.id}
                        onClick={() => setTheme(opt.id)}
                        className={cn(
                            "flex flex-col items-center gap-3 p-4 border rounded-xl transition-all hover:bg-accent/50",
                            isSelected 
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                                : "border-border bg-card text-muted-foreground"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-xs font-semibold">{opt.label}</span>
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </button>
                );
            })}
        </div>
      </div>
      
      <div className="flex items-center justify-between max-w-xl p-4 rounded-xl border bg-card/50">
        <div className="space-y-0.5">
          <Label className="text-base">Reducir movimiento</Label>
          <p className="text-xs text-muted-foreground">Minimiza las animaciones para una experiencia más estática.</p>
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
        <h3 className="text-lg font-medium">Planes y Facturación</h3>
        <p className="text-sm text-muted-foreground">Gestiona tu suscripción y métodos de pago.</p>
      </div>
      <Separator />
      
      <div className="rounded-xl border bg-card p-6 shadow-sm max-w-2xl">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold">Plan Gratuito</h4>
                    <p className="text-sm text-muted-foreground">Activo actualmente</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-bold">$0<span className="text-sm text-muted-foreground font-normal">/mes</span></div>
            </div>
        </div>
        <div className="space-y-2 mb-6">
            <div className="text-sm flex justify-between">
                <span>Créditos usados</span>
                <span className="font-medium">1,250 / 10,000</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[12.5%] rounded-full" />
            </div>
            <p className="text-xs text-muted-foreground">Los créditos se reinician en 14 días.</p>
        </div>
        <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate("/pricing")}>Mejorar a Pro</Button>
            <Button variant="outline" className="flex-1">Gestionar Facturación</Button>
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
        <p className="text-sm text-muted-foreground">Configuración básica de tu espacio de trabajo.</p>
      </div>
      <Separator />
      <div className="grid gap-6 max-w-lg">
        <div className="grid gap-2">
          <Label>Idioma</Label>
          <div className="h-10 w-full px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground flex items-center justify-between">
             Español (Latinoamérica)
             <Lock className="h-3 w-3 opacity-50" />
          </div>
          <p className="text-[0.8rem] text-muted-foreground">El idioma del sistema está actualmente bloqueado en español.</p>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
          <div className="space-y-0.5">
            <Label>Actualización automática</Label>
            <p className="text-xs text-muted-foreground">Mantener la aplicación actualizada automáticamente.</p>
          </div>
          <Switch defaultChecked />
        </div>
        
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Versión actual</span>
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
        <h3 className="text-lg font-medium">Inteligencia Artificial</h3>
        <p className="text-sm text-muted-foreground">Configura el comportamiento del modelo y sus capacidades.</p>
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
                        <h4 className="font-semibold text-foreground">Profundidad de Razonamiento</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Controla cuánto "piensa" la IA antes de escribir el código.
                        </p>
                    </div>
                    
                    <Select defaultValue="default">
                        <SelectTrigger className="w-full bg-background/50">
                        <SelectValue placeholder="Seleccionar profundidad" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="compact">
                            <span className="font-medium">Rápido (Compacto)</span> - Ideal para ajustes menores
                        </SelectItem>
                        <SelectItem value="default">
                            <span className="font-medium">Balanceado (Por defecto)</span> - Recomendado
                        </SelectItem>
                        <SelectItem value="extended">
                            <span className="font-medium">Profundo (Extendido)</span> - Para arquitecturas complejas
                        </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
         </div>

         <div className="space-y-4">
            <h4 className="text-sm font-medium">Funciones Beta</h4>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                        Mapeo Visual de Componentes
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">Nuevo</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">La IA identifica componentes existentes a partir de capturas de pantalla.</p>
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
        <h3 className="text-lg font-medium">Integraciones</h3>
        <p className="text-sm text-muted-foreground">Conecta con herramientas de terceros.</p>
      </div>
      <Separator />
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20">
         <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Lock className="h-5 w-5 text-muted-foreground" />
         </div>
         <h4 className="text-lg font-semibold mb-2">Próximamente</h4>
         <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Estamos trabajando en integraciones nativas para GitHub, Vercel y Figma. ¡Mantente al tanto!
         </p>
         <Button variant="outline" disabled>Notificarme cuando esté listo</Button>
      </div>
    </div>
  );
};

const SectionDanger = () => {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText === "ELIMINAR";

  const handleDeleteAll = () => {
    if (isMatch) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium text-destructive">Zona de Peligro</h3>
        <p className="text-sm text-muted-foreground">Acciones irreversibles relacionadas con tus datos locales.</p>
      </div>
      <Separator />
      
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-4 flex-1">
                <div>
                    <h4 className="font-semibold text-destructive">Borrar todos los datos locales</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Esto eliminará todos los proyectos, chats, claves API y configuraciones almacenadas en tu navegador.
                        Esta acción no se puede deshacer.
                    </p>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-xs">Escribe <span className="font-mono font-bold">ELIMINAR</span> para confirmar</Label>
                    <div className="flex gap-3">
                        <Input 
                            value={confirmText} 
                            onChange={e => setConfirmText(e.target.value)}
                            className="bg-background max-w-[200px]"
                            placeholder="ELIMINAR"
                        />
                        <Button 
                            variant="destructive" 
                            disabled={!isMatch}
                            onClick={handleDeleteAll}
                        >
                            {isMatch ? "Confirmar eliminación" : "Borrar todo"}
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
                        <h3 className="text-lg font-medium">Claves API</h3>
                        <p className="text-sm text-muted-foreground">Gestiona tus conexiones con proveedores de LLM.</p>
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