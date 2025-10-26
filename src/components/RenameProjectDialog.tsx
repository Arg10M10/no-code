import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
});

type FormValues = z.infer<typeof formSchema>;

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void;
}

const RenameProjectDialog: React.FC<RenameProjectDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  onRename,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentName,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ name: currentName });
    }
  }, [open, currentName, form]);

  const onSubmit = (data: FormValues) => {
    if (data.name === currentName) {
      onOpenChange(false);
      return;
    }
    onRename(data.name);
    onOpenChange(false);
    toast.success(`Proyecto renombrado a "${data.name}"`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renombrar Proyecto</DialogTitle>
          <DialogDescription>
            Introduce un nuevo nombre para tu proyecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                className="col-span-3"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 text-right col-span-4">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameProjectDialog;