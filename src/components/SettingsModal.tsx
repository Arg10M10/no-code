import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "lucide-react";

const SettingsModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </DialogTrigger>

      <DialogContent
        className={[
          // Fixed desktop size, constrained on small viewports
          "w-[720px] max-w-[96vw] h-[560px] max-h-[90vh] p-0",
          "border border-white/10 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50",
          "flex flex-col",
        ].join(" ")}
      >
        <Tabs defaultValue="general" className="flex flex-col h-full">
          {/* Fixed-height header so tabs/buttons don't change the overall modal height */}
          <DialogHeader className="p-4 border-b flex-shrink-0 h-28">
            <DialogTitle>Configuración</DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia y gestiona tu cuenta.
            </DialogDescription>

            <TabsList className="grid w-full grid-cols-3 mt-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Apariencia</TabsTrigger>
              <TabsTrigger value="about">Acerca de</TabsTrigger>
            </TabsList>
          </DialogHeader>

          {/* Content area fills remaining space and is scrollable to avoid resizing */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 min-h-full">
                <TabsContent value="general">
                  <h3 className="text-lg font-medium">General</h3>
                  <p className="text-sm text-muted-foreground">
                    Configuración general de la cuenta.
                  </p>
                </TabsContent>

                <TabsContent value="appearance">
                  <h3 className="text-lg font-medium">Apariencia</h3>
                  <p className="text-sm text-muted-foreground">
                    Personaliza la apariencia de la aplicación.
                  </p>
                </TabsContent>

                <TabsContent value="about">
                  <h3 className="text-lg font-medium">Acerca de</h3>
                  <p className="text-sm text-muted-foreground">
                    Información sobre la aplicación.
                  </p>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;