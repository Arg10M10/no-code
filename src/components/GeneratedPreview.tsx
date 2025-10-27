import React, { useState, useEffect, useRef } from 'react';
import Loader from './Loader'; // Assuming you have a Loader component

const GeneratedPreview = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Listen for messages from the parent window (Editor)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'toggleSelectionMode') {
        setIsSelectionMode(event.data.payload.isActive);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Add/remove event listeners for element selection
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!isSelectionMode || !overlay) return;

    const showOverlay = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      overlay.style.display = 'block';
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
    };

    const hideOverlay = () => {
      overlay.style.display = 'none';
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body && target !== document.documentElement && target !== overlay) {
        showOverlay(target);
      }
    };

    const handleMouseOut = () => {
      hideOverlay();
    };

    const getElementDescription = (element: HTMLElement): string => {
      let description = element.tagName.toLowerCase();
      if (element.id) {
        description += `#${element.id}`;
      }
      if (element.className && typeof element.className === 'string') {
        description += `.${element.className.split(' ').filter(Boolean).join('.')}`;
      }
      const textContent = element.textContent?.trim();
      if (textContent) {
        description += ` with text "${textContent.substring(0, 40)}${textContent.length > 40 ? '...' : ''}"`;
      }
      return description;
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target && target !== overlay) {
        const description = getElementDescription(target);
        window.parent.postMessage({ type: 'elementSelected', payload: { description } }, '*');
        hideOverlay();
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
      hideOverlay();
    };
  }, [isSelectionMode]);

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '3px',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'none',
          transition: 'all 50ms ease-out',
        }}
      />
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Loader />
        <div className="text-center p-8">
          <h1 className="text-xl font-bold mb-2">Generando tu página web...</h1>
          <p className="text-muted-foreground">Por favor, espera un momento.</p>
        </div>
      </div>
    </>
  );
};

export default GeneratedPreview;