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
  // AI
  { id: "ai-copilot", name: "CodeForge Copilot", author: "CodeForge", description: "AI-powered ghost-text completions while you type.", category: "ai", downloads: 52400, rating: 4.8, icon: "🤖", version: "2.1.0", command: "Toggle Copilot", builtIn: true },
  { id: "ai-chat-pro", name: "AI Chat Pro", author: "CodeForge", description: "Multi-model AI chat with screenshot understanding and project context.", category: "ai", downloads: 41200, rating: 4.7, icon: "💬", version: "3.0.1", builtIn: true },
  { id: "ai-refactor", name: "AI Refactor", author: "CodeForge", description: "Select code and get instant AI refactor suggestions via Cmd+K.", category: "ai", downloads: 18900, rating: 4.5, icon: "🔧", version: "1.4.0", command: "Refactor selection" },
  { id: "ai-docs", name: "AI Doc Generator", author: "DevTools Inc", description: "Auto-generate JSDoc, README, and API documentation from your code.", category: "ai", downloads: 15600, rating: 4.3, icon: "📝", version: "1.2.0" },
  { id: "ai-tests", name: "AI Test Writer", author: "TestLab", description: "Generate unit, integration, and e2e tests for the active file.", category: "ai", downloads: 12800, rating: 4.4, icon: "🧪", version: "1.0.3" },
  { id: "ai-byok", name: "BYOK Providers", author: "CodeForge", description: "Bring your own API keys: OpenAI, OpenRouter, Groq, Anthropic, DeepSeek, more.", category: "ai", downloads: 9800, rating: 4.9, icon: "🔑", version: "1.0.0" },

  // Themes — these actually flip the Monaco theme on install
  { id: "theme-dracula", name: "Dracula Theme", author: "Dracula", description: "Iconic dark theme with vibrant purple and pink syntax.", category: "themes", downloads: 89000, rating: 4.9, icon: "🧛", version: "2.0.0", themeId: "dracula" },
  { id: "theme-nord", name: "Nord Theme", author: "Arctic Ice", description: "Arctic, north-bluish palette. Clean and calm.", category: "themes", downloads: 45000, rating: 4.7, icon: "❄️", version: "1.5.0", themeId: "nord" },
  { id: "theme-monokai", name: "Monokai Pro", author: "Monokai", description: "Refined syntax highlighting with rich, warm contrast.", category: "themes", downloads: 67000, rating: 4.8, icon: "🎨", version: "3.1.0", themeId: "monokai" },
  { id: "theme-github", name: "GitHub Dark", author: "GitHub", description: "GitHub's signature dark theme for the editor.", category: "themes", downloads: 38000, rating: 4.6, icon: "🐙", version: "1.3.0", themeId: "github-dark" },
  { id: "theme-tokyo-night", name: "Tokyo Night", author: "enkia", description: "Clean dark theme celebrating the lights of downtown Tokyo at night.", category: "themes", downloads: 71000, rating: 4.9, icon: "🌃", version: "1.0.0", themeId: "tokyo-night" },

  // Languages
  { id: "lang-python", name: "Python", author: "Microsoft", description: "Python language support with IntelliSense, linting, and debugging.", category: "languages", downloads: 120000, rating: 4.9, icon: "🐍", version: "4.2.0" },
  { id: "lang-rust", name: "Rust Analyzer", author: "Rust", description: "Rust language support with auto-completion and error checking.", category: "languages", downloads: 56000, rating: 4.8, icon: "🦀", version: "1.8.0" },
  { id: "lang-go", name: "Go", author: "Go Team", description: "Go language support with IntelliSense, code navigation, and debugging.", category: "languages", downloads: 48000, rating: 4.7, icon: "🔵", version: "2.1.0" },
  { id: "lang-tailwind", name: "Tailwind CSS IntelliSense", author: "Tailwind Labs", description: "Autocomplete, syntax highlighting, and linting for Tailwind CSS.", category: "languages", downloads: 95000, rating: 4.9, icon: "💨", version: "3.0.0", builtIn: true },
  { id: "lang-prisma", name: "Prisma", author: "Prisma", description: "Prisma schema language support with autocomplete and formatting.", category: "languages", downloads: 32000, rating: 4.6, icon: "💎", version: "1.5.0" },

  // Utilities
  { id: "util-prettier", name: "Prettier", author: "Prettier", description: "Format the current file with Shift+Alt+F. JS, TS, CSS, JSON.", category: "utilities", downloads: 110000, rating: 4.8, icon: "✨", version: "3.2.0", command: "Format Document", builtIn: true },
  { id: "util-eslint", name: "ESLint", author: "Microsoft", description: "Find and fix lint problems in your JavaScript/TypeScript code.", category: "utilities", downloads: 105000, rating: 4.7, icon: "🔍", version: "3.0.0", builtIn: true },
  { id: "util-todo", name: "Todo Tree", author: "Gruntfuggly", description: "Surface TODO, FIXME, NOTE comments across your project.", category: "utilities", downloads: 42000, rating: 4.6, icon: "📋", version: "2.1.0" },
  { id: "util-gitlens", name: "GitLens", author: "GitKraken", description: "Supercharge Git. Visualize authorship and navigate history.", category: "utilities", downloads: 78000, rating: 4.8, icon: "🔮", version: "15.0.0", command: "Open Git Panel" },
  { id: "util-markdown", name: "Markdown Preview", author: "CodeForge", description: "Live preview of Markdown files with syntax highlighting.", category: "utilities", downloads: 35000, rating: 4.5, icon: "📖", version: "1.2.0" },
  { id: "util-pomodoro", name: "Pomodoro Timer", author: "ProdTools", description: "Floating 25/5 focus timer in the status bar.", category: "utilities", downloads: 8500, rating: 4.2, icon: "🍅", version: "1.0.0", command: "Start Pomodoro" },
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
