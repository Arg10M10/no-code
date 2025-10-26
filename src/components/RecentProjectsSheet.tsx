"use client";

import React from "react";
import { Menu, Pencil, Check, X, Folder, Search, Plus } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

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
  const [showSearch, setShowSearch] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const inputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Project[] = raw ? JSON.parse(raw) : [];
    setProjects(parsed);
  }, []);

  React.useEffect(() => {
    if (showSearch) inputRef.current?.focus();
  }, [showSearch]);

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

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const onNewChat = () => {
    navigate("/");
  };

  const onToggleSearch = () => {
    setShowSearch((s) => {
      const next = !s;
      if (!next) setSearchQuery("");
      return next;
    });
  };

  const openProject = (id: string) => {
    navigate(`/editor?id=${encodeURIComponent(id)}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open recent chats"
          className="ml-[-8px] sm:ml-[-10px] transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Recent Chats</SheetTitle>
          </SheetHeader>

          <div className="p-3 border-b space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onNewChat}
              className="w-full h-9 rounded-lg justify-start gap-3 border text-foreground bg-background hover:bg-accent transition-all duration-200 ease-out hover:translate-x-[1px] active:translate-x-0"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-200">
                <Plus className="h-3.5 w-3.5" />
              </span>
              New Chat
            </Button>

            <div className="relative h-9">
              <div
                className={[
                  "absolute inset-0 flex",
                  "transition-all duration-200 ease-out",
                  showSearch ? "opacity-0 -translate-y-1 pointer-events-none" : "opacity-100 translate-y-0 pointer-events-auto",
                ].join(" ")}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleSearch}
                  className="w-full h-9 rounded-lg justify-start gap-3 border text-foreground bg-background hover:bg-accent transition-all duration-200 ease-out hover:translate-x-[1px] active:translate-x-0"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-200">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  Search chats
                </Button>
              </div>

              <div
                className={[
                  "absolute inset-0 flex items-center gap-2",
                  "transition-all duration-200 ease-out",
                  showSearch ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none",
                ].join(" ")}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-opacity" />
                  <Input
                    ref={inputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="h-9 pl-8 rounded-lg transition-[box-shadow,background-color] duration-200 focus:shadow-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 transition-transform duration-200 ease-out hover:scale-105 active:scale-95 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={onToggleSearch}
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing here yet</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chats match your search</p>
              ) : (
                filtered
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-md border p-3 transition-shadow duration-200 hover:shadow-sm cursor-pointer"
                      onClick={() => (editingId ? null : openProject(p.id))}
                    >
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      {editingId === p.id ? (
                        <div className="flex w-full items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                            aria-label="Save name"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEdit}
                            aria-label="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Updated: {new Date(p.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 transition-transform duration-200 hover:scale-105 active:scale-95 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(p.id);
                            }}
                            aria-label="Edit project"
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