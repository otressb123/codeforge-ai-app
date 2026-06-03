import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Upload, Download, Link, Unlink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FileNode } from "@/components/FileExplorer";

interface GitLabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  files: FileNode[];
  onPull?: (files: FileNode[]) => void;
}

const LS_KEY = "codeforge-gitlab";

interface GitLabConfig {
  host: string;
  projectPath: string; // e.g. "user/repo"
  token: string;
  branch: string;
}

// Flatten FileNode tree → { path: content } for files only.
function flattenFiles(nodes: FileNode[], prefix = ""): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  for (const n of nodes) {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === "folder" && n.children) {
      out.push(...flattenFiles(n.children, p));
    } else if (n.type === "file") {
      out.push({ path: p, content: n.content ?? "" });
    }
  }
  return out;
}

// Build FileNode tree from { path: content } pairs.
function unflattenFiles(items: { path: string; content: string }[]): FileNode[] {
  const root: FileNode[] = [];
  for (const { path, content } of items) {
    const parts = path.split("/");
    let level = root;
    parts.forEach((name, i) => {
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = isFile
          ? { name, type: "file", content }
          : { name, type: "folder", children: [] };
        level.push(node);
      }
      if (!isFile) level = node.children!;
    });
  }
  return root;
}

// Parse "https://gitlab.com/user/repo" or "https://gitlab.example/group/sub/repo".
function parseRepoUrl(url: string): { host: string; projectPath: string } | null {
  try {
    const u = new URL(url.replace(/\.git$/, ""));
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!path.includes("/")) return null;
    return { host: `${u.protocol}//${u.host}`, projectPath: path };
  } catch {
    return null;
  }
}

async function gitlabFetch(cfg: GitLabConfig, path: string, init: RequestInit = {}) {
  const projectId = encodeURIComponent(cfg.projectPath);
  const res = await fetch(`${cfg.host}/api/v4/projects/${projectId}${path}`, {
    ...init,
    headers: {
      "PRIVATE-TOKEN": cfg.token,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitLab API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

const GitLabDialog = ({ open, onOpenChange, files, onPull }: GitLabDialogProps) => {
  const [cfg, setCfg] = useState<GitLabConfig | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [branch, setBranch] = useState("main");
  const [branches, setBranches] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Restore saved config.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCfg(JSON.parse(raw));
    } catch {}
  }, []);

  const saveCfg = (next: GitLabConfig) => {
    setCfg(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  // Load branches when connected / dialog opens.
  useEffect(() => {
    if (!cfg || !open) return;
    gitlabFetch(cfg, "/repository/branches?per_page=100")
      .then((data: Array<{ name: string }>) => setBranches(data.map((b) => b.name)))
      .catch(() => setBranches([cfg.branch]));
  }, [cfg, open]);

  const handleConnect = async () => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      toast.error("Invalid GitLab URL");
      return;
    }
    if (!token.trim()) {
      toast.error("Personal access token required");
      return;
    }
    setBusy("connect");
    try {
      const next: GitLabConfig = { ...parsed, token: token.trim(), branch };
      // Validate by fetching project info.
      await gitlabFetch(next, "");
      saveCfg(next);
      toast.success("Connected to GitLab");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(LS_KEY);
    setCfg(null);
    setRepoUrl("");
    setToken("");
    setBranches([]);
  };

  const handlePush = async () => {
    if (!cfg || !commitMessage.trim()) return;
    setBusy("push");
    try {
      // Fetch existing tree to decide create vs update per file.
      const existing = await gitlabFetch(
        cfg,
        `/repository/tree?ref=${encodeURIComponent(cfg.branch)}&recursive=true&per_page=100`,
      ).catch(() => [] as Array<{ path: string; type: string }>);
      const existingFiles = new Set(
        (existing as Array<{ path: string; type: string }>)
          .filter((e) => e.type === "blob")
          .map((e) => e.path),
      );

      const local = flattenFiles(files);
      const actions = local.map((f) => ({
        action: existingFiles.has(f.path) ? "update" : "create",
        file_path: f.path,
        content: f.content,
      }));

      await gitlabFetch(cfg, "/repository/commits", {
        method: "POST",
        body: JSON.stringify({
          branch: cfg.branch,
          commit_message: commitMessage,
          actions,
        }),
      });
      toast.success(`Pushed ${actions.length} files to ${cfg.branch}`);
      setCommitMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Push failed");
    } finally {
      setBusy(null);
    }
  };

  const handlePull = async () => {
    if (!cfg) return;
    setBusy("pull");
    try {
      const tree = (await gitlabFetch(
        cfg,
        `/repository/tree?ref=${encodeURIComponent(cfg.branch)}&recursive=true&per_page=100`,
      )) as Array<{ path: string; type: string }>;
      const blobs = tree.filter((t) => t.type === "blob");
      const fetched = await Promise.all(
        blobs.map(async (b) => {
          const data = await gitlabFetch(
            cfg,
            `/repository/files/${encodeURIComponent(b.path)}/raw?ref=${encodeURIComponent(cfg.branch)}`,
            { headers: { Accept: "text/plain" } },
          ).catch(async () => {
            // raw endpoint returns plain text, not JSON — re-fetch as text
            const res = await fetch(
              `${cfg.host}/api/v4/projects/${encodeURIComponent(cfg.projectPath)}/repository/files/${encodeURIComponent(b.path)}/raw?ref=${encodeURIComponent(cfg.branch)}`,
              { headers: { "PRIVATE-TOKEN": cfg.token } },
            );
            return res.text();
          });
          return { path: b.path, content: typeof data === "string" ? data : JSON.stringify(data) };
        }),
      );
      onPull?.(unflattenFiles(fetched));
      toast.success(`Pulled ${fetched.length} files from ${cfg.branch}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pull failed");
    } finally {
      setBusy(null);
    }
  };

  const handleBranchChange = (b: string) => {
    if (!cfg) return;
    saveCfg({ ...cfg, branch: b });
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
            Push and pull your project to a real GitLab repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!cfg ? (
            <>
              <div className="space-y-2">
                <Label>Repository URL</Label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://gitlab.com/username/repo"
                  className="bg-input border-border font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Personal Access Token</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  className="bg-input border-border font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Create a token with <code className="text-foreground">api</code> scope at GitLab → User Settings → Access Tokens. Stored locally in your browser only.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Default Branch</Label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="bg-input border-border font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleConnect}
                disabled={!repoUrl || !token || busy === "connect"}
                className="w-full gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90"
              >
                {busy === "connect" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                Connect to GitLab
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Connected
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
                  {cfg.host}/{cfg.projectPath}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={cfg.branch} onValueChange={handleBranchChange}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(branches.length ? branches : [cfg.branch]).map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Button
                  onClick={handlePush}
                  disabled={!commitMessage.trim() || !!busy}
                  variant="outline"
                  className="gap-2"
                >
                  {busy === "push" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Push
                </Button>
                <Button onClick={handlePull} disabled={!!busy} variant="outline" className="gap-2">
                  {busy === "pull" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Pull
                </Button>
              </div>

              <Button
                onClick={handleDisconnect}
                variant="ghost"
                className="w-full gap-2 text-destructive hover:text-destructive"
              >
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
