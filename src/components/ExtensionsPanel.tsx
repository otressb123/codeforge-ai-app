import { useState, useCallback } from "react";
import { Search, Download, Check, Star, Puzzle, Palette, Brain, Code2, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type ExtensionCategory = "all" | "ai" | "themes" | "languages" | "utilities";

interface Extension {
  id: string;
  name: string;
  author: string;
  description: string;
  category: ExtensionCategory;
  downloads: number;
  rating: number;
  icon: string;
  installed: boolean;
  version: string;
}

const BUILT_IN_EXTENSIONS: Extension[] = [
  // AI Plugins
  { id: "ai-copilot", name: "CodeForge Copilot", author: "CodeForge", description: "AI-powered code completions as you type. Ghost text suggestions powered by fast models.", category: "ai", downloads: 52400, rating: 4.8, icon: "🤖", installed: true, version: "2.1.0" },
  { id: "ai-chat-pro", name: "AI Chat Pro", author: "CodeForge", description: "Advanced AI chat with multi-model support, code review, and test generation.", category: "ai", downloads: 41200, rating: 4.7, icon: "💬", installed: true, version: "3.0.1" },
  { id: "ai-refactor", name: "AI Refactor", author: "CodeForge", description: "Intelligent code refactoring suggestions. Select code and get improvement ideas.", category: "ai", downloads: 18900, rating: 4.5, icon: "🔧", installed: false, version: "1.4.0" },
  { id: "ai-docs", name: "AI Doc Generator", author: "DevTools Inc", description: "Auto-generate JSDoc, README, and API documentation from your code.", category: "ai", downloads: 15600, rating: 4.3, icon: "📝", installed: false, version: "1.2.0" },
  { id: "ai-tests", name: "AI Test Writer", author: "TestLab", description: "Generate unit tests, integration tests, and e2e tests automatically.", category: "ai", downloads: 12800, rating: 4.4, icon: "🧪", installed: false, version: "1.0.3" },
  
  // Themes
  { id: "theme-dracula", name: "Dracula Theme", author: "Dracula", description: "A dark theme for code editors. Popular dark theme with vibrant colors.", category: "themes", downloads: 89000, rating: 4.9, icon: "🧛", installed: false, version: "2.0.0" },
  { id: "theme-nord", name: "Nord Theme", author: "Arctic Ice", description: "An arctic, north-bluish color palette. Clean and elegant.", category: "themes", downloads: 45000, rating: 4.7, icon: "❄️", installed: false, version: "1.5.0" },
  { id: "theme-monokai", name: "Monokai Pro", author: "Monokai", description: "Professional theme with beautiful colors and refined syntax highlighting.", category: "themes", downloads: 67000, rating: 4.8, icon: "🎨", installed: false, version: "3.1.0" },
  { id: "theme-github", name: "GitHub Theme", author: "GitHub", description: "GitHub's light and dark themes for your editor.", category: "themes", downloads: 38000, rating: 4.6, icon: "🐙", installed: false, version: "1.3.0" },
  { id: "theme-catppuccin", name: "Catppuccin", author: "Catppuccin", description: "Soothing pastel theme with warm and cozy aesthetics.", category: "themes", downloads: 29000, rating: 4.8, icon: "🐱", installed: false, version: "2.0.0" },
  
  // Languages
  { id: "lang-python", name: "Python", author: "Microsoft", description: "Python language support with IntelliSense, linting, and debugging.", category: "languages", downloads: 120000, rating: 4.9, icon: "🐍", installed: false, version: "4.2.0" },
  { id: "lang-rust", name: "Rust Analyzer", author: "Rust", description: "Rust language support with auto-completion, error checking, and more.", category: "languages", downloads: 56000, rating: 4.8, icon: "🦀", installed: false, version: "1.8.0" },
  { id: "lang-go", name: "Go", author: "Go Team", description: "Go language support with IntelliSense, code navigation, and debugging.", category: "languages", downloads: 48000, rating: 4.7, icon: "🔵", installed: false, version: "2.1.0" },
  { id: "lang-tailwind", name: "Tailwind CSS IntelliSense", author: "Tailwind Labs", description: "Autocomplete, syntax highlighting, and linting for Tailwind CSS.", category: "languages", downloads: 95000, rating: 4.9, icon: "💨", installed: true, version: "3.0.0" },
  { id: "lang-prisma", name: "Prisma", author: "Prisma", description: "Prisma schema language support with autocomplete and formatting.", category: "languages", downloads: 32000, rating: 4.6, icon: "💎", installed: false, version: "1.5.0" },
  
  // Utilities
  { id: "util-prettier", name: "Prettier", author: "Prettier", description: "Opinionated code formatter. Supports JS, TS, CSS, HTML, JSON, and more.", category: "utilities", downloads: 110000, rating: 4.8, icon: "✨", installed: true, version: "3.2.0" },
  { id: "util-eslint", name: "ESLint", author: "Microsoft", description: "Find and fix problems in your JavaScript/TypeScript code.", category: "utilities", downloads: 105000, rating: 4.7, icon: "🔍", installed: true, version: "3.0.0" },
  { id: "util-todo", name: "Todo Tree", author: "Gruntfuggly", description: "Show TODO, FIXME, and other annotation comments in a tree view.", category: "utilities", downloads: 42000, rating: 4.6, icon: "📋", installed: false, version: "2.1.0" },
  { id: "util-gitlens", name: "GitLens", author: "GitKraken", description: "Supercharge Git. Visualize authorship, navigate history, and more.", category: "utilities", downloads: 78000, rating: 4.8, icon: "🔮", installed: false, version: "15.0.0" },
  { id: "util-markdown", name: "Markdown Preview", author: "CodeForge", description: "Live preview of Markdown files with syntax highlighting.", category: "utilities", downloads: 35000, rating: 4.5, icon: "📖", installed: false, version: "1.2.0" },
  { id: "util-pomodoro", name: "Pomodoro Timer", author: "ProdTools", description: "Built-in Pomodoro timer to stay focused and productive.", category: "utilities", downloads: 8500, rating: 4.2, icon: "🍅", installed: false, version: "1.0.0" },
];

const CATEGORY_CONFIG: { id: ExtensionCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Puzzle },
  { id: "ai", label: "AI", icon: Brain },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "languages", label: "Languages", icon: Code2 },
  { id: "utilities", label: "Utilities", icon: Wrench },
];

