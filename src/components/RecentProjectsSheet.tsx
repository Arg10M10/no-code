"use client";

import React from "react";
import { Menu, Pencil, Check, X, Folder, Search } from "lucide-react";
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

  const navigate = useNavigate();

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open recent projects">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Recent Projects</SheetTitle>
          </SheetHeader>

          <div className="p-3 border-b flex items-center gap-2">
            <Button size="sm" onClick={onNewChat}>
              New Chat
            </Button>
            {showSearch ? (
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="h-8 pl-8"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleSearch} aria-label="Close search">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={onToggleSearch}>
                Search Chats
              </Button>
            )}
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
                            className="h-8 w-8"
                            onClick={() => startEdit(p.id)}
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