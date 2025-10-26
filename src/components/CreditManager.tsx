import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface CreditManagerProps {
  credits: number;
  className?: string;
}

const CreditManager: React.FC<CreditManagerProps> = ({ credits, className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/pricing");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={["h-8 px-3 text-xs font-medium bg-secondary border-border hover:bg-muted", className || ""].join(" ")}
      onClick={handleClick}
    >
      <Zap className="h-3 w-3 mr-1.5 text-yellow-500 fill-yellow-500" />
      Créditos: <span className="ml-1 text-foreground font-semibold">{credits}</span>
    </Button>
  );
};

export default CreditManager;