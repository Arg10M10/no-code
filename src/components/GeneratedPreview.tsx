import React, { useState, useEffect, useRef } from 'react';
import { getCode } from '@/lib/projects';

type GeneratedPreviewProps = {
  projectId: string | null;
};

const GeneratedPreview: React.FC<GeneratedPreviewProps> = ({ projectId }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string>("");

  // Listen for messages from the parent window (Editor) to toggle selection mode
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optional: Add origin check for security
      // if (event.origin !== 'http://your-editor-domain.com') return;

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
      setHtml(`<div style="padding:40px; max-width:900px; margin:0 auto; background:#fff; border-radius:8px; box-shadow:0 6px 20px rgba(2,6,23,0.06);"><h2 class="text-lg font-semibold">Preview Area</h2><p class="text-muted-foreground">The preview will appear here after generation.</p></div>`);
      return;
    }
    const code = getCode(projectId);
    setHtml(code ?? `<div style="padding:40px; max-width:900px; margin:0 auto; background:#fff; border-radius:8px; box-shadow:0 6px 20px rgba(2,6,23,0.06);"><h2 class="text-lg font-semibold">Preview Area</h2><p class="text-muted-foreground">The preview will appear here after generation.</p></div>`);
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
      {/* This overlay will highlight elements on hover during selection mode */}
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'none',
          transition: 'all 50ms ease-out',
        }}
      />
      <div ref={containerRef} className="min-h-screen bg-background text-foreground" style={{ padding: 24 }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
};

export default GeneratedPreview;