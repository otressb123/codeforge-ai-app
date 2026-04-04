import { Wifi, WifiOff, Bot, GitBranch, FileCode, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface StatusBarProps {
  activeFile?: string | null;
  lineCount?: number;
  isAIEnabled?: boolean;
  gitBranch?: string;
  errors?: number;
}

const StatusBar = ({ activeFile, lineCount = 0, isAIEnabled = true, gitBranch = "main", errors = 0 }: StatusBarProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getFileLanguage = (filename: string | null) => {
    if (!filename) return "";
    const ext = filename.split(".").pop();
    const map: Record<string, string> = {
      tsx: "TypeScript React", ts: "TypeScript", jsx: "JavaScript React", js: "JavaScript",
      css: "CSS", html: "HTML", json: "JSON", md: "Markdown", py: "Python",
    };
    return map[ext || ""] || ext?.toUpperCase() || "";
  };

  return (
    <div className="h-6 bg-primary/10 border-t border-border/50 flex items-center justify-between px-3 text-[11px] select-none">
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <><Wifi className="w-3 h-3 text-success" /><span className="text-success">Online</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-warning" /><span className="text-warning">Offline</span></>
          )}
        </div>

        {/* Git Branch */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <GitBranch className="w-3 h-3" />
          <span>{gitBranch}</span>
        </div>

        {/* Errors */}
        {errors > 0 ? (
          <div className="flex items-center gap-1 text-destructive">
            <AlertCircle className="w-3 h-3" />
            <span>{errors} error{errors > 1 ? "s" : ""}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-success">
            <CheckCircle2 className="w-3 h-3" />
            <span>No issues</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* AI Status */}
        <div className="flex items-center gap-1">
          <Bot className="w-3 h-3" />
          <span className={isAIEnabled && isOnline ? "text-primary" : "text-muted-foreground"}>
            AI {isAIEnabled && isOnline ? "Ready" : isOnline ? "Off" : "Unavailable"}
          </span>
          {isAIEnabled && isOnline && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
        </div>

        {/* Language */}
        {activeFile && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileCode className="w-3 h-3" />
            <span>{getFileLanguage(activeFile)}</span>
          </div>
        )}

        {/* Line Count */}
        {lineCount > 0 && (
          <span className="text-muted-foreground">{lineCount} lines</span>
        )}

        <span className="text-muted-foreground/50">UTF-8</span>
      </div>
    </div>
  );
};

export default StatusBar;
