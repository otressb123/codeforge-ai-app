import { useState, useEffect, useMemo, useCallback } from "react";
import { FileNode } from "@/components/FileExplorer";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  File,
  FolderOpen,
  Save,
  Download,
  Upload,
  RefreshCw,
  Plus,
  FolderPlus,
  Github,
  Settings,
  Search,
  Terminal,
  Play,
  Trash2,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "file" | "command" | "navigation";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileNode[];
  onFileSelect: (file: FileNode, path: string) => void;
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onRefreshPreview?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onNewProject?: () => void;
  onOpenGitHub?: () => void;
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  onOpenTerminal?: () => void;
  onRun?: () => void;
}

const CommandPalette = ({
  open,
  onOpenChange,
  files,
  onFileSelect,
  onSave,
  onExport,
  onImport,
  onRefreshPreview,
  onNewFile,
  onNewFolder,
  onNewProject,
  onOpenGitHub,
  onOpenSettings,
  onOpenSearch,
  onOpenTerminal,
  onRun,
}: CommandPaletteProps) => {
  const [search, setSearch] = useState("");

  // Flatten file tree for searching
  const flattenFiles = useCallback((nodes: FileNode[], parentPath = ""): { file: FileNode; path: string }[] => {
    const result: { file: FileNode; path: string }[] = [];
    for (const node of nodes) {
      const path = parentPath ? `${parentPath}/${node.name}` : `/${node.name}`;
      if (node.type === "file") {
        result.push({ file: node, path });
      }
      if (node.children) {
        result.push(...flattenFiles(node.children, path));
      }
    }
    return result;
  }, []);

  const allFiles = useMemo(() => flattenFiles(files), [files, flattenFiles]);

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!search || search.startsWith(">")) return [];
    const query = search.toLowerCase();
    return allFiles.filter(
      ({ file, path }) =>
        file.name.toLowerCase().includes(query) ||
        path.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [allFiles, search]);

  // Build commands list
  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [];

    if (onSave) {
      cmds.push({
        id: "save",
        label: "Save All Files",
        description: "Ctrl+S",
        icon: <Save className="w-4 h-4" />,
        action: onSave,
        category: "command",
      });
    }

    if (onRun) {
      cmds.push({
        id: "run",
        label: "Run Application",
        icon: <Play className="w-4 h-4" />,
        action: onRun,
        category: "command",
      });
    }

    if (onRefreshPreview) {
      cmds.push({
        id: "refresh",
        label: "Refresh Preview",
        description: "Ctrl+R",
        icon: <RefreshCw className="w-4 h-4" />,
        action: onRefreshPreview,
        category: "command",
      });
    }

    if (onNewFile) {
      cmds.push({
        id: "new-file",
        label: "New File",
        description: "Ctrl+N",
        icon: <Plus className="w-4 h-4" />,
        action: onNewFile,
        category: "command",
      });
    }

    if (onNewFolder) {
      cmds.push({
        id: "new-folder",
        label: "New Folder",
        icon: <FolderPlus className="w-4 h-4" />,
        action: onNewFolder,
        category: "command",
      });
    }

    if (onNewProject) {
      cmds.push({
        id: "new-project",
        label: "New Project",
        description: "Ctrl+Shift+N",
        icon: <FolderOpen className="w-4 h-4" />,
        action: onNewProject,
        category: "command",
      });
    }

    if (onExport) {
      cmds.push({
        id: "export",
        label: "Export Project",
        description: "Ctrl+Shift+S",
        icon: <Download className="w-4 h-4" />,
        action: onExport,
        category: "command",
      });
    }

    if (onImport) {
      cmds.push({
        id: "import",
        label: "Import Project",
        icon: <Upload className="w-4 h-4" />,
        action: onImport,
        category: "command",
      });
    }

    if (onOpenGitHub) {
      cmds.push({
        id: "github",
        label: "GitHub",
        icon: <Github className="w-4 h-4" />,
        action: onOpenGitHub,
        category: "navigation",
      });
    }

    if (onOpenSearch) {
      cmds.push({
        id: "search",
        label: "Search in Files",
        icon: <Search className="w-4 h-4" />,
        action: onOpenSearch,
        category: "navigation",
      });
    }

    if (onOpenTerminal) {
      cmds.push({
        id: "terminal",
        label: "Toggle Terminal",
        description: "Ctrl+`",
        icon: <Terminal className="w-4 h-4" />,
        action: onOpenTerminal,
        category: "navigation",
      });
    }

    if (onOpenSettings) {
      cmds.push({
        id: "settings",
        label: "Open Settings",
        icon: <Settings className="w-4 h-4" />,
        action: onOpenSettings,
        category: "navigation",
      });
    }

    return cmds;
  }, [onSave, onRun, onRefreshPreview, onNewFile, onNewFolder, onNewProject, onExport, onImport, onOpenGitHub, onOpenSearch, onOpenTerminal, onOpenSettings]);

  // Filter commands based on search (when prefixed with >)
  const filteredCommands = useMemo(() => {
    if (!search.startsWith(">")) {
      // Show all commands if no search or not command mode
      return search ? [] : commands;
    }
    const query = search.slice(1).toLowerCase().trim();
    if (!query) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query)
    );
  }, [commands, search]);

  const handleSelect = useCallback((callback: () => void) => {
    onOpenChange(false);
    setSearch("");
    callback();
  }, [onOpenChange]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const showFiles = !search.startsWith(">") && (search.length > 0 || filteredFiles.length > 0);
  const showCommands = search.startsWith(">") || search.length === 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search files or type > for commands..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Files section */}
        {showFiles && filteredFiles.length > 0 && (
          <CommandGroup heading="Files">
            {filteredFiles.map(({ file, path }) => (
              <CommandItem
                key={path}
                value={path}
                onSelect={() => handleSelect(() => onFileSelect(file, path))}
                className="flex items-center gap-2"
              >
                <File className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{file.name}</span>
                  <span className="text-xs text-muted-foreground">{path}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showFiles && filteredFiles.length > 0 && showCommands && filteredCommands.length > 0 && (
          <CommandSeparator />
        )}

        {/* Commands section */}
        {showCommands && filteredCommands.length > 0 && (
          <>
            <CommandGroup heading="Commands">
              {filteredCommands
                .filter((cmd) => cmd.category === "command")
                .map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => handleSelect(cmd.action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.description && (
                      <span className="text-xs text-muted-foreground">{cmd.description}</span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              {filteredCommands
                .filter((cmd) => cmd.category === "navigation")
                .map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => handleSelect(cmd.action)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {cmd.icon}
                      <span>{cmd.label}</span>
                    </div>
                    {cmd.description && (
                      <span className="text-xs text-muted-foreground">{cmd.description}</span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}

        {/* Quick tip */}
        {!search && (
          <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
            <span className="font-medium">Tip:</span> Type <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px]">&gt;</kbd> to search commands
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default CommandPalette;
