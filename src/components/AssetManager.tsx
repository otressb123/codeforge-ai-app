import { useState, useRef, useCallback } from "react";
import { Image, Type, Search, Upload, Smile, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AssetManagerProps {
  onInsertCode: (code: string, filename: string) => void;
}

// Common lucide-react icons organized by category
const ICON_CATEGORIES: Record<string, string[]> = {
  "Navigation": ["Menu", "X", "ChevronDown", "ChevronRight", "ChevronLeft", "ChevronUp", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "ExternalLink"],
  "Actions": ["Plus", "Minus", "Edit", "Trash2", "Copy", "Save", "Download", "Upload", "Share", "Send", "Search", "Filter", "RefreshCw", "RotateCw"],
  "Media": ["Image", "Camera", "Video", "Music", "Play", "Pause", "SkipForward", "SkipBack", "Volume2", "VolumeX", "Mic"],
  "Communication": ["Mail", "MessageSquare", "MessageCircle", "Phone", "Bell", "BellRing", "AtSign", "Globe"],
  "UI": ["Eye", "EyeOff", "Lock", "Unlock", "Star", "Heart", "ThumbsUp", "Bookmark", "Flag", "Tag", "Badge", "Award"],
  "Data": ["BarChart3", "LineChart", "PieChart", "TrendingUp", "TrendingDown", "Database", "Table", "FileText", "Folder", "File"],
  "Social": ["Github", "Twitter", "Linkedin", "Facebook", "Instagram", "Youtube"],
  "Status": ["Check", "X", "AlertTriangle", "AlertCircle", "Info", "HelpCircle", "CheckCircle", "XCircle", "Loader2", "Clock"],
};

const GOOGLE_FONTS = [
  { name: "Inter", category: "Sans-serif", weight: "Modern, clean" },
  { name: "Poppins", category: "Sans-serif", weight: "Geometric, friendly" },
  { name: "Roboto", category: "Sans-serif", weight: "Google's standard" },
  { name: "Open Sans", category: "Sans-serif", weight: "Highly readable" },
  { name: "Montserrat", category: "Sans-serif", weight: "Bold headings" },
  { name: "Playfair Display", category: "Serif", weight: "Elegant, editorial" },
  { name: "Merriweather", category: "Serif", weight: "Beautiful body text" },
  { name: "Lora", category: "Serif", weight: "Classic book feel" },
  { name: "Space Grotesk", category: "Sans-serif", weight: "Tech/modern" },
  { name: "JetBrains Mono", category: "Monospace", weight: "Code font" },
  { name: "Fira Code", category: "Monospace", weight: "Ligatures" },
  { name: "DM Sans", category: "Sans-serif", weight: "Clean geometric" },
  { name: "Outfit", category: "Sans-serif", weight: "Variable, modern" },
  { name: "Sora", category: "Sans-serif", weight: "Futuristic" },
  { name: "Archivo", category: "Sans-serif", weight: "Strong headlines" },
];

type Tab = "icons" | "fonts" | "images";

const AssetManager = ({ onInsertCode }: AssetManagerProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("icons");
  const [iconSearch, setIconSearch] = useState("");
  const [fontSearch, setFontSearch] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Navigation");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyAndNotify = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
    toast.success(`Copied ${label}!`);
  };

  const insertIcon = (iconName: string) => {
    const importLine = `import { ${iconName} } from "lucide-react";`;
    const jsx = `<${iconName} className="w-5 h-5" />`;
    copyAndNotify(`${importLine}\n\n// Usage:\n${jsx}`, iconName);
  };

  const insertFont = (font: typeof GOOGLE_FONTS[0]) => {
    const fontUrl = `https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;
    const linkTag = `<link href="${fontUrl}" rel="stylesheet" />`;
    const cssRule = `font-family: '${font.name}', ${font.category.toLowerCase()};`;
    const tailwindClass = `font-['${font.name.replace(/\s+/g, "_")}']`;
    
    // Generate a CSS file with the font import
    const cssContent = `/* ${font.name} Font */\n@import url('${fontUrl}');\n\nbody {\n  ${cssRule}\n}`;
    onInsertCode(cssContent, "fonts.css");
    toast.success(`Added ${font.name} font to project!`);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const imgTag = `<img src="${base64}" alt="${file.name}" className="w-full h-auto rounded-lg" />`;
      onInsertCode(imgTag, `${file.name.split('.')[0]}.tsx`);
      toast.success(`Uploaded ${file.name}!`);
    };
    reader.readAsDataURL(file);
  }, [onInsertCode]);

  const filteredIcons = Object.entries(ICON_CATEGORIES).reduce((acc, [category, icons]) => {
    const filtered = iconSearch
      ? icons.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase()))
      : icons;
    if (filtered.length > 0) acc[category] = filtered;
    return acc;
  }, {} as Record<string, string[]>);

  const filteredFonts = fontSearch
    ? GOOGLE_FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()) || f.category.toLowerCase().includes(fontSearch.toLowerCase()))
    : GOOGLE_FONTS;

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Assets</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { id: "icons" as Tab, icon: Smile, label: "Icons" },
          { id: "fonts" as Tab, icon: Type, label: "Fonts" },
          { id: "images" as Tab, icon: Image, label: "Images" },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors ${
              activeTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Icons Tab */}
        {activeTab === "icons" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {Object.entries(filteredIcons).map(([category, icons]) => (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1.5 hover:text-foreground flex items-center gap-1 w-full"
                >
                  <span>{expandedCategory === category ? "▾" : "▸"}</span>
                  {category} ({icons.length})
                </button>
                {expandedCategory === category && (
                  <div className="grid grid-cols-4 gap-1">
                    {icons.map(icon => (
                      <motion.button
                        key={icon}
                        onClick={() => insertIcon(icon)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all ${
                          copiedItem === icon ? "bg-green-500/20 text-green-400" : "bg-secondary/30 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={icon}
                      >
                        {copiedItem === icon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="truncate w-full text-center">{icon}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fonts Tab */}
        {activeTab === "fonts" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder="Search fonts..."
                className="w-full bg-input border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              {filteredFonts.map(font => (
                <motion.button
                  key={font.name}
                  onClick={() => insertFont(font)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 hover:bg-primary/10 border border-border hover:border-primary/30 transition-all text-left"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div>
                    <p className="text-xs font-medium">{font.name}</p>
                    <p className="text-[10px] text-muted-foreground">{font.category} · {font.weight}</p>
                  </div>
                  <span className="text-[10px] text-primary">+ Add</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-foreground mb-1">Upload Image</p>
              <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG, GIF</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Placeholder Services</p>
              {[
                { name: "Unsplash", url: "https://source.unsplash.com/random/800x600", desc: "High-quality photos" },
                { name: "Picsum", url: "https://picsum.photos/800/600", desc: "Random beautiful images" },
                { name: "Placeholder", url: "https://via.placeholder.com/800x600", desc: "Simple colored boxes" },
              ].map(service => (
                <motion.button
                  key={service.name}
                  onClick={() => {
                    const code = `<img src="${service.url}" alt="Placeholder" className="w-full h-auto rounded-lg" />`;
                    copyAndNotify(code, service.name);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 hover:bg-primary/10 border border-border transition-all text-left"
                  whileTap={{ scale: 0.98 }}
                >
                  <div>
                    <p className="text-xs font-medium">{service.name}</p>
                    <p className="text-[10px] text-muted-foreground">{service.desc}</p>
                  </div>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetManager;
