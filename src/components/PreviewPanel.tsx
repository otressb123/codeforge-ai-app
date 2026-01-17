import { Globe, RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PreviewPanelProps {
  html?: string;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const PreviewPanel = ({ html }: PreviewPanelProps) => {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ExternalLink className="w-4 h-4" />
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
            key={isRefreshing ? "refreshing" : "stable"}
            srcDoc={html || defaultContent}
            className="w-full h-full min-h-[400px]"
            title="Preview"
            sandbox="allow-scripts"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PreviewPanel;
