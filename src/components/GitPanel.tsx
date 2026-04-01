import { useState, useCallback } from "react";
import { GitBranch, GitCommit, GitMerge, Plus, Minus, FileText, Check, RefreshCw, ChevronDown, ChevronRight, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface GitChange {
  file: string;
  status: "modified" | "added" | "deleted" | "renamed";
  staged: boolean;
}

interface GitCommitEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

const STATUS_COLORS: Record<string, string> = {
  modified: "text-yellow-400",
  added: "text-green-400",
  deleted: "text-red-400",
  renamed: "text-blue-400",
};

const STATUS_LETTERS: Record<string, string> = {
  modified: "M",
  added: "A",
  deleted: "D",
  renamed: "R",
};

const GitPanel = () => {
  const [currentBranch, setCurrentBranch] = useState("main");
  const [branches] = useState(["main", "develop", "feature/ui-redesign", "feature/auth", "bugfix/preview-error"]);
  const [showBranches, setShowBranches] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showChanges, setShowChanges] = useState(true);
  
  const [changes, setChanges] = useState<GitChange[]>([
    { file: "src/App.tsx", status: "modified", staged: false },
    { file: "src/components/Header.tsx", status: "modified", staged: false },
    { file: "src/components/NewFeature.tsx", status: "added", staged: false },
    { file: "src/styles/old.css", status: "deleted", staged: false },
  ]);

  const [history] = useState<GitCommitEntry[]>([
    { hash: "a3f21b4", message: "Add AI autocomplete feature", author: "You", date: "2 min ago", branch: "main" },
    { hash: "b7c89e1", message: "Fix preview error handling", author: "You", date: "15 min ago", branch: "main" },
    { hash: "c4d56f2", message: "Implement extension marketplace", author: "You", date: "1 hour ago", branch: "main" },
    { hash: "d8e93a7", message: "Add multi-file AI generation", author: "You", date: "3 hours ago", branch: "main" },
    { hash: "e1f42b8", message: "Initial project setup", author: "You", date: "1 day ago", branch: "main" },
  ]);

  const stagedChanges = changes.filter(c => c.staged);
  const unstagedChanges = changes.filter(c => !c.staged);

  const toggleStage = useCallback((file: string) => {
    setChanges(prev => prev.map(c => c.file === file ? { ...c, staged: !c.staged } : c));
  }, []);

  const stageAll = useCallback(() => {
    setChanges(prev => prev.map(c => ({ ...c, staged: true })));
  }, []);

  const unstageAll = useCallback(() => {
    setChanges(prev => prev.map(c => ({ ...c, staged: false })));
  }, []);

  const handleCommit = useCallback(() => {
    if (!commitMessage.trim()) {
      toast.error("Please enter a commit message");
      return;
    }
    if (stagedChanges.length === 0) {
      toast.error("No staged changes to commit");
      return;
    }
    toast.success(`Committed: ${commitMessage}`);
    setChanges(prev => prev.filter(c => !c.staged));
    setCommitMessage("");
  }, [commitMessage, stagedChanges]);

  const handleBranchSwitch = useCallback((branch: string) => {
    setCurrentBranch(branch);
    setShowBranches(false);
    toast.success(`Switched to ${branch}`);
  }, []);

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source Control</h2>
          <div className="flex gap-1">
            <button onClick={() => toast.success("Pulled latest changes")} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Branch selector */}
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-background border border-border text-xs hover:bg-secondary/50 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1 text-left truncate">{currentBranch}</span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showBranches ? "rotate-180" : ""}`} />
          </button>
          
          <AnimatePresence>
            {showBranches && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden"
              >
                {branches.map(branch => (
                  <button
                    key={branch}
                    onClick={() => handleBranchSwitch(branch)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-secondary/50 transition-colors ${
                      branch === currentBranch ? "text-primary bg-primary/10" : "text-foreground"
                    }`}
                  >
                    <GitBranch className="w-3 h-3" />
                    {branch}
                    {branch === currentBranch && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Commit box */}
      <div className="p-3 border-b border-border">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full bg-background text-foreground text-xs px-2 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          rows={2}
        />
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleCommit}
            disabled={stagedChanges.length === 0 || !commitMessage.trim()}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3 h-3" />
            Commit ({stagedChanges.length})
          </button>
          <button
            onClick={() => toast.success("Pushed to remote")}
            className="px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Push
          </button>
          <button
            onClick={() => toast.success("Pulled from remote")}
            className="px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Pull
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        {stagedChanges.length > 0 && (
          <div>
            <button
              onClick={() => {}}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              <span>Staged Changes ({stagedChanges.length})</span>
              <button onClick={unstageAll} className="text-[10px] text-muted-foreground hover:text-foreground px-1">
                <Minus className="w-3 h-3" />
              </button>
            </button>
            {stagedChanges.map(change => (
              <div key={change.file} className="flex items-center gap-2 px-3 py-1 hover:bg-secondary/30 transition-colors group">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="flex-1 text-xs truncate">{change.file.split("/").pop()}</span>
                <span className={`text-[10px] font-mono ${STATUS_COLORS[change.status]}`}>{STATUS_LETTERS[change.status]}</span>
                <button onClick={() => toggleStage(change.file)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Minus className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Unstaged Changes */}
        <div>
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-1">
              {showChanges ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Changes ({unstagedChanges.length})
            </span>
            <button onClick={stageAll} className="text-[10px] text-muted-foreground hover:text-foreground px-1">
              <Plus className="w-3 h-3" />
            </button>
          </button>
          <AnimatePresence>
            {showChanges && unstagedChanges.map(change => (
              <motion.div
                key={change.file}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-3 py-1 hover:bg-secondary/30 transition-colors group"
              >
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="flex-1 text-xs truncate">{change.file}</span>
                <span className={`text-[10px] font-mono ${STATUS_COLORS[change.status]}`}>{STATUS_LETTERS[change.status]}</span>
                <button onClick={() => toggleStage(change.file)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Commit History */}
        <div className="border-t border-border mt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            {showHistory ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Commit History
          </button>
          <AnimatePresence>
            {showHistory && history.map((commit, i) => (
              <motion.div
                key={commit.hash}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-2 hover:bg-secondary/30 transition-colors border-b border-border/30"
              >
                <div className="flex items-center gap-2">
                  <GitCommit className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium truncate flex-1">{commit.message}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 pl-5">
                  <span className="text-[10px] text-muted-foreground font-mono">{commit.hash}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {commit.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GitPanel;
