"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Cog, KeyRound, Bot, Palette, Info } from "lucide-react";
import { useState } from "react";
import GeneralSettings from "./GeneralSettings";
import AISettings from "./AISettings";
import APIKeysSettings from "./APIKeysSettings";
import AboutSettings from "./AboutSettings";
import TransitionPanel from "./TransitionPanel";
import AppearanceSettings from "./AppearanceSettings";

const items = [
  { key: "general", label: "General", icon: Cog, component: GeneralSettings },
  { key: "appearance", label: "Apariencia", icon: Palette, component: AppearanceSettings },
  { key: "ai", label: "IA", icon: Bot, component: AISettings },
  { key: "api-keys", label: "API Keys", icon: KeyRound, component: APIKeysSettings },
  { key: "about", label: "Acerca de", icon: Info, component: AboutSettings },
];

export default function SettingsModal() {
  const [section, setSection] = useState("general");

  const CurrentComponent = items.find((it) => it.key === section)?.component;
  const currentLabel = items.find((it) => it.key === section)?.label;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Cog />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={[
          // Ancho grande y altura moderada (ancha, no larga)
          "w-[96vw] sm:max-w-[1100px] max-w-[1200px] h-[78vh] p-0",
        ].join(" ")}
      >
        <div className="flex flex-col sm:flex-row h-full">
          <aside className="sm:w-56 shrink-0">
            <div className="p-4 border-b sm:border-b-0 sm:border-r h-full">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {items.map((it) => {
                  const Icon = it.icon;
                  const active = section === it.key;
                  return (
                    <Button
                      key={it.key}
                      variant={active ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => setSection(it.key)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {it.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-y-auto">
            <TransitionPanel key={section}>
              <DialogHeader className="p-4 border-b">
                <DialogTitle>{currentLabel}</DialogTitle>
                <DialogDescription>
                  Ajusta la configuración de la aplicación.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                {CurrentComponent && <CurrentComponent />}
              </div>
            </TransitionPanel>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}