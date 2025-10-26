"use client";

import React from "react";

type PanelGroupProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  direction?: "horizontal" | "vertical";
}>;

type PanelProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  // Props accepted by the original resizable panel API — kept for compatibility.
  defaultSize?: number;
  minSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  onCollapse?: () => void;
  onExpand?: () => void;
}>;

type HandleProps = {
  withHandle?: boolean;
};

/**
 * ResizableHandle
 * Kept as a no-op / visually hidden element so the UI stays immovable
 * but imports that expect this component will still work.
 */
export const ResizableHandle: React.FC<HandleProps> = () => {
  // Render nothing visible (keeps component immovable)
  return <div aria-hidden style={{ display: "none" }} />;
};

/**
 * ResizablePanel
 * Simple wrapper used as a panel inside a panel group.
 * Accepts the common props used by the original implementation for TypeScript compatibility,
 * but they don't affect the presentation here.
 */
export const ResizablePanel: React.FC<PanelProps> = ({ children, className = "", style }) => {
  return (
    <div className={`min-w-0 ${className}`} style={style}>
      {children}
    </div>
  );
};

/**
 * ResizablePanelGroup
 * Simple flex container to act as the group of panels.
 * Accepts `direction` prop for compatibility (horizontal | vertical).
 */
export const ResizablePanelGroup: React.FC<PanelGroupProps> = ({ children, className = "", style, direction = "horizontal" }) => {
  const flexDir = direction === "vertical" ? "flex-col" : "flex-row";
  return (
    <div className={`${flexDir} h-full w-full ${className}`} style={style}>
      {children}
    </div>
  );
};

/**
 * Default export for backwards compatibility.
 */
export default ResizablePanelGroup;