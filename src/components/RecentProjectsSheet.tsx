"use client";

import React from "react";
import { Menu, Pencil, Check, X, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

type Project = {
  id: string;
  name: string;
  updatedAt: number;
};

const STORAGE_KEY = "recent-projects";

const RecentProjectsSheet: React.FC = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draftName, setDraftName] = React.useState<string>("");

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Project[] = raw ? JSON.parse(raw) : [];
    setProjects(parsed);
  }, []);

  const persist = (next: Project[]) => {
    setProjects(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const startEdit = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setDraftName(p.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = draftName.trim();
    const next = projects.map((p) =>
      p.id === editingId ? { ...p, name: name || p.name, updatedAt: Date.now() } : p
    );
    persist(next);
    cancelEdit();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir proyectos recientes">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Proyectos Recientes</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay nada</p>
              ) : (
                projects
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      {editingId === p.id ? (
                        <div className="flex w-full items-center gap-2">
                          <Input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={saveEdit}
                            aria-label="Guardar nombre"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEdit}
                            aria-label="Cancelar edición"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Actualizado: {new Date(p.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEdit(p.id)}
                            aria-label="Editar proyecto"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecentProjectsSheet;