import { useState, useCallback, useEffect } from "react";
import { Search, Download, Check, Star, Puzzle, Palette, Brain, Code2, Wrench, Trash2, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  EXTENSION_REGISTRY,
  loadInstalled,
  installExtension,
  uninstallExtension,
  setActiveThemeExtension,
  getActiveThemeExtension,
  getMonacoThemeId,
  type ExtensionDef,
} from "@/lib/extensions";

type Cat = "all" | "ai" | "themes" | "languages" | "utilities";

const CATEGORY_CONFIG: { id: Cat; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Puzzle },
  { id: "ai", label: "AI", icon: Brain },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "languages", label: "Languages", icon: Code2 },
  { id: "utilities", label: "Utilities", icon: Wrench },
];

const formatDownloads = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : n.toString();

interface ExtensionsPanelProps {
  onThemeChange?: (themeId: string) => void;
  onRunCommand?: (command: string, ext: ExtensionDef) => void;
}

const ExtensionsPanel = ({ onThemeChange, onRunCommand }: ExtensionsPanelProps) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Cat>("all");
  const [installedIds, setInstalledIds] = useState<string[]>(() => loadInstalled());
  const [activeTheme, setActiveTheme] = useState<string | null>(() => getActiveThemeExtension());
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "name">("popular");
  const [tab, setTab] = useState<"browse" | "installed">("browse");

  // Sync with other components changing the install set
  useEffect(() => {
    const handler = () => setInstalledIds(loadInstalled());
    const themeHandler = () => setActiveTheme(getActiveThemeExtension());
    window.addEventListener("codeforge-extensions-changed", handler);
    window.addEventListener("codeforge-active-theme-changed", themeHandler);
    return () => {
      window.removeEventListener("codeforge-extensions-changed", handler);
      window.removeEventListener("codeforge-active-theme-changed", themeHandler);
    };
  }, []);

  const handleInstall = useCallback(
    (ext: ExtensionDef) => {
      installExtension(ext.id);
      setInstalledIds(loadInstalled());
      toast.success(`Installed ${ext.name}`, { description: ext.description });

      // Auto-activate theme extensions
      if (ext.category === "themes" && ext.themeId) {
        const monacoId = getMonacoThemeId(ext.themeId);
        if (monacoId) {
          onThemeChange?.(monacoId);
          setActiveThemeExtension(ext.id);
          setActiveTheme(ext.id);
          toast.success(`Activated ${ext.name}`);
        }
      }
    },
    [onThemeChange]
  );

  const handleUninstall = useCallback(
    (ext: ExtensionDef) => {
      if (ext.builtIn) {
        toast.error(`${ext.name} is built-in and cannot be removed.`);
        return;
      }
      uninstallExtension(ext.id);
      setInstalledIds(loadInstalled());
      if (activeTheme === ext.id) {
        setActiveThemeExtension(null);
        setActiveTheme(null);
        onThemeChange?.("codeforge-dark");
      }
      toast(`Uninstalled ${ext.name}`);
    },
    [activeTheme, onThemeChange]
  );

  const handleActivateTheme = useCallback(
    (ext: ExtensionDef) => {
      if (!ext.themeId) return;
      const monacoId = getMonacoThemeId(ext.themeId);
      if (!monacoId) {
        toast.error("Theme not registered with Monaco");
        return;
      }
      onThemeChange?.(monacoId);
      setActiveThemeExtension(ext.id);
      setActiveTheme(ext.id);
      toast.success(`${ext.name} active`);
    },
    [onThemeChange]
  );

  const installedList = EXTENSION_REGISTRY.filter((e) => installedIds.includes(e.id));
  const filtered = (tab === "installed" ? installedList : EXTENSION_REGISTRY)
    .filter((ext) => category === "all" || ext.category === category)
    .filter((ext) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        ext.name.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.author.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.downloads - a.downloads;
      if (sortBy === "rating") return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extensions</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
            {installedIds.length} installed
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

        {/* Browse / Installed tabs */}
        <div className="flex gap-1 mt-2">
          {(["browse", "installed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-[10px] font-medium uppercase tracking-wider py-1 rounded transition-colors ${
                tab === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {t === "browse" ? "Browse" : `Installed (${installedIds.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 p-2 border-b border-border overflow-x-auto scrollbar-thin">
        {CATEGORY_CONFIG.map((cat) => (
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
          {(["popular", "rating", "name"] as const).map((s) => (
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
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {filtered.map((ext) => {
            const installed = installedIds.includes(ext.id);
            const isActiveTheme = activeTheme === ext.id;
            return (
              <motion.div
                key={ext.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 border-b border-border/50 transition-colors ${
                  isActiveTheme ? "bg-primary/5" : "hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none mt-0.5">{ext.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <h3 className="text-xs font-semibold text-foreground truncate">{ext.name}</h3>
                        {isActiveTheme && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-primary/30 text-primary uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                        {ext.builtIn && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider shrink-0">
                            Built-in
                          </span>
                        )}
                      </div>
                      {installed ? (
                        <div className="flex items-center gap-1 shrink-0">
                          {ext.themeId && !isActiveTheme && (
                            <button
                              onClick={() => handleActivateTheme(ext)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              Activate
                            </button>
                          )}
                          {ext.command && onRunCommand && (
                            <button
                              onClick={() => onRunCommand(ext.command!, ext)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
                              title={ext.command}
                            >
                              <Play className="w-2.5 h-2.5" />
                              Run
                            </button>
                          )}
                          {!ext.builtIn && (
                            <button
                              onClick={() => handleUninstall(ext)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              Remove
                            </button>
                          )}
                          {ext.builtIn && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400">
                              <Check className="w-2.5 h-2.5" />
                              Installed
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInstall(ext)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-all shrink-0"
                        >
                          <Download className="w-2.5 h-2.5" />
                          Install
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ext.author} • v{ext.version}
                    </p>
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
                      {ext.command && (
                        <span className="text-[10px] text-primary/70 truncate">⌘ {ext.command}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
