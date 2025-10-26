"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Project, getAllProjects, updateProjectName, deleteProject } from "@/lib/projects";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Check, X, Trash2 } from "lucide-react";

interface RecentProjectsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const RecentProjectsSheet: React.FC<RecentProjectsSheetProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(getAllProjects());
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const openProject = (id: string) => {
    navigate(`/editor?id=${id}`);
    onOpenChange(false);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEditing = () => {
    if (editingId && editingName.trim()) {
      updateProjectName(editingId, editingName.trim());
      setProjects(getAllProjects());
      cancelEditing();
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setProjects(getAllProjects());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveEditing();
    } else if (event.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Proyectos Recientes</SheetTitle>
          <SheetDescription>
            Selecciona un proyecto para continuar o gestiona tus proyectos existentes.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-3 py-4">
              {projects.length > 0 ? (
                projects
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-md border p-3 transition-shadow duration-200 hover:shadow-sm"
                    >
                      <div
                        className="flex-grow cursor-pointer"
                        onClick={() => (editingId ? null : openProject(p.id))}
                      >
                        {editingId === p.id ? (
                          <Input
                            ref={inputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={cancelEditing}
                            className="h-8"
                          />
                        ) : (
                          <>
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Creado{" "}
                              {formatDistanceToNow(new Date(p.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        {editingId === p.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveEditing}
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelEditing}
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEditing(p.id, p.name)}
                            >
                              <Pencil className="h-4 w-4" />
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
                                  <AlertDialogTitle>
                                    ¿Estás seguro?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará
                                    permanentemente tu proyecto y sus datos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProject(p.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    No tienes proyectos recientes.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecentProjectsSheet;