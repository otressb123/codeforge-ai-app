import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Github, Download, Cloud } from "lucide-react";

interface SettingsPanelProps {
  onOpenGitHub?: () => void;
  onOpenGitLab?: () => void;
  onExport?: () => void;
  isGitHubConnected?: boolean;
  showMinimap?: boolean;
  onMinimapToggle?: (value: boolean) => void;
  wordWrap?: boolean;
  onWordWrapToggle?: (value: boolean) => void;
  lineNumbers?: boolean;
  onLineNumbersToggle?: (value: boolean) => void;
}

const SettingsPanel = ({ onOpenGitHub, onOpenGitLab, onExport, isGitHubConnected, showMinimap = true, onMinimapToggle, wordWrap = true, onWordWrapToggle, lineNumbers = true, onLineNumbersToggle }: SettingsPanelProps) => {
  return (
    <div className="h-full bg-sidebar overflow-y-auto scrollbar-thin">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Settings</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Editor Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Editor
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="minimap" className="text-sm">Show Minimap</Label>
              <Switch id="minimap" checked={showMinimap} onCheckedChange={onMinimapToggle} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="wordwrap" className="text-sm">Word Wrap</Label>
              <Switch id="wordwrap" checked={wordWrap} onCheckedChange={onWordWrapToggle} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="linenumbers" className="text-sm">Line Numbers</Label>
              <Switch id="linenumbers" checked={lineNumbers} onCheckedChange={onLineNumbersToggle} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Font Size</Label>
            <Slider defaultValue={[14]} min={10} max={24} step={1} />
          </div>
        </div>

        {/* AI Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            AI Assistant
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="autocomplete" className="text-sm">Auto-complete</Label>
              <Switch id="autocomplete" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="suggestions" className="text-sm">Inline Suggestions</Label>
              <Switch id="suggestions" defaultChecked />
            </div>
          </div>
        </div>

        {/* Source Control */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Source Control
          </h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onOpenGitHub}
            >
              <Github className="w-4 h-4" />
              <span className="flex-1 text-left">GitHub</span>
              {isGitHubConnected ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                  Connected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Not connected</span>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onOpenGitLab}
            >
              <GitBranch className="w-4 h-4" />
              <span className="flex-1 text-left">GitLab</span>
              <span className="text-xs text-muted-foreground">Connect</span>
            </Button>
          </div>
        </div>

        {/* Export & Backup */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Export & Backup
          </h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onExport}
            >
              <Download className="w-4 h-4" />
              Export as ZIP
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              disabled
            >
              <Cloud className="w-4 h-4" />
              <span className="flex-1 text-left">Cloud Backup</span>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </Button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 rounded-lg bg-secondary border-2 border-primary text-sm text-center">
              Dark
            </button>
            <button className="p-3 rounded-lg bg-secondary border-2 border-transparent hover:border-border text-sm text-center text-muted-foreground">
              Light
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
