"use client";

import React from "react";

type ResizableProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * `withHandle` is kept for API compatibility but the visual/interactive handle
   * has been removed to make the component immovable.
   */
  withHandle?: boolean;
};

const Resizable = React.forwardRef<HTMLDivElement, ResizableProps>(({ children, className = "", ...props }, ref) => {
  return (
    <div ref={ref} className={`relative ${className}`} {...props}>
      {children}
    </div>
  );
});

Resizable.displayName = "Resizable";

export default Resizable;