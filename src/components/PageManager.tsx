import { useState } from "react";
import { Plus, FileText, Trash2, ArrowUpDown, Home, Info, Mail, ShoppingBag, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Page {
  id: string;
  name: string;
  path: string;
  icon: string;
}

interface PageManagerProps {
  onPagesChanged: (pages: Page[]) => void;
  onGenerateRouting: (pages: Page[]) => void;
}

const PAGE_TEMPLATES = [
  { name: "Home", path: "/", icon: "🏠" },
  { name: "About", path: "/about", icon: "ℹ️" },
  { name: "Contact", path: "/contact", icon: "📧" },
  { name: "Products", path: "/products", icon: "🛍️" },
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Blog", path: "/blog", icon: "📝" },
  { name: "Pricing", path: "/pricing", icon: "💰" },
  { name: "Login", path: "/login", icon: "🔐" },
];

const PageManager = ({ onPagesChanged, onGenerateRouting }: PageManagerProps) => {
  const [pages, setPages] = useState<Page[]>([
    { id: "1", name: "Home", path: "/", icon: "🏠" },
  ]);
  const [customName, setCustomName] = useState("");

  const addPage = (template: typeof PAGE_TEMPLATES[0]) => {
    if (pages.find(p => p.path === template.path)) {
      toast.error(`Page "${template.name}" already exists`);
      return;
    }
    const newPage: Page = { id: Date.now().toString(), ...template };
    const updated = [...pages, newPage];
    setPages(updated);
    onPagesChanged(updated);
    toast.success(`Added ${template.name} page`);
  };

  const addCustomPage = () => {
    if (!customName.trim()) return;
    const path = `/${customName.toLowerCase().replace(/\s+/g, "-")}`;
    if (pages.find(p => p.path === path)) {
      toast.error("Page with this path already exists");
      return;
    }
    const newPage: Page = { id: Date.now().toString(), name: customName, path, icon: "📄" };
    const updated = [...pages, newPage];
    setPages(updated);
    onPagesChanged(updated);
    setCustomName("");
    toast.success(`Added ${customName} page`);
  };

  const removePage = (id: string) => {
    const updated = pages.filter(p => p.id !== id);
    setPages(updated);
    onPagesChanged(updated);
  };

  const handleGenerate = () => {
    if (pages.length < 2) {
      toast.error("Add at least 2 pages to generate routing");
      return;
    }
    onGenerateRouting(pages);
    toast.success(`Generating ${pages.length}-page website with navigation!`);
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Pages</h2>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded">{pages.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Current Pages */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Current Pages</p>
          <AnimatePresence>
            {pages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{page.icon}</span>
                  <div>
                    <p className="text-xs font-medium">{page.name}</p>
                    <p className="text-[10px] text-muted-foreground">{page.path}</p>
                  </div>
                </div>
                {page.path !== "/" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removePage(page.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Add */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Quick Add</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PAGE_TEMPLATES.filter(t => !pages.find(p => p.path === t.path)).map((template) => (
              <motion.button
                key={template.path}
                onClick={() => addPage(template)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-secondary/20 hover:bg-primary/10 border border-border hover:border-primary/30 text-[11px] transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{template.icon}</span>
                <span>{template.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Page */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Custom Page</p>
          <div className="flex gap-1.5">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomPage()}
              placeholder="Page name..."
              className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Button size="sm" onClick={addCustomPage} disabled={!customName.trim()} className="h-7 text-xs">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="p-3 border-t border-border">
        <Button
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground gap-2"
          disabled={pages.length < 2}
        >
          <FileText className="w-4 h-4" />
          Generate {pages.length}-Page Website
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          Creates App.tsx with routing + all page components
        </p>
      </div>
    </div>
  );
};

export default PageManager;
