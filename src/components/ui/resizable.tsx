"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ResizableProps = {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  withHandle?: boolean;
};

/**
 * Resizable (static)
 *
 * Este componente ya no permite redimensionado por el usuario.
 * Mantiene la misma API superficial (props) para no romper usos existentes,
 * pero ignora la lógica de drag/handle. Si se pasa `defaultWidth` se aplica
 * como ancho fijo en píxeles; si no, el ancho queda implícito (auto).
 */
const Resizable: React.FC<ResizableProps> = ({
  children,
  defaultWidth,
  className,
}) => {
  const style = defaultWidth ? { width: `${defaultWidth}px` } : undefined;

  return (
    <div className={cn("relative flex h-full", className)} style={style}>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default Resizable;