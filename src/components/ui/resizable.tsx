"use client";

import React from "react";
import { GripVertical } from "lucide-react";

type PanelGroupProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  direction?: "horizontal" | "vertical";
}>;

type PanelProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  /**
   * defaultSize and minSize are accepted for compatibility with the original API.
   * When provided as numbers they are interpreted as percentages (e.g. 25 -> "25%")
   * and applied as a fixed flex-basis so the panels remain static (non-resizable).
   */
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
 * Renders a static, non-interactive visual divider when withHandle is true.
 * This preserves layout/appearance but disables dragging.
 */
export const ResizableHandle: React.FC<HandleProps> = ({ withHandle }) => {
  if (!withHandle) return null;

  return (
    <div
      // Keep the same classes as the original handle so layout/appearance doesn't change.
      className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border select-none pointer-events-none"
      aria-hidden
      title="Divider (static)"
    >
      <GripVertical className="h-2.5 w-2.5" />
    </div>
  );
};

/**
 * ResizablePanel
 * Applies the provided defaultSize and minSize as fixed flex-basis/minWidth (percentages),
 * ensuring the panel is static and not resizable.
 */
export const ResizablePanel: React.FC<PanelProps> = ({
  children,
  className = "",
  style,
  defaultSize,
  minSize,
}) => {
  const computedStyle: React.CSSProperties = { ...style };

  if (typeof defaultSize === "number") {
    // Treat numeric sizes as percentages for compatibility with Editor usage.
    computedStyle.flexBasis = `${defaultSize}%`;
    // Do not allow the panel to grow/shrink so sizes stay fixed.
    computedStyle.flexGrow = 0;
    computedStyle.flexShrink = 0;
  } else {
    // Flexible panel if no explicit defaultSize
    computedStyle.flex = "1 1 0%";
  }

  if (typeof minSize === "number") {
    computedStyle.minWidth = `${minSize}%`;
  }

  return (
    <div className={`min-w-0 ${className}`} style={computedStyle}>
      {children}
    </div>
  );
};

/**
 * ResizablePanelGroup
 * Simple flex container; supports horizontal/vertical direction but no resizing logic.
 */
export const ResizablePanelGroup: React.FC<PanelGroupProps> = ({
  children,
  className = "",
  style,
  direction = "horizontal",
}) => {
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