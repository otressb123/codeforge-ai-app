import { Play, Save, Settings, Github, Plus, Zap, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface TopBarProps {
  projectName: string;
  onRun?: () => void;
  onSave?: () => void;
  onNewProject?: () => void;
}

const TopBar = ({ projectName, onRun, onSave, onNewProject }: TopBarProps) => {
  return (
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
        <Button
          onClick={onNewProject}
          variant="outline"
          size="sm"
          className="gap-2 border-border hover:border-primary hover:text-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </Button>
        
        <Button
          onClick={onSave}
          variant="outline"
          size="sm"
          className="gap-2 border-border hover:border-success hover:text-success"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        
        <Button
          onClick={onRun}
          size="sm"
          className="gap-2 bg-success hover:bg-success/90 text-white"
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Run</span>
        </Button>
      </div>

      {/* Right: Settings */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Command className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Github className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
