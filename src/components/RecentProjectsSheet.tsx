"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listProjects, Project, renameProject, deleteProject } from "@/lib/projects";
import { useNavigate } from "react-router-dom";
import { FileText, Edit, Check, X, Trash2, Menu } from "lucide-react";

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
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Proyectos Recientes</SheetTitle>
          <SheetDescription>
            Selecciona un proyecto para continuar o crea uno nuevo.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-4">
          <div className="space-y-3">
            {projects
              .sort((a, b) => b.updatedAt - a.updatedAt) // Sort by updatedAt
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border p-3 transition-shadow duration-200 hover:shadow-sm"
                >
                  <div 
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                    onClick={() => (editingId ? null : openProject(p.id))}
                  >
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      {editingId === p.id ? (
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveNewName()}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <p className="font-medium truncate" title={p.name}>{p.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Última edición: {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {editingId === p.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveNewName}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
        <SheetFooter className="pt-4">
          {/* Footer content can go here if needed */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RecentProjectsSheet;