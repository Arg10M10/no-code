import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Project, deleteProject, listProjects, getPreviewHtml } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpRight, Trash2, LayoutGrid, Plus } from "lucide-react";
import LavaLamp from "@/components/LavaLamp";

const gradientPalette = [
  "from-sky-500/70 via-blue-500/60 to-indigo-500/60",
  "from-emerald-500/70 via-teal-500/60 to-emerald-400/60",
  "from-purple-500/70 via-fuchsia-500/60 to-rose-500/60",
  "from-amber-500/70 via-orange-500/60 to-rose-500/60",
  "from-cyan-500/70 via-blue-500/60 to-purple-500/60",
  "from-pink-500/70 via-rose-500/60 to-orange-500/60",
];

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "P";
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"edited_desc" | "edited_asc" | "name_asc">("edited_desc");

  const loadProjects = useCallback(() => {
    setProjects(listProjects());
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = projects.filter((project) =>
      project.name.toLowerCase().includes(query),
    );

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "edited_desc") return b.updatedAt - a.updatedAt;
      if (sort === "edited_asc") return a.updatedAt - b.updatedAt;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return sorted;
  }, [projects, search, sort]);

  const openProject = (projectId: string) => {
    navigate(`/editor?id=${encodeURIComponent(projectId)}`);
  };

  const removeProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const confirmed = window.confirm(
      `Delete "${project?.name ?? "this project"}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    deleteProject(projectId);
    loadProjects();
  };

  return (
    <div className="min-h-full bg-background relative animate-fade-in">
      <LavaLamp />
      <div className="relative z-10 container mx-auto px-6 py-12">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutGrid className="h-8 w-8 text-primary" />
              All Projects
            </h1>
            <p className="text-muted-foreground mt-1">Manage and organize your creations.</p>
          </div>
          <Button onClick={() => navigate("/")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="bg-secondary/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          {/* Filters */}
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(1,minmax(0,1fr))] mb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="pl-9 h-10 rounded-xl border border-border/60 bg-background/80"
              />
            </div>
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="h-10 rounded-xl border border-border/60 bg-background/80">
                <SelectValue placeholder="Last edited" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edited_desc">Last edited</SelectItem>
                <SelectItem value="edited_asc">Oldest</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                 <p className="text-muted-foreground">No projects found.</p>
                 {projects.length === 0 && (
                    <Button variant="link" onClick={() => navigate("/")} className="mt-2">
                        Create your first project
                    </Button>
                 )}
              </div>
            ) : (
                filteredProjects.map((project, index) => {
                const gradient = gradientPalette[index % gradientPalette.length];
                const code = getPreviewHtml(project.id);

                return (
                    <article
                    key={project.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-background/80 backdrop-blur transition-all hover:border-primary/50 hover:shadow-lg"
                    >
                    <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${gradient}`}>
                        {code ? (
                        <iframe
                            title={`${project.name} preview`}
                            srcDoc={code}
                            sandbox="allow-scripts allow-same-origin"
                            className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90"
                            tabIndex={-1}
                        />
                        ) : null}
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10" />
                        
                        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                             <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full shadow-lg"
                                onClick={() => openProject(project.id)}
                            >
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                                <h3 className="font-semibold truncate text-sm" title={project.name}>{project.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: enUS })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-3 flex justify-end">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                                onClick={() => removeProject(project.id)}
                            >
                                <Trash2 className="mr-1.5 h-3 w-3" />
                                Delete
                            </Button>
                        </div>
                    </div>
                    </article>
                );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;