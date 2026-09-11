import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Loader2, Trash2, FileCode2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;

declare global {
  interface Window {
    loadPyodide?: (opts?: { indexURL?: string }) => Promise<any>;
    __pyodide?: any;
  }
}

const DEFAULT_CODE = `# Real Python, running in your browser (no server needed)
import math, json

def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("fib(20) =", fib(20))
print("sqrt(2)  =", round(math.sqrt(2), 6))
print(json.dumps({"engine": "pyodide", "offline": True}, indent=2))
`;

interface PythonPanelProps {
  pyFiles?: { path: string; content: string }[];
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide"));
    document.head.appendChild(s);
  });

const PythonPanel = ({ pyFiles = [] }: PythonPanelProps) => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [booting, setBooting] = useState(false);
  const [ready, setReady] = useState(!!window.__pyodide);
  const [running, setRunning] = useState(false);
  const [pkg, setPkg] = useState("");
  const [installing, setInstalling] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  const append = useCallback((line: string) => {
    setOutput((prev) => [...prev, line]);
  }, []);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [output]);

  const boot = useCallback(async () => {
    if (window.__pyodide) {
      setReady(true);
      return window.__pyodide;
    }
    setBooting(true);
    append("[python] downloading runtime (~10 MB, cached after first run)…");
    try {
      await loadScript(PYODIDE_URL);
      const py = await window.loadPyodide!({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
      });
      py.setStdout({ batched: (s: string) => append(s) });
      py.setStderr({ batched: (s: string) => append(`⚠ ${s}`) });
      window.__pyodide = py;
      setReady(true);
      append(`[python] ready · Python ${py.version ?? "3.x"}`);
      return py;
    } catch (e: any) {
      append(`✗ ${e?.message || "Could not start Python"}`);
      toast.error("Python runtime failed to load", { description: "Check your connection and try again." });
      return null;
    } finally {
      setBooting(false);
    }
  }, [append]);

  const run = useCallback(async () => {
    const py = await boot();
    if (!py) return;
    setRunning(true);
    append("▶ running…");
    try {
      const result = await py.runPythonAsync(code);
      if (result !== undefined && result !== null) append(String(result));
      append("✓ finished");
    } catch (e: any) {
      append(`✗ ${e?.message || String(e)}`);
    } finally {
      setRunning(false);
    }
  }, [boot, code, append]);

  const installPackage = useCallback(async () => {
    const name = pkg.trim();
    if (!name) return;
    const py = await boot();
    if (!py) return;
    setInstalling(true);
    append(`[pip] installing ${name}…`);
    try {
      await py.loadPackage("micropip");
      const micropip = py.pyimport("micropip");
      await micropip.install(name);
      append(`✓ installed ${name}`);
      setPkg("");
      toast.success(`Installed ${name}`);
    } catch (e: any) {
      append(`✗ ${e?.message || `Could not install ${name}`}`);
      toast.error(`Could not install ${name}`);
    } finally {
      setInstalling(false);
    }
  }, [pkg, boot, append]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-primary" />
          Python
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {ready ? "runtime ready" : booting ? "starting…" : "offline-capable (WASM)"}
        </span>
      </div>

      {pyFiles.length > 0 && (
        <div className="px-3 py-2 border-b border-border flex gap-1 flex-wrap">
          {pyFiles.map((f) => (
            <button
              key={f.path}
              onClick={() => setCode(f.content)}
              className="text-[10px] px-2 py-1 rounded bg-secondary/60 hover:bg-secondary text-foreground/80"
              title={`Load ${f.path}`}
            >
              {f.path.split("/").pop()}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs gap-1" onClick={run} disabled={running || booting}>
          {running || booting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Run
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={() => setOutput([])}
          disabled={output.length === 0}
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </Button>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className="flex-1 min-h-[160px] resize-none bg-background/60 px-3 py-2 font-mono text-xs outline-none border-b border-border"
      />

      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Package className="w-3 h-3 text-muted-foreground" />
        <Input
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && installPackage()}
          placeholder="package name (e.g. numpy)"
          className="h-7 text-xs"
        />
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={installPackage} disabled={installing}>
          {installing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Install"}
        </Button>
      </div>

      <ScrollArea className="h-48">
        <div ref={outRef} className="px-3 py-2 font-mono text-[11px] whitespace-pre-wrap">
          {output.length === 0 ? (
            <p className="text-muted-foreground">Output appears here.</p>
          ) : (
            output.map((l, i) => (
              <div
                key={i}
                className={l.startsWith("✗") || l.startsWith("⚠") ? "text-destructive" : l.startsWith("✓") ? "text-primary" : ""}
              >
                {l}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PythonPanel;