const formatDownloads = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toString();
};

const ExtensionsPanel = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExtensionCategory>("all");
  const [extensions, setExtensions] = useState<Extension[]>(BUILT_IN_EXTENSIONS);
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "name">("popular");

  const toggleInstall = useCallback((id: string) => {
    setExtensions(prev => prev.map(ext => {
      if (ext.id === id) {
        const next = { ...ext, installed: !ext.installed };
        toast.success(next.installed ? `Installed ${ext.name}` : `Uninstalled ${ext.name}`);
        return next;
      }
      return ext;
    }));
  }, []);

  const filtered = extensions
    .filter(ext => category === "all" || ext.category === category)
    .filter(ext => {
      if (!search) return true;
      const q = search.toLowerCase();
      return ext.name.toLowerCase().includes(q) || ext.description.toLowerCase().includes(q) || ext.author.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.downloads - a.downloads;
      if (sortBy === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  const installedCount = extensions.filter(e => e.installed).length;

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extensions</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
            {installedCount} installed
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search extensions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background text-foreground text-xs pl-8 pr-3 py-1.5 rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 p-2 border-b border-border overflow-x-auto">
        {CATEGORY_CONFIG.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
              category === cat.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <cat.icon className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] text-muted-foreground">{filtered.length} extensions</span>
        <div className="flex gap-1">
          {(["popular", "rating", "name"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                sortBy === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "popular" ? "Popular" : s === "rating" ? "Rating" : "A-Z"}
            </button>
          ))}
        </div>
      </div>

      {/* Extension list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.map(ext => (
            <motion.div
              key={ext.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 border-b border-border/50 hover:bg-secondary/30 transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none mt-0.5">{ext.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-foreground truncate">{ext.name}</h3>
                    <button
                      onClick={() => toggleInstall(ext.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        ext.installed
                          ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                          : "bg-primary/20 text-primary hover:bg-primary/30"
                      }`}
                    >
                      {ext.installed ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span className="group-hover:hidden">Installed</span>
                          <span className="hidden group-hover:inline">Remove</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-2.5 h-2.5" />
                          Install
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ext.author} • v{ext.version}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-2">{ext.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                      {ext.rating}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Download className="w-2.5 h-2.5" />
                      {formatDownloads(ext.downloads)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Puzzle className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">No extensions found</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionsPanel;
