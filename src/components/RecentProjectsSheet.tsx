"use client";

import React from "react";
import DeleteProjectDialog from "@/components/DeleteProjectDialog";

type Project = { id: string; name: string };

type RecentProjectsSheetProps = {
  projects?: Project[];
  openProject?: (id: string) => void;
  editingId?: string | null;
  onDeleteProject?: (id: string) => void;
};

const RecentProjectsSheet: React.FC<RecentProjectsSheetProps> = ({
  projects,
  openProject,
  editingId,
  onDeleteProject
}) => {
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-md border p-3 transition-shadow duration-200 hover:shadow-sm cursor-pointer"
          onClick={() => {
            if (editingId || !openProject) return;
            openProject(p.id);
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{p.name}</div>
          </div>

          <DeleteProjectDialog
            projectId={p.id}
            projectName={p.name}
            disabled={!!editingId}
            onConfirm={(id) => onDeleteProject?.(id)}
          />
        </div>
      ))}
    </div>
  );
};

export default RecentProjectsSheet;