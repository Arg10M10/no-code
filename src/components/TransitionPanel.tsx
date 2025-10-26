import React from "react";

type TransitionPanelProps = {
  children: React.ReactNode;
  className?: string;
};

const TransitionPanel: React.FC<TransitionPanelProps> = ({ children, className }) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={[
        "transition-all duration-500 ease-in-out", // Duración y easing ajustados
        "will-change-[opacity,transform]",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4", // Movimiento aumentado
        "motion-reduce:transition-none motion-reduce:transform-none",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
};

export default TransitionPanel;