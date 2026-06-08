// Real, persistent extension system.
// Extensions live in localStorage. Their *effects* are wired in the UI
// (CodeEditor, IDE) by checking `isInstalled(id)` at runtime.

import { MONACO_THEMES } from "./monacoThemes";

export type ExtCategory = "ai" | "themes" | "languages" | "utilities" | "all";

export interface ExtensionDef {
  id: string;
  name: string;
  author: string;
  description: string;
  category: Exclude<ExtCategory, "all">;
  downloads: number;
  rating: number;
  icon: string;
  version: string;
  // Optional runtime hooks (kept simple; UI checks these via isInstalled)
  themeId?: string;        // for theme extensions, the Monaco theme to apply
  command?: string;        // a command label users can run (Cmd-K menu integration)
  builtIn?: boolean;       // ships pre-installed and cannot be removed
}

const LS_INSTALLED = "codeforge-installed-extensions";
const LS_ACTIVE_THEME_EXT = "codeforge-active-theme-extension";

// Pre-installed defaults that ship with CodeForge
const DEFAULT_INSTALLED = [
  "ai-copilot",
  "ai-chat-pro",
  "lang-tailwind",
  "util-prettier",
  "util-eslint",
];

export const EXTENSION_REGISTRY: ExtensionDef[] = [
  // ── AI (real VS Code marketplace AI extensions) ────────────────────
  { id: "ai-copilot", name: "GitHub Copilot", author: "GitHub", description: "Your AI pair programmer. Get inline suggestions and completions powered by OpenAI Codex.", category: "ai", downloads: 28400000, rating: 4.6, icon: "🤖", version: "1.247.0", command: "Toggle Copilot", builtIn: true },
  { id: "ai-copilot-chat", name: "GitHub Copilot Chat", author: "GitHub", description: "AI chat features powered by Copilot. Ask questions, explain code, fix bugs, and generate tests.", category: "ai", downloads: 18900000, rating: 4.5, icon: "💬", version: "0.24.0", builtIn: true },
  { id: "ai-codeium", name: "Codeium", author: "Codeium", description: "Free AI code completion, chat, and search. Supports 70+ languages.", category: "ai", downloads: 6800000, rating: 4.7, icon: "⚡", version: "1.40.0" },
  { id: "ai-tabnine", name: "Tabnine AI Autocomplete", author: "Tabnine", description: "AI-powered code completions for all major languages and frameworks.", category: "ai", downloads: 11200000, rating: 4.3, icon: "🧠", version: "3.107.0" },
  { id: "ai-continue", name: "Continue", author: "Continue", description: "Open-source AI code assistant. Bring your own model (OpenAI, Anthropic, Ollama).", category: "ai", downloads: 1400000, rating: 4.6, icon: "🔗", version: "0.9.260", command: "Refactor selection" },
  { id: "ai-cline", name: "Cline", author: "saoudrizwan", description: "Autonomous coding agent that can edit files, run commands, and use the browser.", category: "ai", downloads: 2100000, rating: 4.8, icon: "🦾", version: "3.2.0" },
  { id: "ai-byok", name: "BYOK Providers", author: "CodeForge", description: "Bring your own API keys: OpenAI, OpenRouter, Groq, Anthropic, DeepSeek, and more.", category: "ai", downloads: 9800, rating: 4.9, icon: "🔑", version: "1.0.0" },

  // ── Themes (real VS Code themes — flip Monaco theme on install) ────
  { id: "theme-dracula", name: "Dracula Official", author: "Dracula Theme", description: "Official Dracula Theme. A dark theme for many editors, shells, and more.", category: "themes", downloads: 7800000, rating: 4.8, icon: "🧛", version: "2.24.3", themeId: "dracula" },
  { id: "theme-nord", name: "Nord", author: "Arctic Ice Studio", description: "An arctic, north-bluish clean and elegant Visual Studio Code theme.", category: "themes", downloads: 1200000, rating: 4.7, icon: "❄️", version: "0.19.0", themeId: "nord" },
  { id: "theme-monokai", name: "Monokai Pro", author: "monokai", description: "Professional theme and icon set inspired by the original Monokai.", category: "themes", downloads: 3400000, rating: 4.7, icon: "🎨", version: "1.3.4", themeId: "monokai" },
  { id: "theme-github", name: "GitHub Theme", author: "GitHub", description: "GitHub's official themes for VS Code. Light and dark.", category: "themes", downloads: 9100000, rating: 4.6, icon: "🐙", version: "6.3.4", themeId: "github-dark" },
  { id: "theme-tokyo-night", name: "Tokyo Night", author: "enkia", description: "A clean dark theme celebrating the lights of Downtown Tokyo at night.", category: "themes", downloads: 2500000, rating: 4.9, icon: "🌃", version: "1.1.2", themeId: "tokyo-night" },

  // ── Languages (real VS Code language extensions) ───────────────────
  { id: "lang-python", name: "Python", author: "Microsoft", description: "IntelliSense (Pylance), linting, debugging, code formatting, refactoring, and more.", category: "languages", downloads: 145000000, rating: 4.2, icon: "🐍", version: "2024.20.0" },
  { id: "lang-rust", name: "rust-analyzer", author: "The Rust Programming Language", description: "Rust language support: completion, go-to-definition, refactorings.", category: "languages", downloads: 4200000, rating: 4.6, icon: "🦀", version: "0.3.2117" },
  { id: "lang-go", name: "Go", author: "Go Team at Google", description: "Rich Go language support: IntelliSense, code navigation, debugging.", category: "languages", downloads: 11800000, rating: 4.5, icon: "🔵", version: "0.42.1" },
  { id: "lang-tailwind", name: "Tailwind CSS IntelliSense", author: "Tailwind Labs", description: "Intelligent Tailwind CSS tooling: autocomplete, linting, hover previews.", category: "languages", downloads: 12500000, rating: 4.9, icon: "💨", version: "0.12.18", builtIn: true },
  { id: "lang-prisma", name: "Prisma", author: "Prisma", description: "Adds syntax highlighting, formatting, jump-to-definition for Prisma Schema files.", category: "languages", downloads: 2800000, rating: 4.7, icon: "💎", version: "6.1.0" },
  { id: "lang-vue", name: "Vue - Official", author: "Vue", description: "Language support for Vue 3, including Volar IntelliSense.", category: "languages", downloads: 8900000, rating: 4.4, icon: "🟢", version: "2.1.10" },

  // ── Utilities (real VS Code marketplace utilities) ─────────────────
  { id: "util-prettier", name: "Prettier - Code formatter", author: "Prettier", description: "Code formatter using prettier. Supports JS, TS, CSS, JSON, Markdown, and more.", category: "utilities", downloads: 49000000, rating: 4.4, icon: "✨", version: "11.0.0", command: "Format Document", builtIn: true },
  { id: "util-eslint", name: "ESLint", author: "Microsoft", description: "Integrates ESLint into VS Code. Lint JavaScript and TypeScript projects.", category: "utilities", downloads: 41000000, rating: 4.4, icon: "🔍", version: "3.0.10", builtIn: true },
  { id: "util-todo", name: "Todo Tree", author: "Gruntfuggly", description: "Show TODO, FIXME, etc. comment tags in a tree view.", category: "utilities", downloads: 7600000, rating: 4.7, icon: "🌳", version: "0.0.226" },
  { id: "util-gitlens", name: "GitLens — Git supercharged", author: "GitKraken", description: "Supercharge Git within VS Code. Visualize code authorship, navigate history.", category: "utilities", downloads: 36000000, rating: 4.7, icon: "🔮", version: "16.0.5", command: "Open Git Panel" },
  { id: "util-markdown", name: "Markdown All in One", author: "Yu Zhang", description: "All you need for Markdown: keyboard shortcuts, table of contents, auto preview.", category: "utilities", downloads: 9800000, rating: 4.8, icon: "📖", version: "3.6.2" },
  { id: "util-live-server", name: "Live Server", author: "Ritwick Dey", description: "Launch a development local Server with live reload feature for static & dynamic pages.", category: "utilities", downloads: 56000000, rating: 4.7, icon: "🚀", version: "5.7.9" },
  { id: "util-error-lens", name: "Error Lens", author: "Alexander", description: "Improve highlighting of errors, warnings, and other language diagnostics inline.", category: "utilities", downloads: 7400000, rating: 4.9, icon: "🔦", version: "3.22.0" },
  { id: "util-path-intellisense", name: "Path Intellisense", author: "Christian Kohler", description: "Visual Studio Code plugin that autocompletes filenames.", category: "utilities", downloads: 18000000, rating: 4.8, icon: "📂", version: "2.10.0" },
  { id: "util-docker", name: "Docker", author: "Microsoft", description: "Makes it easy to create, manage, and debug containerized applications.", category: "utilities", downloads: 32000000, rating: 4.3, icon: "🐳", version: "1.29.4" },
  { id: "util-pomodoro", name: "Pomodoro Timer", author: "ProdTools", description: "Floating 25/5 focus timer in the status bar.", category: "utilities", downloads: 85000, rating: 4.2, icon: "🍅", version: "1.0.0", command: "Start Pomodoro" },
];

