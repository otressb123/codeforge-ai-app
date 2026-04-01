import { ChevronRight, FileText, Folder } from "lucide-react";

interface BreadcrumbBarProps {
  filePath: string | null;
}

const BreadcrumbBar = ({ filePath }: BreadcrumbBarProps) => {
  if (!filePath) return null;

  const parts = filePath.split("/").filter(Boolean);
  const fileName = parts.pop();

  return (
    <div className="h-6 bg-editor border-b border-border flex items-center px-3 gap-0.5 overflow-x-auto">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-0.5 shrink-0">
          <Folder className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            {part}
          </span>
          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40" />
        </span>
      ))}
      {fileName && (
        <span className="flex items-center gap-0.5 shrink-0">
          <FileText className="w-3 h-3 text-primary/70" />
          <span className="text-[10px] text-foreground font-medium">{fileName}</span>
        </span>
      )}
    </div>
  );
};

export default BreadcrumbBar;
