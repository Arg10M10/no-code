import React from "react";

type TransitionPanelProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right";
  durationMs?: number;
};

const TransitionPanel: React.FC<TransitionPanelProps> = ({
  children,
  className,
  direction = "right",
  durationMs = 500,
}) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const translateClass = show
    ? "translate-x-0 opacity-100"
    : direction === "right"
    ? "translate-x-6 opacity-0"
    : "-translate-x-6 opacity-0";

  return (
    <div
      className={[
        "transform-gpu will-change-[opacity,transform]",
        "transition-all ease-out",
        `duration-[${durationMs}ms]`,
        translateClass,
        "motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
};

export default TransitionPanel;