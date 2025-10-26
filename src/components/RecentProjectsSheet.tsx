"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listProjects, Project, renameProject, deleteProject } from "@/lib/projects";
import { useNavigate } from "react-router-dom";
import { FileText, Edit, Trash2, Menu, MoreVertical, Check, X, FolderOpen } from "lucide-react";

// Función para limitar el nombre a 10 vocales
const limitByVowels = (name: string, maxVowels: number = 10): string => {
  const vowels = 'aeiouAEIOU';
  let vowelCount = 0;
  let truncatedName = '';

  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    truncatedName += char;
    if (vowels.includes(char)) {
      vowelCount++;
      if (vowelCount >= maxVowels) {
        // Si el nombre es más largo que el truncado, añadimos puntos suspensivos
        return i < name.length - 1 ? truncatedName.trim() + '...' : truncatedName;
      }
    }
  }
  return truncatedName;
};

const RecentProjectsSheet: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSheetOpen) {
      setProjects(listProjects());
    }
  }, [isSheetOpen]);

  const openProject = (id: string) => {
    navigate(`/editor?id=${id}`);
    setIsSheetOpen(false);
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setNewName(project.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewName("");
  };

  const saveNewName = () => {
    if (editingId && newName.trim()) {
      renameProject(editingId, newName.trim());
      setProjects(listProjects()); // Refresh the list
      cancelEditing();
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setProjects(listProjects());
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="p-2 -ml-1 sm:ml-0 rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Open recent projects"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Proyectos Recientes</SheetTitle>
          <SheetDescription>
            Selecciona un proyecto para continuar o crea uno nuevo.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-4">
          <div className="p-4 space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada por aquí todavía.</p>
            ) : (
              projects
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3 transition-shadow duration-200 hover:shadow-sm"
                  >
                    {editingId === p.id ? (
                      <div className="flex w-full items-center gap-2">
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveNewName()}
                          autoFocus
                          className="h-8 flex-1"
                        />
                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={saveNewName}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => openProject(p.id)}
                        >
                          <p className="font-medium truncate text-sm" title={p.name}>
                            {limitByVowels(p.name)}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openProject(p.id)}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Abrir Proyecto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startEditing(p)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Renombrar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()} // Prevent dropdown close on trigger click
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente tu
                                    proyecto y todos sus datos asociados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProject(p.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RecentProjectsSheet;