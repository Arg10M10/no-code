import React, { useState, useEffect, useRef } from 'react';
import { getCode } from '@/lib/projects';

type GeneratedPreviewProps = {
  projectId: string | null;
};

const GeneratedPreview: React.FC<GeneratedPreviewProps> = ({ projectId }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  // Listen for messages from the parent window (Editor) to toggle selection mode
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'toggleSelectionMode') {
        setIsSelectionMode(Boolean(event.data.payload?.isActive));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Load generated HTML from project storage
  useEffect(() => {
    if (!projectId) {
      setHtml(null);
      return;
    }
    const code = getCode(projectId);
    setHtml(code ?? null);
  }, [projectId]);

  // Add/remove event listeners for element selection when selection mode is active
  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!isSelectionMode || !overlay || !container) return;

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

    const isValidTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el === overlay || el === container || el === document.body || el === document.documentElement) return false;
      return container.contains(el);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isValidTarget(target)) {
        showOverlay(target);
      } else {
        hideOverlay();
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
      if (isValidTarget(target)) {
        const description = getElementDescription(target);
        // Post to parent (Editor) that an element was selected
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
      {/* Overlay used for highlighting elements in selection mode */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          border: '2px solid rgba(56, 189, 248, 0.95)',
          backgroundColor: 'rgba(59,130,246,0.08)',
          borderRadius: '6px',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'none',
          transition: 'all 60ms ease-out',
        }}
      />

      <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white p-8">
        {html ? (
          // Render generated HTML when available
          <div style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          // Simple centered placeholder text (minimal)
          <div className="text-center">
            <p className="text-lg md:text-xl font-medium text-sky-300">Preview will appear here after generation.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default GeneratedPreview;