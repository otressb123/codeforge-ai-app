import { Globe, RefreshCw, Smartphone, Monitor, Tablet, Maximize2, AlertTriangle, X, Wand2, ShieldCheck } from "lucide-react";
import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FileNode } from "@/components/FileExplorer";
import { bundlePreview, runHealthCheck, HealthIssue } from "@/lib/previewBundler";
import { capturePreviewScreenshot, PreviewCaptureResult } from "@/hooks/usePreviewCapture";

interface PreviewPanelProps {
  html?: string;
  files?: FileNode[];
  onRefresh?: () => void;
  onPreviewError?: (error: string) => void;
  onManualFix?: (error: string) => void;
}

export interface PreviewPanelRef {
  captureScreenshot: () => Promise<PreviewCaptureResult | null>;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const PreviewPanel = forwardRef<PreviewPanelRef, PreviewPanelProps>(({ html, files, onRefresh, onPreviewError, onManualFix }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Expose capture function to parent
  useImperativeHandle(ref, () => ({
    captureScreenshot: async () => {
      if (!iframeRef.current) return null;
      return capturePreviewScreenshot(iframeRef.current);
    },
  }));
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [showConsole, setShowConsole] = useState(false);

  // Run health check synchronously on every files change
  const healthIssues = useMemo<HealthIssue[]>(() => {
    if (!files || files.length === 0) return [];
    return runHealthCheck(files);
  }, [files]);
  const healthErrors = healthIssues.filter(i => i.level === "error");

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      default:
        return "100%";
    }
  };

  // Generate preview content
  const getPreviewContent = useCallback(() => {
    if (html) return html;
    if (files && files.length > 0) {
      return bundlePreview(files);
    }
    return null;
  }, [html, files]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPreviewKey(prev => prev + 1);
    setConsoleLogs([]);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenInBrowser = () => {
    const content = getPreviewContent() || defaultContent;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Listen for console messages and errors from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        const msg: string = event.data.message;
        setConsoleLogs(prev => [...prev.slice(-49), msg]);
        // Treat [error] console messages as runtime errors too
        if (msg.startsWith("[error]")) {
          setRuntimeError(msg);
          setErrorDismissed(false);
          onPreviewError?.(msg);
        }
      }
      if (event.data?.type === "preview-error" && event.data.error) {
        setConsoleLogs(prev => [...prev.slice(-49), `[ERROR] ${event.data.error}`]);
        setRuntimeError(event.data.error);
        setErrorDismissed(false);
        onPreviewError?.(event.data.error);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPreviewError]);

  // Clear runtime error when files change (give it a chance to fix itself)
  useEffect(() => {
    setRuntimeError(null);
    setErrorDismissed(false);
  }, [previewKey]);

  const defaultContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: 2.5rem;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1rem;
        }
        p {
          color: rgba(255,255,255,0.7);
          font-size: 1.1rem;
        }
        .glow {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Your App Preview</h1>
        <p class="glow">Start coding to see your app here</p>
      </div>
    </body>
    </html>
  `;

  const errorCount = (runtimeError ? 1 : 0) + healthErrors.length;
  const errorLogCount = consoleLogs.filter(l => l.startsWith("[error]") || l.startsWith("[ERROR]")).length;

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Preview</span>
          {/* Health badge */}
          {healthErrors.length === 0 && !runtimeError ? (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400" title="Safe Build: all checks passed">
              <ShieldCheck className="w-3 h-3" /> healthy
            </span>
          ) : (
            <button
              onClick={() => setErrorDismissed(false)}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25"
              title="Click to view errors"
            >
              <AlertTriangle className="w-3 h-3" /> {errorCount} issue{errorCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${device === "mobile" ? "bg-primary/20 text-primary" : ""}`} onClick={() => setDevice("mobile")}>
            <Smartphone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${device === "tablet" ? "bg-primary/20 text-primary" : ""}`} onClick={() => setDevice("tablet")}>
            <Tablet className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className={`h-7 w-7 ${device === "desktop" ? "bg-primary/20 text-primary" : ""}`} onClick={() => setDevice("desktop")}>
            <Monitor className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConsole(s => !s)}
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${showConsole ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            title="Toggle console"
          >
            console{errorLogCount > 0 ? ` (${errorLogCount})` : ""}
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} title="Refresh (Ctrl+R)">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenInBrowser} title="Open in new tab">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-start justify-center p-4 overflow-auto bg-muted/20 relative">
        <motion.div
          className="bg-white rounded-lg overflow-hidden shadow-2xl"
          style={{ width: getDeviceWidth(), height: device === "desktop" ? "100%" : "auto" }}
          layout
          transition={{ duration: 0.3 }}
        >
          <iframe
            ref={iframeRef}
            key={`preview-${previewKey}`}
            srcDoc={getPreviewContent() || defaultContent}
            className="w-full h-full min-h-[400px]"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </motion.div>

        {/* Error overlay (runtime + health) */}
        <AnimatePresence>
          {(runtimeError || healthErrors.length > 0) && !errorDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4 max-h-[60%] overflow-auto rounded-lg border border-red-500/40 bg-zinc-950/95 backdrop-blur shadow-2xl text-xs font-mono"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-red-500/30 bg-red-500/10">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">{healthErrors.length > 0 ? "Safe Build" : "Runtime Error"}</span>
                  <span className="text-red-300/70">{errorCount} issue{errorCount === 1 ? "" : "s"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const payload = healthErrors.length > 0
                        ? "[SAFE BUILD]\n" + healthErrors.map(i => (i.file ? i.file + ": " : "") + i.message + (i.hint ? " — " + i.hint : "")).join("\n")
                        : runtimeError || "";
                      onManualFix?.(payload);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 text-[11px]"
                    title="Send to AI to fix"
                  >
                    <Wand2 className="w-3 h-3" /> Fix with AI
                  </button>
                  <button onClick={() => setErrorDismissed(true)} className="p-1 text-muted-foreground hover:text-foreground" title="Dismiss">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {healthErrors.map((i, idx) => (
                  <div key={idx} className="text-red-300">
                    {i.file && <span className="text-cyan-400">{i.file}</span>}{i.file && " — "}
                    {i.message}
                    {i.hint && <div className="text-muted-foreground italic">💡 {i.hint}</div>}
                  </div>
                ))}
                {runtimeError && (
                  <pre className="text-red-300 whitespace-pre-wrap break-words">{runtimeError}</pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Console Logs */}
      {showConsole && consoleLogs.length > 0 && (
        <div className="border-t border-border bg-secondary/30 max-h-32 overflow-y-auto">
          <div className="p-2 text-xs font-mono space-y-0.5">
            {consoleLogs.map((log, i) => (
              <div key={i} className={log.toLowerCase().includes("error") ? "text-red-400" : "text-muted-foreground"}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
