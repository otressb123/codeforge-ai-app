import { Globe, RefreshCw, ExternalLink, Smartphone, Monitor, Tablet, Maximize2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileNode } from "@/components/FileExplorer";
import { bundlePreview } from "@/lib/previewBundler";

interface PreviewPanelProps {
  html?: string;
  files?: FileNode[];
  onRefresh?: () => void;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const PreviewPanel = ({ html, files, onRefresh }: PreviewPanelProps) => {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

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

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        setConsoleLogs(prev => [...prev.slice(-49), event.data.message]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Preview</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${device === "mobile" ? "bg-primary/20 text-primary" : ""}`}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${device === "tablet" ? "bg-primary/20 text-primary" : ""}`}
            onClick={() => setDevice("tablet")}
          >
            <Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${device === "desktop" ? "bg-primary/20 text-primary" : ""}`}
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            title="Refresh (Ctrl+R)"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleOpenInBrowser}
            title="Open in new tab"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-start justify-center p-4 overflow-auto bg-muted/20">
        <motion.div
          className="bg-white rounded-lg overflow-hidden shadow-2xl"
          style={{ width: getDeviceWidth(), height: device === "desktop" ? "100%" : "auto" }}
          layout
          transition={{ duration: 0.3 }}
        >
          <iframe
            key={`preview-${previewKey}`}
            srcDoc={getPreviewContent() || defaultContent}
            className="w-full h-full min-h-[400px]"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </motion.div>
      </div>

      {/* Console Logs */}
      {consoleLogs.length > 0 && (
        <div className="border-t border-border bg-secondary/30 max-h-24 overflow-y-auto">
          <div className="p-2 text-xs font-mono">
            {consoleLogs.map((log, i) => (
              <div key={i} className="text-muted-foreground">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
