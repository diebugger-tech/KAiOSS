import { useState } from 'react';

/**
 * usePanelResize Hook
 * Manages the layout dimensions of the KAi panel, including drag-to-resize handlers
 * for the main container and the history sidebar. Persists widths in localStorage.
 */
export function usePanelResize(initialContainerWidth = 800, initialSidebarWidth = 260) {
  const [containerWidth, setContainerWidth] = useState(() => {
    const saved = localStorage.getItem('kai_container_width');
    return saved ? parseInt(saved, 10) : initialContainerWidth;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('kai_sidebar_width');
    return saved ? parseInt(saved, 10) : initialSidebarWidth;
  });
  const [isResizingContainer, setIsResizingContainer] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const handleContainerResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizingContainer(true);
    const startX = e.clientX;
    const startWidth = containerWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(400, startWidth + deltaX * 2);
      const cappedWidth = Math.min(newWidth, window.innerWidth * 0.95);
      setContainerWidth(cappedWidth);
      localStorage.setItem('kai_container_width', cappedWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizingContainer(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSidebarResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const minSidebarWidth = 150;
      const maxSidebarWidth = containerWidth - 150;
      const newWidth = Math.max(minSidebarWidth, Math.min(maxSidebarWidth, startWidth + deltaX));
      setSidebarWidth(newWidth);
      localStorage.setItem('kai_sidebar_width', newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    containerWidth,
    sidebarWidth,
    isResizingContainer,
    isResizingSidebar,
    handleContainerResizeMouseDown,
    handleSidebarResizeMouseDown
  };
}
