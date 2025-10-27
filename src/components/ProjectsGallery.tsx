import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
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
import { Search, ArrowUpRight, Trash2 } from "lucide-react";

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
      `¿Seguro que deseas eliminar "${project?.name ?? "este proyecto"}"? Esta acción no se puede deshacer.`,
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
            Aún no hay proyectos guardados con los filtros actuales.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Crear nuevo proyecto
          </Button>
        </div>
      );
    }

    return filteredProjects.map((project, index) => {
      const gradient = gradientPalette[index % gradientPalette.length];
      return (
        <article
          key={project.id}
          className="group overflow-hidden rounded-3xl border border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-colors hover:border-primary/60"
        >
          <div className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20" />
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-secondary/70 text-sm font-semibold uppercase">
                {getInitials(project.name)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-6 truncate">{project.name || "Proyecto sin título"}</h3>
                <p className="text-xs text-muted-foreground">
                  Editado {formatDistanceToNow(project.updatedAt, { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                size="sm"
                className="h-9 px-3"
                onClick={() => openProject(project.id)}
              >
                Abrir
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-3 text-destructive hover:text-destructive"
                onClick={() => removeProject(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </article>
      );
    });
  };

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-border/50 bg-secondary/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-blue-500/20 opacity-70" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold">Tus proyectos</h2>
              <p className="text-sm text-muted-foreground">
                Busca, ordena y retoma cualquiera de tus generaciones anteriores.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-start sm:self-center"
              onClick={() => {
                if (filteredProjects.length === 0) {
                  navigate("/");
                  return;
                }
                openProject(filteredProjects[0].id);
              }}
            >
              Ver rápido
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar proyectos..."
                className="pl-9 h-10 rounded-xl border border-border/60 bg-background/80"
              />
            </div>
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="h-10 rounded-xl border border-border/60 bg-background/80">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edited_desc">Última edición</SelectItem>
                <SelectItem value="edited_asc">Más antiguos</SelectItem>
                <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            <Select value="all" disabled>
              <SelectTrigger className="h-10 rounded-xl border border-border/60 bg-background/60 text-muted-foreground">
                <SelectValue placeholder="Todos los creadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los creadores</SelectItem>
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