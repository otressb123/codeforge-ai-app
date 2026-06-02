// Agent tool layer: lets the AI act on the project via discrete tool calls
// instead of dumping whole files into chat.
//
// Tool block format (parsed from AI stream):
//
//   ```tool:read
//   path: /src/App.tsx
//   ```
//
//   ```tool:write
//   path: /src/components/Hero.tsx
//   ---
//   <full new file content>
//   ```
//
//   ```tool:replace
//   path: /src/App.tsx
//   ---SEARCH---
//   <exact existing snippet>
//   ---REPLACE---
//   <new snippet>
//   ```
//
//   ```tool:delete
//   path: /src/foo.tsx
//   ```
//
//   ```tool:list
//   ```
//
//   ```tool:done
//   summary: short final note to the user
//   ```

import type { FileNode } from "@/components/FileExplorer";

export type ToolName = "read" | "write" | "replace" | "delete" | "list" | "done" | "screenshot" | "preview" | "search";

export const ASYNC_TOOLS = new Set<ToolName>(["screenshot", "preview", "search"]);


export interface ToolCall {
  name: ToolName;
  path?: string;
  body?: string;       // for write
  search?: string;     // for replace
  replace?: string;    // for replace
  summary?: string;    // for done
  raw: string;
}

export interface ToolResult {
  call: ToolCall;
  ok: boolean;
  output: string;
}

// ─── Parsing ──────────────────────────────────────────────────────────────

const TOOL_RE = /```tool:(\w+)\s*\n([\s\S]*?)```/g;

export const parseToolCalls = (text: string): ToolCall[] => {
  const out: ToolCall[] = [];
  let m: RegExpExecArray | null;
  TOOL_RE.lastIndex = 0;
  while ((m = TOOL_RE.exec(text)) !== null) {
    const name = m[1] as ToolName;
    const body = m[2];
    if (!["read", "write", "replace", "delete", "list", "done", "screenshot", "preview", "search"].includes(name)) continue;

    const call: ToolCall = { name, raw: m[0] };
    const pathMatch = body.match(/^\s*path:\s*([^\n]+)/);
    if (pathMatch) call.path = pathMatch[1].trim();

    if (name === "write") {
      const sep = body.indexOf("\n---\n");
      call.body = sep >= 0 ? body.slice(sep + 5) : body.replace(/^\s*path:[^\n]*\n?/, "");
    } else if (name === "replace") {
      const s = body.indexOf("---SEARCH---");
      const r = body.indexOf("---REPLACE---");
      if (s >= 0 && r > s) {
        call.search = body.slice(s + 12, r).replace(/^\n/, "").replace(/\n$/, "");
        call.replace = body.slice(r + 13).replace(/^\n/, "").replace(/\n+$/, "\n").replace(/\n$/, "");
      }
    } else if (name === "done") {
      const sm = body.match(/summary:\s*([\s\S]+)/);
      if (sm) call.summary = sm[1].trim();
    } else if (name === "search") {
      const q = body.match(/query:\s*([^\n]+)/);
      if (q) (call as any).query = q[1].trim();
    }

    out.push(call);
  }
  return out;
};

// ─── File-tree helpers (immutable updates) ───────────────────────────────

const norm = (p: string) => (p.startsWith("/") ? p : `/${p}`).replace(/\/+/g, "/");

export const flatten = (nodes: FileNode[], base = ""): { path: string; content: string }[] => {
  const out: { path: string; content: string }[] = [];
  for (const n of nodes) {
    const p = `${base}/${n.name}`;
    if (n.type === "file") out.push({ path: p, content: n.content || "" });
    if (n.children) out.push(...flatten(n.children, p));
  }
  return out;
};

export const readFile = (nodes: FileNode[], path: string): string | null => {
  const target = norm(path);
  for (const f of flatten(nodes)) if (f.path === target) return f.content;
  return null;
};

const upsert = (
  nodes: FileNode[],
  parts: string[],
  fileName: string,
  content: string
): FileNode[] => {
  if (parts.length === 0) {
    const idx = nodes.findIndex((n) => n.name === fileName && n.type === "file");
    if (idx >= 0) return nodes.map((n, i) => (i === idx ? { ...n, content } : n));
    return [...nodes, { name: fileName, type: "file", content }];
  }
  const [head, ...rest] = parts;
  const idx = nodes.findIndex((n) => n.name === head && n.type === "folder");
  if (idx >= 0) {
    return nodes.map((n, i) =>
      i === idx ? { ...n, children: upsert(n.children || [], rest, fileName, content) } : n
    );
  }
  return [
    ...nodes,
    { name: head, type: "folder", children: upsert([], rest, fileName, content) },
  ];
};

export const writeFile = (nodes: FileNode[], path: string, content: string): FileNode[] => {
  const parts = norm(path).split("/").filter(Boolean);
  const fileName = parts.pop()!;
  return upsert(nodes, parts, fileName, content);
};

const removeAt = (nodes: FileNode[], parts: string[]): FileNode[] => {
  if (parts.length === 1) return nodes.filter((n) => n.name !== parts[0]);
  const [head, ...rest] = parts;
  return nodes.map((n) =>
    n.type === "folder" && n.name === head
      ? { ...n, children: removeAt(n.children || [], rest) }
      : n
  );
};

export const deleteFile = (nodes: FileNode[], path: string): FileNode[] => {
  const parts = norm(path).split("/").filter(Boolean);
  return removeAt(nodes, parts);
};

// ─── Tool execution ───────────────────────────────────────────────────────

export const executeTool = (
  call: ToolCall,
  nodes: FileNode[]
): { result: ToolResult; nextNodes: FileNode[] } => {
  let nextNodes = nodes;
  let ok = true;
  let output = "";

  try {
    if (call.name === "read") {
      const content = readFile(nodes, call.path || "");
      if (content === null) { ok = false; output = `ERROR: file not found: ${call.path}`; }
      else output = `FILE ${call.path} (${content.length} chars):\n${content}`;
    } else if (call.name === "write") {
      if (!call.path) { ok = false; output = "ERROR: write requires path"; }
      else {
        nextNodes = writeFile(nodes, call.path, call.body || "");
        output = `OK wrote ${call.path} (${(call.body || "").length} chars)`;
      }
    } else if (call.name === "replace") {
      if (!call.path || call.search === undefined || call.replace === undefined) {
        ok = false; output = "ERROR: replace needs path + ---SEARCH--- + ---REPLACE---";
      } else {
        const cur = readFile(nodes, call.path);
        if (cur === null) { ok = false; output = `ERROR: file not found: ${call.path}`; }
        else if (!cur.includes(call.search)) {
          ok = false;
          output = `ERROR: search snippet not found in ${call.path}. Read the file again and use an exact match.`;
        } else {
          const updated = cur.replace(call.search, call.replace);
          nextNodes = writeFile(nodes, call.path, updated);
          output = `OK replaced in ${call.path}`;
        }
      }
    } else if (call.name === "delete") {
      if (!call.path) { ok = false; output = "ERROR: delete requires path"; }
      else {
        nextNodes = deleteFile(nodes, call.path);
        output = `OK deleted ${call.path}`;
      }
    } else if (call.name === "list") {
      output = "FILES:\n" + flatten(nodes).map((f) => `  ${f.path} (${f.content.length})`).join("\n");
    } else if (call.name === "done") {
      output = `DONE: ${call.summary || ""}`;
    }
  } catch (e) {
    ok = false;
    output = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return { result: { call, ok, output }, nextNodes };
};
