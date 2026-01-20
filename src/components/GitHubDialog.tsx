import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Github, Link, GitBranch, Upload, Download, Check, Loader2, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GitHubState {
  isConnected: boolean;
  username?: string;
  avatarUrl?: string;
  repository?: {
    name: string;
    url: string;
    isPrivate: boolean;
  };
  lastSync?: Date;
}

interface ChangedFile {
  path: string;
  status: "added" | "modified" | "deleted";
}

interface GitHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConnect?: () => void;
  onPush?: (message: string) => void;
  onPull?: () => void;
}

const GitHubDialog = ({
  open,
  onOpenChange,
  projectName,
  onConnect,
  onPush,
  onPull,
}: GitHubDialogProps) => {
  const [gitHubState, setGitHubState] = useState<GitHubState>({
    isConnected: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [repoName, setRepoName] = useState(projectName);
  const [isPrivate, setIsPrivate] = useState(true);
  const [commitMessage, setCommitMessage] = useState("");
  const [changedFiles] = useState<ChangedFile[]>([
    { path: "src/App.tsx", status: "modified" },
    { path: "src/components/Button.tsx", status: "modified" },
    { path: "src/components/NewComponent.tsx", status: "added" },
  ]);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGitHubState({
      isConnected: true,
      username: "developer",
      avatarUrl: "https://github.com/github.png",
    });
    setIsConnecting(false);
    onConnect?.();
  };

  const handleDisconnect = () => {
    setGitHubState({ isConnected: false });
  };

  const handleCreateRepo = async () => {
    if (!repoName.trim()) return;
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setGitHubState((prev) => ({
      ...prev,
      repository: {
        name: repoName,
        url: `https://github.com/${gitHubState.username}/${repoName}`,
        isPrivate,
      },
    }));
    setIsConnecting(false);
  };

  const handlePush = async () => {
    if (!commitMessage.trim()) return;
    setIsPushing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGitHubState((prev) => ({
      ...prev,
      lastSync: new Date(),
    }));
    setIsPushing(false);
    setCommitMessage("");
    onPush?.(commitMessage);
  };

  const handlePull = async () => {
    setIsPulling(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setGitHubState((prev) => ({
      ...prev,
      lastSync: new Date(),
    }));
    setIsPulling(false);
    onPull?.();
  };

  const getStatusColor = (status: ChangedFile["status"]) => {
    switch (status) {
      case "added":
        return "text-success";
      case "modified":
        return "text-warning";
      case "deleted":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: ChangedFile["status"]) => {
    switch (status) {
      case "added":
        return "A";
      case "modified":
        return "M";
      case "deleted":
        return "D";
      default:
        return "?";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Github className="w-5 h-5" />
            GitHub Integration
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="connect" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="connect" className="gap-2">
              <Link className="w-4 h-4" />
              Connect
            </TabsTrigger>
            <TabsTrigger
              value="repository"
              disabled={!gitHubState.isConnected}
              className="gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Repository
            </TabsTrigger>
            <TabsTrigger
              value="sync"
              disabled={!gitHubState.repository}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Sync
            </TabsTrigger>
          </TabsList>

          {/* Connect Tab */}
          <TabsContent value="connect" className="space-y-4 mt-4">
            <AnimatePresence mode="wait">
              {!gitHubState.isConnected ? (
                <motion.div
                  key="disconnected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <Github className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Connect to GitHub
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Push your projects to GitHub for version control and collaboration
                    </p>
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="gap-2"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                      {isConnecting ? "Connecting..." : "Connect GitHub Account"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                        {gitHubState.avatarUrl ? (
                          <img
                            src={gitHubState.avatarUrl}
                            alt={gitHubState.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 m-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-sidebar flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        @{gitHubState.username}
                      </p>
                      <p className="text-sm text-muted-foreground">Connected</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </Button>
                  </div>

                  {gitHubState.repository && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="w-4 h-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {gitHubState.repository.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                          {gitHubState.repository.isPrivate ? "Private" : "Public"}
                        </span>
                      </div>
                      <a
                        href={gitHubState.repository.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {gitHubState.repository.url}
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Repository Tab */}
          <TabsContent value="repository" className="space-y-4 mt-4">
            {!gitHubState.repository ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repoName">Repository Name</Label>
                  <Input
                    id="repoName"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="private">Private Repository</Label>
                    <p className="text-xs text-muted-foreground">
                      Only you can see this repository
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>

                <Button
                  onClick={handleCreateRepo}
                  disabled={!repoName.trim() || isConnecting}
                  className="w-full gap-2"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <GitBranch className="w-4 h-4" />
                  )}
                  {isConnecting ? "Creating..." : "Create Repository"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Repository Connected
                </h3>
                <p className="text-sm text-muted-foreground">
                  {gitHubState.repository.name} is ready for sync
                </p>
              </div>
            )}
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Changed Files */}
              <div className="space-y-2">
                <Label className="text-sm">Changed Files ({changedFiles.length})</Label>
                <ScrollArea className="h-[120px] rounded-lg border border-border bg-secondary/30">
                  <div className="p-2 space-y-1">
                    {changedFiles.map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-secondary"
                      >
                        <span
                          className={`font-mono text-xs ${getStatusColor(
                            file.status
                          )}`}
                        >
                          {getStatusLabel(file.status)}
                        </span>
                        <span className="text-muted-foreground truncate">
                          {file.path}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Commit Message */}
              <div className="space-y-2">
                <Label htmlFor="commitMessage">Commit Message</Label>
                <Input
                  id="commitMessage"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe your changes..."
                  className="bg-secondary border-border"
                />
              </div>

              {/* Push / Pull Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handlePush}
                  disabled={!commitMessage.trim() || isPushing}
                  className="gap-2"
                >
                  {isPushing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isPushing ? "Pushing..." : "Push"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePull}
                  disabled={isPulling}
                  className="gap-2"
                >
                  {isPulling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isPulling ? "Pulling..." : "Pull"}
                </Button>
              </div>

              {/* Last Sync */}
              {gitHubState.lastSync && (
                <p className="text-xs text-muted-foreground text-center">
                  Last synced: {gitHubState.lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubDialog;
