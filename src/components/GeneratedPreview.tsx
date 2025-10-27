import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCode } from '@/lib/projects';

const GeneratedPreview = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const [code, setCode] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      const storedCode = getCode(projectId);
      setCode(storedCode);
    }
    
    // Listen for storage changes to update preview in real-time
    const handleStorageChange = () => {
      if (projectId) {
        setCode(getCode(projectId));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [projectId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'toggleSelectionMode') {
        setIsSelectionMode(event.data.payload.isActive);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      <div className="p-4 bg-background text-foreground min-h-screen">
        {code ? (
          <pre className="text-xs bg-gray-900 text-white p-4 rounded-md overflow-auto whitespace-pre-wrap break-words"><code className="font-mono">{code}</code></pre>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 border border-dashed border-border rounded-lg">
              <h1 className="text-2xl font-bold mb-2">Preview Area</h1>
              <p className="text-muted-foreground">Ask me to generate a component and you'll see it here.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GeneratedPreview;