import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, File, FileJson, FileType, Image, Plus, FilePlus, FolderPlus, Trash2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

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
  onCreateFile?: (path: string, name: string) => void;
  onCreateFolder?: (path: string, name: string) => void;
  onDeleteNode?: (path: string) => void;
  onRenameNode?: (path: string, newName: string) => void;
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
  onCreateFile?: (path: string) => void;
  onCreateFolder?: (path: string) => void;
  onDeleteNode?: (path: string) => void;
  onRenameNode?: (path: string, newName: string) => void;
}

const TreeNode = ({ 
  node, 
  depth, 
  path, 
  onFileSelect, 
  selectedPath,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode 
}: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentPath = `${path}/${node.name}`;
  const isSelected = selectedPath === currentPath;

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (newName.trim() && newName !== node.name && onRenameNode) {
      onRenameNode(currentPath, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setNewName(node.name);
      setIsRenaming(false);
    }
  };

  const renderContent = () => {
    if (isRenaming) {
      return (
        <Input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm py-0 px-1"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    return (
      <span className={`text-sm ${isSelected ? "text-primary" : "text-foreground/80"}`}>
        {node.name}
      </span>
    );
  };

  if (node.type === "folder") {
    return (
      <div>
        <ContextMenu>
          <ContextMenuTrigger>
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
              {renderContent()}
            </motion.div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={() => onCreateFile?.(currentPath)} className="gap-2">
              <FilePlus className="w-4 h-4" />
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCreateFolder?.(currentPath)} className="gap-2">
              <FolderPlus className="w-4 h-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => setIsRenaming(true)} className="gap-2">
              <Pencil className="w-4 h-4" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => onDeleteNode?.(currentPath)} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
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
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  onDeleteNode={onDeleteNode}
                  onRenameNode={onRenameNode}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.div
          className={`flex items-center gap-2 py-1 px-2 cursor-pointer rounded transition-all ${
            isSelected ? "bg-primary/20 border-l-2 border-primary" : "hover:bg-secondary/50"
          }`}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
          onClick={() => onFileSelect(node, currentPath)}
          whileHover={{ x: 2 }}
        >
          {getFileIcon(node.name)}
          {renderContent()}
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => setIsRenaming(true)} className="gap-2">
          <Pencil className="w-4 h-4" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={() => onDeleteNode?.(currentPath)} 
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

interface NewItemInputProps {
  type: "file" | "folder";
  onSubmit: (name: string) => void;
  onCancel: () => void;
  depth: number;
}

const NewItemInput = ({ type, onSubmit, onCancel, depth }: NewItemInputProps) => {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    } else {
      onCancel();
    }
  };

  return (
    <div 
      className="flex items-center gap-2 py-1 px-2"
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      {type === "folder" ? (
        <Folder className="w-4 h-4 text-warning" />
      ) : (
        <File className="w-4 h-4 text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={type === "folder" ? "folder name" : "filename.ext"}
        className="h-6 text-sm py-0 px-1 flex-1"
      />
    </div>
  );
};

const FileExplorer = ({ 
  files, 
  onFileSelect, 
  selectedPath,
  onCreateFile,
  onCreateFolder,
  onDeleteNode,
  onRenameNode
}: FileExplorerProps) => {
  const [newItem, setNewItem] = useState<{ type: "file" | "folder"; path: string } | null>(null);

  const handleCreateFile = (path: string) => {
    setNewItem({ type: "file", path });
  };

  const handleCreateFolder = (path: string) => {
    setNewItem({ type: "folder", path });
  };

  const handleNewItemSubmit = (name: string) => {
    if (newItem) {
      if (newItem.type === "file") {
        onCreateFile?.(newItem.path, name);
      } else {
        onCreateFolder?.(newItem.path, name);
      }
    }
    setNewItem(null);
  };

  return (
    <div className="h-full bg-sidebar overflow-y-auto scrollbar-thin">
      <ContextMenu>
        <ContextMenuTrigger className="block">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Explorer
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNewItem({ type: "file", path: "" })}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="New File"
              >
                <FilePlus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => setNewItem({ type: "folder", path: "" })}
                className="p-1 hover:bg-secondary rounded transition-colors"
                title="New Folder"
              >
                <FolderPlus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setNewItem({ type: "file", path: "" })} className="gap-2">
            <FilePlus className="w-4 h-4" />
            New File
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setNewItem({ type: "folder", path: "" })} className="gap-2">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      <div className="py-2">
        {newItem && newItem.path === "" && (
          <NewItemInput
            type={newItem.type}
            onSubmit={handleNewItemSubmit}
            onCancel={() => setNewItem(null)}
            depth={0}
          />
        )}
        {files.map((node, index) => (
          <TreeNode
            key={`${node.name}-${index}`}
            node={node}
            depth={0}
            path=""
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteNode={onDeleteNode}
            onRenameNode={onRenameNode}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;