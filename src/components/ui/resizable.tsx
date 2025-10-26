"use client";

import React from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: React.ReactNode;
  // sizing props used by the previous resizable implementation — kept for type compatibility
  defaultSize?: number; // percent in the original API
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  onCollapse?: () => void;
  onExpand?: () => void;
  className?: string;
  // legacy names previously present in other implementations
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
};

type GroupProps = {
  children: React.ReactNode;
  className?: string;
  // Editor passes direction="horizontal"
  direction?: "horizontal" | "vertical" | string;
};

type HandleProps = {
  withHandle?: boolean;
  className?: string;
};

/**
 * ResizablePanelGroup
 * Simple horizontal container for panels. Static (no drag logic).
 * Accepts `direction` prop for compatibility.
 */
export const ResizablePanelGroup: React.FC<GroupProps> = ({ children, className }) => {
  return <div className={cn("flex h-full w-full", className)}>{children}</div>;
};

/**
 * ResizablePanel
 * Static panel that accepts sizing props for compatibility with the original API.
 * - If `defaultSize` is provided (assumed percentage), we don't compute real percentages here;
 *   instead we keep flex behavior but allow consumers to pass className or inline styles.
 * - If `defaultWidth` is provided, it's treated as pixels.
 */
export const ResizablePanel: React.FC<PanelProps> = ({
  children,
  defaultSize,
  minSize,
  maxSize,
  defaultWidth,
  minWidth,
  maxWidth,
  className,
}) => {
  // Prefer explicit pixel width if provided, otherwise do not force sizing.
  const style: React.CSSProperties | undefined = defaultWidth
    ? {
        width: `${defaultWidth}px`,
        minWidth: minWidth ? `${minWidth}px` : undefined,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
      }
    : undefined;

  // If defaultSize is provided (likely a percentage number), we don't enforce it here —
  // keep flex behavior but allow consumers to control via className if needed.
  const rootClasses = defaultWidth ? "flex-none" : "flex-1";

  return (
    <div className={cn(rootClasses, "h-full", className)} style={style}>
      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
};

/**
 * ResizableHandle
 * Exported for compatibility with existing imports. Intentionally inert (returns null)
 * to keep the UI static while preserving the API.
 */
export const ResizableHandle: React.FC<HandleProps> = () => {
  return null;
};

/**
 * Default Resizable export (kept for compatibility).
 * Acts as a simple wrapper that applies a defaultWidth if provided.
 */
const Resizable: React.FC<PanelProps & { className?: string }> = ({ children, defaultWidth, className }) => {
  const style = defaultWidth ? { width: `${defaultWidth}px` } : undefined;
  return (
    <div className={cn("relative flex h-full", className)} style={style}>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default Resizable;