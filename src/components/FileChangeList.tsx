import React, { useState } from "react";
import { FilePlus, FileEdit, FileMinus, ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ChangeType = 'create' | 'update' | 'delete';

export interface FileChange {
  type: ChangeType;
  path: string;
}

interface FileChangeListProps {
  changes: FileChange[];
}

const FileChangeItem = ({ change }: { change: FileChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileName = change.path.split('/').pop();
  const dirPath = change.path.split('/').slice(0, -1).join('/');

  const getIcon = () => {
    switch (change.type) {
      case 'create': return <FilePlus className="w-4 h-4 text-green-500" />;
      case 'update': return <FileEdit className="w-4 h-4 text-blue-500" />;
      case 'delete': return <FileMinus className="w-4 h-4 text-red-500" />;
    }
  };

  const getBadge = () => {
     switch (change.type) {
      case 'create': 
        return <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 px-1.5 rounded-sm">Creado</Badge>;
      case 'update': 
        return <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 px-1.5 rounded-sm">Modificado</Badge>;
      case 'delete': 
        return <Badge variant="outline" className="text-[10px] h-5 bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 px-1.5 rounded-sm">Eliminado</Badge>;
    }
  };

  return (
    <div className="border border-border/40 rounded-md bg-card/40 overflow-hidden transition-all hover:bg-card/60 hover:border-border/60">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 opacity-80">{getIcon()}</div>
          <div className="flex items-baseline gap-2 min-w-0">
             <span className="font-semibold text-foreground truncate">{fileName}</span>
             {dirPath && <span className="text-xs text-muted-foreground/60 font-mono truncate max-w-[150px] hidden sm:inline-block">{dirPath}/</span>}
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {getBadge()}
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/40 bg-background/50 px-4 py-3">
             {change.type === 'create' ? (
                 <div className="flex items-center gap-2 text-xs text-green-600/80">
                    <div className="w-1 h-3 bg-green-500 rounded-full" />
                    <span>Archivo nuevo generado.</span>
                 </div>
             ) : change.type === 'update' ? (
                 <div className="flex items-center gap-2 text-xs text-blue-600/80">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                    <span>Contenido actualizado.</span>
                 </div>
             ) : (
                 <div className="flex items-center gap-2 text-xs text-red-600/80">
                    <div className="w-1 h-3 bg-red-500 rounded-full" />
                    <span>Archivo eliminado.</span>
                 </div>
             )}
        </div>
      )}
    </div>
  );
};

export const FileChangeList: React.FC<FileChangeListProps> = ({ changes }) => {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="space-y-3 my-4 animate-fade-in">
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
           Cambios Realizados ({changes.length})
        </h3>
        <div className="h-px bg-border flex-1 opacity-50" />
      </div>
      
      <div className="grid gap-2">
        {changes.map((change, i) => (
            <FileChangeItem key={`${change.path}-${i}`} change={change} />
        ))}
      </div>
    </div>
  );
};