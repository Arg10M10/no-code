"use client";

import React from "react";
import { Project, deleteProject } from "@/lib/projects";
import ProjectCard from "./ProjectCard";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onProjectDeleted: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onProjectDeleted }) => {
  const handleDelete = (id: string) => {
    deleteProject(id);
    onProjectDeleted();
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Mis Proyectos
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar proyectos..." className="pl-10" />
        </div>
        <Select defaultValue="last-edited">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-edited">Última edición</SelectItem>
            <SelectItem value="created-date">Fecha de creación</SelectItem>
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Aún no hay proyectos</h3>
          <p className="text-muted-foreground mt-2">
            Crea tu primer proyecto describiendo lo que quieres construir.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;