// Project version history — snapshot the file tree on every AI apply.
// Lets users roll back like Lovable's git history (but localStorage-backed).

import type { FileNode } from "@/components/FileExplorer";

const KEY = "codeforge:history:v1";
const MAX_SNAPSHOTS = 30;

export interface Snapshot {
  id: string;
  ts: number;
  label: string;
  files: FileNode[];
}

export const loadHistory = (): Snapshot[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveHistory = (snaps: Snapshot[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(snaps.slice(-MAX_SNAPSHOTS)));
  } catch {}
};

export const pushSnapshot = (label: string, files: FileNode[]): Snapshot => {
  const list = loadHistory();
  const snap: Snapshot = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    label,
    files: JSON.parse(JSON.stringify(files)),
  };
  list.push(snap);
  saveHistory(list);
  return snap;
};

export const clearHistory = () => {
  try { localStorage.removeItem(KEY); } catch {}
};
