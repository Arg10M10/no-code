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
  // Este componente ya no es necesario si frame: true está activo en main.js
  // y se ha eliminado de AppLayout.tsx.
  // Lo mantengo aquí solo como referencia si se quisiera volver a un frameless window.
  return null;
};

export default CustomTitleBar;