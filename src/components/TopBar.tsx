import { Play, Save, Settings, Github, Plus, Zap, Command, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getShortcutLabel } from "@/hooks/useKeyboardShortcuts";

interface TopBarProps {
  projectName: string;
  onRun?: () => void;
  onSave?: () => void;
  onNewProject?: () => void;
  onGitHub?: () => void;
  onExportImport?: () => void;
  isGitHubConnected?: boolean;
}

const TopBar = ({ projectName, onRun, onSave, onNewProject, onGitHub, onExportImport, isGitHubConnected }: TopBarProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-12 bg-sidebar border-b border-border flex items-center justify-between px-4">
        {/* Left: Logo & Project */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <span className="font-bold text-lg text-gradient hidden sm:inline">CodeForge</span>
          </div>
          
          <div className="h-6 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Project:</span>
            <span className="text-sm font-medium text-foreground">{projectName}</span>
          </div>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onNewProject}
                variant="outline"
                size="sm"
                className="gap-2 border-border hover:border-primary hover:text-primary"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getShortcutLabel("Ctrl+Shift+N")}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onSave}
                variant="outline"
                size="sm"
                className="gap-2 border-border hover:border-success hover:text-success"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getShortcutLabel("Ctrl+S")}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onRun}
                size="sm"
                className="gap-2 bg-success hover:bg-success/90 text-white"
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Run</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getShortcutLabel("Ctrl+R")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExportImport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export/Import {getShortcutLabel("Ctrl+Shift+S")}</TooltipContent>
          </Tooltip>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Command className="w-4 h-4" />
          </Button>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 relative"
                onClick={onGitHub}
              >
                <Github className="w-4 h-4" />
                {isGitHubConnected && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>GitHub</TooltipContent>
          </Tooltip>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default TopBar;
