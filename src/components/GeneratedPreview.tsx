import React, { useState, useEffect, useRef } from 'react';

const GeneratedPreview = () => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Listen for messages from the parent window (Editor)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optional: Add origin check for security
      // if (event.origin !== 'http://your-editor-domain.com') return;

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
    // Use capture phase to intercept clicks before they trigger actions like navigation
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
      {/* This overlay will highlight elements on hover during selection mode */}
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
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center p-8 border border-dashed border-border rounded-lg">
          <h1 className="text-2xl font-bold mb-2">Preview Area</h1>
          <p className="text-muted-foreground">Ask me to generate a component and you'll see it here.</p>
        </div>
      </div>
    </>
  );
};

export default GeneratedPreview;