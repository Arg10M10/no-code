import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Project, deleteProject, listProjects } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpRight, Trash2, ChevronRight } from "lucide-react";

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

const ProjectsGallery: React.FC = () => {
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

  useEffect(() => {
    const handleUpdate = () => loadProjects();
    window.addEventListener("projects-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("projects-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
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
    window.dispatchEvent(new Event("projects-updated"));
  };

  const renderProjects = () => {
    if (filteredProjects.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/60 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No projects match your filters yet.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Create new project
          </Button>
        </div>
      );
    }

    return filteredProjects.map((project, index) => {
      const gradient = gradientPalette[index % gradientPalette.length];
      const showPublished = index % 3 === 0; // simple hint badge like the screenshot
      return (
        <article
          key={project.id}
          className="group overflow-hidden rounded-2xl border border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-colors hover:border-primary/60"
        >
          <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${gradient}`}>
            {showPublished && (
              <span className="absolute left-3 bottom-3 text-[11px] font-semibold rounded-md bg-white/10 text-white/90 px-2 py-0.5 border border-white/20">
                Published
              </span>
            )}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20" />
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-secondary/70 text-[11px] font-semibold uppercase">
                {getInitials(project.name)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-6 truncate">{project.name || "Untitled"}</h3>
                <p className="text-xs text-muted-foreground">
                  Edited {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: enUS })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={() => openProject(project.id)}
              >
                Open
                <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3 text-destructive hover:text-destructive"
                onClick={() => removeProject(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </article>
      );
    });
  };

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-[20px] md:rounded-[28px] border border-border/50 bg-secondary/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-blue-500/20 opacity-70" />
        <div className="relative px-4 py-6 sm:px-8 sm:py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold">My Projects</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
              aria-label="View all"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
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
            <Select value="all" disabled>
              <SelectTrigger className="h-10 rounded-xl border border-border/60 bg-background/60 text-muted-foreground">
                <SelectValue placeholder="All creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All creators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {renderProjects()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsGallery;