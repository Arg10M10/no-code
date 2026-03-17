import React, { useState, useEffect } from 'react';
import { Minimize, Maximize, X, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

const CustomTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      // Get initial state
      window.electronAPI.isMaximized().then(setIsMaximized);

      // Listen for state changes
      const unsubscribe = window.electronAPI.onWindowStateChange((maximized) => {
        setIsMaximized(maximized);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  // Con frame: true, esta barra se renderizará dentro del contenido web,
  // debajo de la barra de título nativa.
  // Por lo tanto, la hacemos "transparente" o que se mezcle con el fondo de la app.
  // También removemos las propiedades de arrastre y z-index, ya que no es la barra principal.
  return (
    <div
      className="flex items-center justify-between h-8 bg-background text-foreground select-none" // Usar bg-background para que se mezcle
      // style={{ WebkitAppRegion: 'drag' }} // Ya no es la región de arrastre principal
    >
      <div className="flex items-center gap-2 pl-3">
        <img src="/logo.png" alt="Framio Logo" className="h-5 w-5 object-contain" />
        <span className="text-sm font-semibold">Framio</span>
      </div>

      <div className="flex" /* style={{ WebkitAppRegion: 'no-drag' }} */> {/* Los botones siguen siendo no arrastrables */}
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center hover:bg-muted transition-colors"
          title="Minimize"
        >
          <Minimize className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center hover:bg-muted transition-colors"
          title={isMaximized ? "Restore Down" : "Maximize"}
        >
          {isMaximized ? <Square className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;