import { useEffect, useCallback } from "react";

interface ShortcutActions {
  onSave?: () => void;
  onExport?: () => void;
  onNewFile?: () => void;
  onNewProject?: () => void;
  onRefreshPreview?: () => void;
  onToggleSidebar?: () => void;
  onToggleTerminal?: () => void;
  onQuickOpen?: () => void;
}

export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    
    if (!modifier) return;
    
    // Ctrl/Cmd + S: Save
    if (event.key === "s" && !event.shiftKey) {
      event.preventDefault();
      actions.onSave?.();
      return;
    }
    
    // Ctrl/Cmd + Shift + S: Export
    if (event.key === "S" || (event.key === "s" && event.shiftKey)) {
      event.preventDefault();
      actions.onExport?.();
      return;
    }
    
    // Ctrl/Cmd + N: New File
    if (event.key === "n" && !event.shiftKey) {
      event.preventDefault();
      actions.onNewFile?.();
      return;
    }
    
    // Ctrl/Cmd + Shift + N: New Project
    if (event.key === "N" || (event.key === "n" && event.shiftKey)) {
      event.preventDefault();
      actions.onNewProject?.();
      return;
    }
    
    // Ctrl/Cmd + R: Refresh Preview
    if (event.key === "r") {
      event.preventDefault();
      actions.onRefreshPreview?.();
      return;
    }
    
    // Ctrl/Cmd + B: Toggle Sidebar
    if (event.key === "b") {
      event.preventDefault();
      actions.onToggleSidebar?.();
      return;
    }
    
    // Ctrl/Cmd + `: Toggle Terminal
    if (event.key === "`") {
      event.preventDefault();
      actions.onToggleTerminal?.();
      return;
    }
    
    // Ctrl/Cmd + P: Quick Open
    if (event.key === "p") {
      event.preventDefault();
      actions.onQuickOpen?.();
      return;
    }
  }, [actions]);
  
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export const getShortcutLabel = (shortcut: string): string => {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modifier = isMac ? "⌘" : "Ctrl";
  
  return shortcut
    .replace("Ctrl+", `${modifier}+`)
    .replace("Cmd+", `${modifier}+`);
};
