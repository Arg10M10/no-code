import React from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import SettingsContent from "@/components/SettingsContent";

const SettingsModal: React.FC = () => {
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
          "sm:max-w-[900px] w-[95vw] max-h-[85vh] overflow-y-auto",
          "border border-white/10",
          "bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50",
          "shadow-2xl",
        ].join(" ")}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>Configura tu experiencia y conexiones</DialogDescription>
        </DialogHeader>
        <div className="pt-2 pb-2">
          <SettingsContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;