"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

type DeleteProjectDialogProps = {
  projectId: string;
  projectName: string;
  onConfirm?: (projectId: string) => void;
  disabled?: boolean;
  className?: string;
};

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  projectId,
  projectName,
  onConfirm,
  disabled = false,
  className
}) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const canDelete = value.trim() === projectName;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) return;
    onConfirm?.(projectId);
    toast.success("Proyecto eliminado");
    setOpen(false);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className={["h-7 w-7 ml-auto", className || ""].join(" ")}
        onClick={handleOpen}
        title="Eliminar proyecto"
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="sm:max-w-[440px]"
        >
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar proyecto</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Escribe el nombre del proyecto para confirmar:
              <span className="ml-1 font-medium text-foreground">{projectName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Escribe: ${projectName}`}
            />
            {!canDelete && value.length > 0 && (
              <p className="text-xs text-muted-foreground">El texto no coincide con el nombre del proyecto.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteProjectDialog;