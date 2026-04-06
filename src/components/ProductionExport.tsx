import { useState } from "react";
import { Download, Rocket, Globe, Server, FileArchive, Check, Loader2, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FileNode } from "@/components/FileExplorer";
import { flattenFiles, bundlePreview } from "@/lib/previewBundler";

interface ProductionExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  files: FileNode[];
}

type ExportTarget = "static" | "netlify" | "vercel";

const TARGETS = [
  { id: "static" as ExportTarget, name: "Static HTML", icon: Globe, desc: "Single HTML file, ready to deploy anywhere" },
  { id: "netlify" as ExportTarget, name: "Netlify", icon: Rocket, desc: "With netlify.toml config, drag & drop deploy" },
  { id: "vercel" as ExportTarget, name: "Vercel", icon: Server, desc: "With vercel.json config, CLI deploy ready" },
];

const ProductionExport = ({ open, onOpenChange, projectName, files }: ProductionExportProps) => {
  const [target, setTarget] = useState<ExportTarget>("static");
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // Generate bundled HTML
      const bundledHtml = bundlePreview(files);
      
      if (target === "static") {
        // Single-file export: just the bundled HTML
        zip.file("index.html", bundledHtml);
        zip.file("README.md", `# ${projectName}\n\nBuilt with CodeForge IDE.\n\n## Deploy\n\nUpload \`index.html\` to any static host.\n`);
      } else if (target === "netlify") {
        zip.file("index.html", bundledHtml);
        zip.file("netlify.toml", `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`);
        zip.file("_redirects", "/* /index.html 200\n");
        zip.file("README.md", `# ${projectName}\n\nBuilt with CodeForge IDE.\n\n## Deploy to Netlify\n\n1. Go to [netlify.com](https://netlify.com)\n2. Drag and drop this folder\n3. Your site is live!\n`);
      } else if (target === "vercel") {
        zip.file("public/index.html", bundledHtml);
        zip.file("vercel.json", JSON.stringify({
          rewrites: [{ source: "/(.*)", destination: "/index.html" }],
          headers: [{ source: "/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }],
        }, null, 2));
        zip.file("package.json", JSON.stringify({ name: projectName, version: "1.0.0", scripts: { build: "echo 'Static site'" } }, null, 2));
        zip.file("README.md", `# ${projectName}\n\nBuilt with CodeForge IDE.\n\n## Deploy to Vercel\n\n1. Install Vercel CLI: \`npm i -g vercel\`\n2. Run: \`vercel\`\n3. Your site is live!\n`);
      }

      // Also include source files for reference
      const flat = flattenFiles(files);
      const srcFolder = zip.folder("_source");
      if (srcFolder) {
        for (const [path, content] of Object.entries(flat)) {
          srcFolder.file(path, content);
        }
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${projectName}-${target}.zip`);
      
      setExported(true);
      toast.success(`Exported for ${TARGETS.find(t => t.id === target)?.name}!`);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            Production Export
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export your project as a production-ready build, optimized for deployment.
          </p>

          {/* Target Selection */}
          <div className="space-y-2">
            {TARGETS.map(t => (
              <button
                key={t.id}
                onClick={() => setTarget(t.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  target === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/20 hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  target === t.id ? "bg-primary/20" : "bg-secondary/50"
                }`}>
                  <t.icon className={`w-5 h-5 ${target === t.id ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                {target === t.id && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>

          {/* What's included */}
          <div className="bg-secondary/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground mb-1">What's included:</p>
            <p>✅ Bundled HTML with inline React + Tailwind</p>
            <p>✅ All components compiled and working</p>
            <p>✅ Source files in _source/ folder</p>
            {target !== "static" && <p>✅ {target === "netlify" ? "netlify.toml + _redirects" : "vercel.json + package.json"}</p>}
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground gap-2"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Bundling...</>
            ) : exported ? (
              <><Check className="w-4 h-4" /> Downloaded!</>
            ) : (
              <><Download className="w-4 h-4" /> Export for {TARGETS.find(t => t.id === target)?.name}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionExport;
