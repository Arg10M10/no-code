import React, { useState, useEffect } from "react";
import { BrainCircuit, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "Analizando requerimientos...",
  "Entendiendo el contexto...",
  "Planificando arquitectura...",
  "Diseñando componentes...",
  "Escribiendo código...",
  "Aplicando estilos...",
  "Finalizando cambios..."
];

export const ThinkingProcess = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500); // Cambia de paso cada 2.5 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/50 bg-secondary/30 animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <BrainCircuit className="h-4 w-4 text-indigo-500 animate-pulse" />
        <span>Thinking Process</span>
      </div>
      
      <div className="space-y-3 pl-1.5">
        {steps.map((step, index) => {
            // Solo mostramos pasos actuales, pasados y el siguiente inmediato
            if (index > currentStep) return null;
            
            const isActive = index === currentStep;
            const isDone = index < currentStep;

            return (
                <div key={index} className="flex items-center gap-3 text-xs animate-fade-in">
                    <div className="flex flex-col items-center">
                         <div className={cn(
                             "h-4 w-4 rounded-full flex items-center justify-center border",
                             isDone ? "bg-green-500/10 border-green-500/30 text-green-500" : 
                             isActive ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500" : "border-border"
                         )}>
                             {isDone ? <CheckCircle2 className="h-2.5 w-2.5" /> : isActive ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
                         </div>
                         {index < currentStep && <div className="h-2 w-px bg-border/50 my-0.5" />}
                    </div>
                    <span className={cn(
                        isActive ? "text-foreground font-medium" : "text-muted-foreground",
                        "transition-colors"
                    )}>
                        {step}
                    </span>
                </div>
            )
        })}
      </div>
    </div>
  );
};