// Map our themeId aliases to actual MONACO_THEMES ids
const MONACO_THEME_ALIASES: Record<string, string> = {
  "dracula": "dracula",
  "nord": "nord",
  "monokai": "monokai",
  "github-dark": "github-dark",
  "tokyo-night": "tokyo-night",
};

export function getMonacoThemeId(extThemeId: string): string | null {
  const alias = MONACO_THEME_ALIASES[extThemeId];
  if (!alias) return null;
  const found = MONACO_THEMES.find(
    (t) => t.id === alias || t.id.includes(alias) || t.name.toLowerCase().includes(alias)
  );
  return found?.id || null;
}

// ────────────────────────────────────────────────
// Persistence
// ────────────────────────────────────────────────

export function loadInstalled(): string[] {
  try {
    const raw = localStorage.getItem(LS_INSTALLED);
    if (raw) return JSON.parse(raw);
  } catch {}
  // First-run defaults
  localStorage.setItem(LS_INSTALLED, JSON.stringify(DEFAULT_INSTALLED));
  return [...DEFAULT_INSTALLED];
}

export function saveInstalled(ids: string[]): void {
  localStorage.setItem(LS_INSTALLED, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("codeforge-extensions-changed"));
}

export function isInstalled(id: string): boolean {
  return loadInstalled().includes(id);
}

export function installExtension(id: string): void {
  const list = loadInstalled();
  if (!list.includes(id)) saveInstalled([...list, id]);
}

export function uninstallExtension(id: string): void {
  saveInstalled(loadInstalled().filter((x) => x !== id));
}

export function getActiveThemeExtension(): string | null {
  return localStorage.getItem(LS_ACTIVE_THEME_EXT);
}

export function setActiveThemeExtension(id: string | null): void {
  if (id) localStorage.setItem(LS_ACTIVE_THEME_EXT, id);
  else localStorage.removeItem(LS_ACTIVE_THEME_EXT);
  window.dispatchEvent(new CustomEvent("codeforge-active-theme-changed"));
}
