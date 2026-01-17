import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, File, FileJson, FileType, Image } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode, path: string) => void;
  selectedPath: string | null;
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return <FileCode className="w-4 h-4 text-syntax-function" />;
    case 'jsx':
    case 'js':
      return <FileCode className="w-4 h-4 text-warning" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-warning" />;
    case 'css':
    case 'scss':
      return <FileType className="w-4 h-4 text-syntax-keyword" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <Image className="w-4 h-4 text-success" />;
    default:
      return <File className="w-4 h-4 text-muted-foreground" />;
  }
};

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  path: string;
  onFileSelect: (file: FileNode, path: string) => void;
  selectedPath: string | null;
}

const TreeNode = ({ node, depth, path, onFileSelect, selectedPath }: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const currentPath = `${path}/${node.name}`;
  const isSelected = selectedPath === currentPath;

  if (node.type === "folder") {
    return (
      <div>
        <motion.div
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer rounded transition-colors hover:bg-secondary/50`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.5)" }}
        >
          {isOpen ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-warning" />
          ) : (
            <Folder className="w-4 h-4 text-warning" />
          )}
          <span className="text-sm text-foreground/90">{node.name}</span>
        </motion.div>
        <AnimatePresence>
          {isOpen && node.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {node.children.map((child, index) => (
                <TreeNode
                  key={`${currentPath}-${child.name}-${index}`}
                  node={child}
                  depth={depth + 1}
                  path={currentPath}
                  onFileSelect={onFileSelect}
                  selectedPath={selectedPath}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded transition-all ${
        isSelected ? "bg-primary/20 border-l-2 border-primary" : "hover:bg-secondary/50"
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => onFileSelect(node, currentPath)}
      whileHover={{ x: 2 }}
    >
      {getFileIcon(node.name)}
      <span className={`text-sm ${isSelected ? "text-primary" : "text-foreground/80"}`}>
        {node.name}
      </span>
    </motion.div>
  );
};

const FileExplorer = ({ files, onFileSelect, selectedPath }: FileExplorerProps) => {
  return (
    <div className="h-full bg-sidebar overflow-y-auto scrollbar-thin">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </h2>
      </div>
      <div className="py-2">
        {files.map((node, index) => (
          <TreeNode
            key={`${node.name}-${index}`}
            node={node}
            depth={0}
            path=""
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
