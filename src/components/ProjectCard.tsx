"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Project } from "@/lib/projects";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/editor?id=${project.id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(project.lastEdited), {
    addSuffix: true,
  });

  return (
    <div className="group">
      <Card
        className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        onClick={handleNavigate}
      >
        <CardContent className="p-0">
          <div className="bg-muted aspect-video flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Sin previsualización</span>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
           <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${project.id}.png`} alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground truncate">{project.name}</p>
            <p className="text-sm text-muted-foreground">Editado {timeAgo}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Eliminar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectCard;