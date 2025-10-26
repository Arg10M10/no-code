import React from "react";

interface CreditManagerProps {
  credits: number;
  className?: string;
}

const CreditManager: React.FC<CreditManagerProps> = ({ credits, className }) => {
  return (
    <div className={["text-xs text-muted-foreground", className || ""].join(" ")}>
      Créditos: <span className="text-foreground font-medium">{credits}</span>
    </div>
  );
};

export default CreditManager;