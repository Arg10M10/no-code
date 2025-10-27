import React, { useState, useEffect, useRef } from 'react';
import { getCode } from '@/lib/projects';

type GeneratedPreviewProps = {
  projectId: string | null;
};

const GeneratedPreview: React.FC<GeneratedPreviewProps> = ({ projectId }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      // When there's generated HTML we want to ensure target is inside the content container.
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
          border: '2px solid rgba(56, 189, 248, 0.95)', // sky-400-ish
          backgroundColor: 'rgba(2, 6, 23, 0.55)', // dark translucent fill
          borderRadius: '6px',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'none',
          transition: 'all 60ms ease-out',
          boxShadow: '0 8px 30px rgba(2,6,23,0.6)',
        }}
      />

      <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white" style={{ padding: 24 }}>
        {html ? (
          // Render generated HTML when available
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          // Modern placeholder when no generated HTML exists yet
          <div className="max-w-4xl mx-auto rounded-2xl p-10 shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(6,8,23,0.9), rgba(14,21,43,0.95))' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12h18" stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 6h18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 18h18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white">Preview will appear here</h2>
                <p className="mt-2 text-sky-200 max-w-2xl">
                  Ask the AI to generate a page from the homepage and the live preview will render here. You can enter selection mode (click the pointer icon) to pick parts of the page — texts, buttons, or sections — and the selection will be attached to the chat so the AI knows exactly what to edit.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="px-4 py-2 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-sm font-medium shadow hover:brightness-105 cursor-default">
                    Modern preview
                  </div>
                  <div className="px-4 py-2 rounded-md bg-black/30 border border-white/6 text-sm text-sky-100">
                    Real-time selection support
                  </div>
                  <div className="px-4 py-2 rounded-md bg-white/5 border border-white/6 text-sm text-sky-100">
                    Blue / Black theme
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-0">
                <div className="rounded-lg p-4 bg-gradient-to-b from-black/30 to-black/10 border border-white/6">
                  <p className="text-xs text-sky-200">Tip</p>
                  <p className="mt-1 text-sm text-sky-50">Activate selection mode, hover elements to highlight, and click to bind the element to your next instruction.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GeneratedPreview;