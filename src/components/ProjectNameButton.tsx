import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import RenameProjectDialog from "./RenameProjectDialog";

interface ProjectNameButtonProps {
  projectName: string;
  onRename: (newName: string) => void;
}

const ProjectNameButton: React.FC<ProjectNameButtonProps> = ({ projectName, onRename }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-2 py-1 text-lg font-bold leading-none truncate hover:bg-accent/50"
        onClick={() => setIsDialogOpen(true)}
      >
        {projectName || "Proyecto"}
        <Pencil className="h-3 w-3 ml-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
      <RenameProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentName={projectName}
        onRename={onRename}
      />
    </>
  );
};

export default ProjectNameButton;