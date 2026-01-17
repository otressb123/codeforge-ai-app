import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const TerminalPanel = () => {
  const [history, setHistory] = useState<string[]>([
    "$ Welcome to CodeForge Terminal",
    "$ Type 'help' for available commands",
    "",
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const commands: Record<string, string[]> = {
      help: [
        "Available commands:",
        "  help     - Show this help message",
        "  clear    - Clear terminal",
        "  npm      - Run npm commands",
        "  version  - Show version info",
      ],
      clear: [],
      version: ["CodeForge IDE v1.0.0", "Node.js v18.17.0", "npm v9.8.1"],
      npm: ["npm commands are simulated in this demo"],
    };

    const trimmedCmd = cmd.trim().toLowerCase();
    const baseCmd = trimmedCmd.split(" ")[0];

    if (baseCmd === "clear") {
      setHistory([]);
      return;
    }

    const output = commands[baseCmd] || [`Command not found: ${trimmedCmd}`];
    setHistory((prev) => [...prev, `$ ${cmd}`, ...output, ""]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput("");
    }
  };

  return (
    <div className="h-full bg-sidebar flex flex-col font-mono text-sm">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <div className="w-3 h-3 rounded-full bg-warning" />
          <div className="w-3 h-3 rounded-full bg-success" />
        </div>
        <span className="text-xs text-muted-foreground">Terminal</span>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 scrollbar-thin"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${line.startsWith("$") ? "text-success" : "text-foreground/80"}`}
          >
            {line || "\u00A0"}
          </motion.div>
        ))}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-success">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground caret-primary"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

export default TerminalPanel;
