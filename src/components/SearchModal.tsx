"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Folder, ArrowRight, Clock } from "lucide-react";
import { listProjects, Project } from "@/lib/projects";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setProjects(listProjects().sort((a, b) => b.updatedAt - a.updatedAt));
      setQuery("");
    }
  }, [open]);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id: string) => {
    onOpenChange(false);
    navigate(`/editor?id=${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search projects..." 
                className="border-none shadow-none focus-visible:ring-0 px-0 h-auto text-lg bg-transparent placeholder:text-muted-foreground/50"
                autoFocus
            />
        </div>
        <ScrollArea className="max-h-[450px]">
            {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    <p>No projects found matching "{query}"</p>
                </div>
            ) : (
                <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Projects
                    </div>
                    {filtered.map(project => (
                        <button
                            key={project.id}
                            onClick={() => handleSelect(project.id)}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 hover:text-white transition-all group text-left border border-transparent hover:border-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-foreground group-hover:text-white transition-colors">
                                        {project.name}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                                        <Clock className="w-3 h-3" />
                                        <span>Edited {formatDistanceToNow(project.updatedAt, { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                    ))}
                </div>
            )}
        </ScrollArea>
        <div className="p-2 border-t border-white/10 bg-white/5 flex justify-between items-center px-4">
            <span className="text-xs text-muted-foreground">
                <strong>{filtered.length}</strong> projects
            </span>
            <div className="flex gap-2">
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/5 text-muted-foreground">ESC</span>
                <span className="text-[10px] text-muted-foreground">to close</span>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;