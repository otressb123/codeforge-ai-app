import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranch, Upload, Download, Link, Unlink } from "lucide-react";

interface GitLabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConnect?: () => void;
  onPush?: (message: string) => void;
  onPull?: () => void;
}

const GitLabDialog = ({ open, onOpenChange, projectName, onConnect, onPush, onPull }: GitLabDialogProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    if (!repoUrl) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      onConnect?.();
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setRepoUrl("");
  };

  const handlePush = () => {
    if (!commitMessage.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onPush?.(commitMessage);
      setCommitMessage("");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            GitLab Integration
          </DialogTitle>
          <DialogDescription>
            Connect your project to a GitLab repository for version control
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label>GitLab Repository URL</Label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://gitlab.com/username/repo"
                  className="bg-input border-border font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the URL of your GitLab repository. Make sure you have push access.
              </p>
              <Button onClick={handleConnect} disabled={!repoUrl || isLoading} className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90">
                <Link className="w-4 h-4" />
                {isLoading ? "Connecting..." : "Connect to GitLab"}
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Connected to GitLab
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{repoUrl}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Commit Message</Label>
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="feat: update project files"
                    className="bg-input border-border text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handlePush} disabled={!commitMessage.trim() || isLoading} variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    {isLoading ? "Pushing..." : "Push"}
                  </Button>
                  <Button onClick={() => { onPull?.(); }} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Pull
                  </Button>
                </div>
              </div>

              <Button onClick={handleDisconnect} variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
                <Unlink className="w-4 h-4" />
                Disconnect
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitLabDialog;
