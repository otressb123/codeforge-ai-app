import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import ActivityBar from "@/components/ActivityBar";
import FileExplorer, { FileNode } from "@/components/FileExplorer";
import EditorTabs from "@/components/EditorTabs";
import CodeEditor, { getLanguage } from "@/components/CodeEditor";
import AIChatPanel from "@/components/AIChatPanel";
import PreviewPanel, { PreviewPanelRef } from "@/components/PreviewPanel";
import SearchPanel from "@/components/SearchPanel";
import TerminalPanel from "@/components/TerminalPanel";
import SettingsPanel from "@/components/SettingsPanel";
import NewProjectDialog from "@/components/NewProjectDialog";
import GitHubDialog from "@/components/GitHubDialog";
import ExportImportDialog from "@/components/ExportImportDialog";
import CommandPalette from "@/components/CommandPalette";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

type SidebarTab = "files" | "search" | "ai" | "terminal" | "settings";

interface OpenFile {
  path: string;
  name: string;
  content: string;
  isModified: boolean;
}

const initialFiles: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Button.tsx", type: "file", content: `import React from 'react';\n\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button = ({ children, onClick, variant = 'primary' }: ButtonProps) => {\n  return (\n    <button\n      onClick={onClick}\n      className={\`px-4 py-2 rounded-lg font-medium transition-all \${\n        variant === 'primary'\n          ? 'bg-primary text-white hover:bg-primary/90'\n          : 'bg-secondary text-foreground hover:bg-secondary/80'\n      }\`}\n    >\n      {children}\n    </button>\n  );\n};` },
          { name: "Header.tsx", type: "file", content: `import React from 'react';\nimport { Button } from './Button';\n\nexport const Header = () => {\n  return (\n    <header className="flex items-center justify-between p-4 bg-card border-b">\n      <h1 className="text-xl font-bold">My App</h1>\n      <nav className="flex gap-4">\n        <Button>Home</Button>\n        <Button variant="secondary">About</Button>\n      </nav>\n    </header>\n  );\n};` },
        ],
      },
      { name: "App.tsx", type: "file", content: `import React from 'react';\nimport { Header } from './components/Header';\nimport { Button } from './components/Button';\n\nfunction App() {\n  return (\n    <div className="min-h-screen bg-background">\n      <Header />\n      <main className="container mx-auto p-8">\n        <h2 className="text-3xl font-bold mb-4">Welcome to My App</h2>\n        <p className="text-muted-foreground mb-6">\n          This is a demo application built with React and TypeScript.\n        </p>\n        <div className="flex gap-4">\n          <Button onClick={() => alert('Clicked!')}>Get Started</Button>\n          <Button variant="secondary">Learn More</Button>\n        </div>\n      </main>\n    </div>\n  );\n}\n\nexport default App;` },
      { name: "index.tsx", type: "file", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);` },
      { name: "styles.css", type: "file", content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --primary: 187 100% 50%;\n  --secondary: 222 47% 12%;\n  --background: 222 47% 6%;\n  --foreground: 210 40% 98%;\n}\n\nbody {\n  @apply bg-background text-foreground;\n}` },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "index.html", type: "file", content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>My App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/index.tsx"></script>\n</body>\n</html>` },
    ],
  },
  { name: "package.json", type: "file", content: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "typescript": "^5.0.0",\n    "vite": "^5.0.0"\n  }\n}` },
  { name: "README.md", type: "file", content: `# My App\n\nA modern web application built with React and TypeScript.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Features\n\n- ⚡ Fast development with Vite\n- 🎨 Beautiful UI with Tailwind CSS\n- 📦 TypeScript for type safety\n- 🧩 Component-based architecture` },
];

const IDE = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("files");
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("my-awesome-app");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const previewRef = useRef<PreviewPanelRef>(null);

  // Screenshot capture function for AI
  const handleCaptureScreenshot = useCallback(async () => {
    if (!previewRef.current) return null;
    return previewRef.current.captureScreenshot();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => handleSave(),
    onExport: () => setIsExportImportOpen(true),
    onNewFile: () => handleCreateFile("/src", "NewFile.tsx"),
    onNewProject: () => setIsNewProjectOpen(true),
    onRefreshPreview: () => setPreviewKey(prev => prev + 1),
    onQuickOpen: () => setIsCommandPaletteOpen(true),
    onToggleSidebar: () => setActiveTab(prev => prev === "files" ? "ai" : "files"),
    onToggleTerminal: () => setActiveTab(prev => prev === "terminal" ? "files" : "terminal"),
  });

  const findFileContent = useCallback((files: FileNode[], path: string): string | null => {
    for (const file of files) {
      if (file.type === "file") {
        const fullPath = `/${file.name}`;
        if (path.endsWith(fullPath)) {
          return file.content || "";
        }
      }
      if (file.children) {
        const content = findFileContent(file.children, path);
        if (content !== null) return content;
      }
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: FileNode, path: string) => {
    if (file.type !== "file") return;

    setSelectedPath(path);

    const existingFile = openFiles.find((f) => f.path === path);
    if (existingFile) {
      setActiveFile(path);
      return;
    }

    const content = file.content || "";
    setOpenFiles((prev) => [...prev, { path, name: file.name, content, isModified: false }]);
    setActiveFile(path);
  }, [openFiles]);

  const handleTabClose = useCallback((path: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((f) => f.path !== path);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  }, [activeFile, openFiles]);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === activeFile ? { ...f, content: value, isModified: true } : f))
    );
  }, [activeFile]);

  // Handle AI-generated code - add to editor
  const handleAICodeGenerated = useCallback((code: string, filename: string) => {
    const path = `/src/${filename}`;
    
    // Check if file already exists
    const existingFile = openFiles.find((f) => f.name === filename);
    
    if (existingFile) {
      // Update existing file
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.name === filename ? { ...f, content: code, isModified: true } : f
        )
      );
      setActiveFile(existingFile.path);
    } else {
      // Create new file tab
      const newFile: OpenFile = {
        path,
        name: filename,
        content: code,
        isModified: true,
      };
      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFile(path);
    }
  }, [openFiles]);

  // Handle bulk file generation from AI (Cursor-style) - auto-save and update preview
  const handleFilesGenerated = useCallback((generatedFiles: { path: string; content: string; language: string }[]) => {
    generatedFiles.forEach(({ path, content }) => {
      // Parse the path to create necessary folders
      const pathParts = path.split('/').filter(Boolean);
      const fileName = pathParts.pop()!;
      
      // Create folder structure if needed
      pathParts.forEach((_, index) => {
        const folderParts = pathParts.slice(0, index + 1);
        
        const folderExists = (nodes: FileNode[], parts: string[]): boolean => {
          if (parts.length === 0) return true;
          const folder = nodes.find(n => n.name === parts[0] && n.type === 'folder');
          if (!folder) return false;
          if (parts.length === 1) return true;
          return folderExists(folder.children || [], parts.slice(1));
        };
        
        setFiles(prev => {
          if (!folderExists(prev, folderParts)) {
            const newFolder: FileNode = { name: folderParts[folderParts.length - 1], type: 'folder', children: [] };
            return addNodeToPath(prev, folderParts.slice(0, -1), newFolder);
          }
          return prev;
        });
      });
      
      // Create or update the file in file system
      const newFile: FileNode = { name: fileName, type: 'file', content };
      setFiles(prev => {
        // Check if file exists and update it
        const updateFileInPath = (nodes: FileNode[], parts: string[], file: FileNode): FileNode[] => {
          if (parts.length === 0) {
            const existingIndex = nodes.findIndex(n => n.name === file.name);
            if (existingIndex >= 0) {
              return nodes.map((n, i) => i === existingIndex ? { ...n, content: file.content } : n);
            }
            return [...nodes, file];
          }
          return nodes.map(n => {
            if (n.type === 'folder' && n.name === parts[0]) {
              return { ...n, children: updateFileInPath(n.children || [], parts.slice(1), file) };
            }
            return n;
          });
        };
        return updateFileInPath(prev, pathParts, newFile);
      });
      
      // Open the file in editor - AUTO-SAVED (isModified: false)
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      setOpenFiles(prev => {
        const exists = prev.find(f => f.path === fullPath);
        if (exists) {
          return prev.map(f => f.path === fullPath ? { ...f, content, isModified: false } : f);
        }
        return [...prev, { path: fullPath, name: fileName, content, isModified: false }];
      });
    });
    
    // Set the first file as active
    if (generatedFiles.length > 0) {
      const firstPath = generatedFiles[0].path.startsWith('/') ? generatedFiles[0].path : `/${generatedFiles[0].path}`;
      setActiveFile(firstPath);
    }
    
    // Auto-refresh the preview after files are generated
    setPreviewKey(prev => prev + 1);
  }, []);

  const handleSave = useCallback(() => {
    setOpenFiles((prev) => prev.map((f) => ({ ...f, isModified: false })));
    toast.success("All files saved!");
  }, []);

  const handleRun = () => {
    setPreviewKey(prev => prev + 1);
    toast.success("Running application...");
  };

  const handleImportProject = (importedFiles: FileNode[]) => {
    setFiles(importedFiles);
    setOpenFiles([]);
    setActiveFile(null);
    setSelectedPath(null);
    toast.success("Project imported successfully!");
  };

  const handleGitHubConnect = () => {
    setIsGitHubConnected(true);
    toast.success("Connected to GitHub!");
  };

  const handleGitHubPush = (message: string) => {
    toast.success(`Pushed changes: ${message}`);
  };

  const handleGitHubPull = () => {
    toast.success("Pulled latest changes!");
  };

  const handleNewProject = (name: string, newFiles: FileNode[]) => {
    setProjectName(name);
    setFiles(newFiles);
    setOpenFiles([]);
    setActiveFile(null);
    setSelectedPath(null);
    toast.success(`Created project: ${name}`);
  };

  // Helper to find parent folder and add node
  const addNodeToPath = (nodes: FileNode[], pathParts: string[], newNode: FileNode): FileNode[] => {
    if (pathParts.length === 0) {
      return [...nodes, newNode];
    }

    return nodes.map((node) => {
      if (node.type === "folder" && node.name === pathParts[0]) {
        if (pathParts.length === 1) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
          };
        }
        return {
          ...node,
          children: addNodeToPath(node.children || [], pathParts.slice(1), newNode),
        };
      }
      return node;
    });
  };

  // Helper to remove node from path
  const removeNodeFromPath = (nodes: FileNode[], pathParts: string[]): FileNode[] => {
    if (pathParts.length === 1) {
      return nodes.filter((node) => node.name !== pathParts[0]);
    }

    return nodes.map((node) => {
      if (node.type === "folder" && node.name === pathParts[0]) {
        return {
          ...node,
          children: removeNodeFromPath(node.children || [], pathParts.slice(1)),
        };
      }
      return node;
    });
  };

  // Helper to rename node
  const renameNodeInPath = (nodes: FileNode[], pathParts: string[], newName: string): FileNode[] => {
    if (pathParts.length === 1) {
      return nodes.map((node) =>
        node.name === pathParts[0] ? { ...node, name: newName } : node
      );
    }

    return nodes.map((node) => {
      if (node.type === "folder" && node.name === pathParts[0]) {
        return {
          ...node,
          children: renameNodeInPath(node.children || [], pathParts.slice(1), newName),
        };
      }
      return node;
    });
  };

  const handleCreateFile = useCallback((parentPath: string, fileName: string) => {
    const pathParts = parentPath.split("/").filter(Boolean);
    const newFile: FileNode = {
      name: fileName,
      type: "file",
      content: `// ${fileName}\n`,
    };
    setFiles((prev) => addNodeToPath(prev, pathParts, newFile));
    
    // Open the new file in editor
    const fullPath = parentPath ? `${parentPath}/${fileName}` : `/${fileName}`;
    setOpenFiles((prev) => [...prev, { path: fullPath, name: fileName, content: newFile.content || "", isModified: true }]);
    setActiveFile(fullPath);
    toast.success(`Created ${fileName}`);
  }, []);

  const handleCreateFolder = useCallback((parentPath: string, folderName: string) => {
    const pathParts = parentPath.split("/").filter(Boolean);
    const newFolder: FileNode = {
      name: folderName,
      type: "folder",
      children: [],
    };
    setFiles((prev) => addNodeToPath(prev, pathParts, newFolder));
    toast.success(`Created folder ${folderName}`);
  }, []);

  const handleDeleteNode = useCallback((nodePath: string) => {
    const pathParts = nodePath.split("/").filter(Boolean);
    setFiles((prev) => removeNodeFromPath(prev, pathParts));
    
    // Close the file if it's open
    setOpenFiles((prev) => prev.filter((f) => !f.path.startsWith(nodePath)));
    if (activeFile?.startsWith(nodePath)) {
      setActiveFile(null);
    }
    toast.success("Deleted successfully");
  }, [activeFile]);

  const handleRenameNode = useCallback((nodePath: string, newName: string) => {
    const pathParts = nodePath.split("/").filter(Boolean);
    setFiles((prev) => renameNodeInPath(prev, pathParts, newName));
    
    // Update open files
    const oldName = pathParts[pathParts.length - 1];
    const newPath = nodePath.replace(new RegExp(`${oldName}$`), newName);
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === nodePath ? { ...f, path: newPath, name: newName } : f
      )
    );
    if (activeFile === nodePath) {
      setActiveFile(newPath);
    }
    toast.success(`Renamed to ${newName}`);
  }, [activeFile]);

  const currentFile = openFiles.find((f) => f.path === activeFile);

  // Generate preview HTML from files (including file system for auto-generated files)
  const getPreviewHtml = useCallback(() => {
    // Helper to find file in file tree
    const findFileInTree = (nodes: FileNode[], fileName: string): FileNode | null => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name === fileName) return node;
        if (node.children) {
          const found = findFileInTree(node.children, fileName);
          if (found) return found;
        }
      }
      return null;
    };

    // First check open files, then fall back to file tree
    const getFileContent = (fileName: string): string | null => {
      const openFile = openFiles.find(f => f.name === fileName);
      if (openFile) return openFile.content;
      const treeFile = findFileInTree(files, fileName);
      return treeFile?.content || null;
    };

    // Find index.html
    const htmlContent = getFileContent("index.html");
    const cssContent = getFileContent("styles.css") || getFileContent("style.css");
    
    if (htmlContent) {
      let html = htmlContent;
      // Inject CSS if available
      if (cssContent) {
        html = html.replace('</head>', `<style>${cssContent}</style></head>`);
      }
      return html;
    }
    
    // Generate simple preview from current file
    if (currentFile) {
      if (currentFile.name.endsWith('.html')) {
        return currentFile.content;
      }
      if (currentFile.name.endsWith('.css')) {
        return `<!DOCTYPE html><html><head><style>${currentFile.content}</style></head><body><h1>CSS Preview</h1><p>Editing: ${currentFile.name}</p><div class="demo">Demo content</div></body></html>`;
      }
    }
    
    return null;
  }, [openFiles, currentFile, files]);

  const renderSidePanel = () => {
    switch (activeTab) {
      case "files":
        return (
          <FileExplorer
            files={files}
            onFileSelect={handleFileSelect}
            selectedPath={selectedPath}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDeleteNode={handleDeleteNode}
            onRenameNode={handleRenameNode}
          />
        );
      case "search":
        return <SearchPanel />;
      case "ai":
        return <AIChatPanel onCodeGenerated={handleAICodeGenerated} onFilesGenerated={handleFilesGenerated} previewHtml={getPreviewHtml()} onCaptureScreenshot={handleCaptureScreenshot} />;
      case "terminal":
        return <TerminalPanel />;
      case "settings":
        return (
          <SettingsPanel
            onOpenGitHub={() => setIsGitHubOpen(true)}
            onExport={() => setIsExportImportOpen(true)}
            isGitHubConnected={isGitHubConnected}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar 
        projectName={projectName} 
        onSave={handleSave} 
        onRun={handleRun} 
        onNewProject={() => setIsNewProjectOpen(true)}
        onGitHub={() => setIsGitHubOpen(true)}
        onExportImport={() => setIsExportImportOpen(true)}
        isGitHubConnected={isGitHubConnected}
      />
      
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onCreateProject={handleNewProject}
      />

      <GitHubDialog
        open={isGitHubOpen}
        onOpenChange={setIsGitHubOpen}
        projectName={projectName}
        onConnect={handleGitHubConnect}
        onPush={handleGitHubPush}
        onPull={handleGitHubPull}
      />

      <ExportImportDialog
        open={isExportImportOpen}
        onOpenChange={setIsExportImportOpen}
        projectName={projectName}
        files={files}
        onImport={handleImportProject}
      />

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Side Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <motion.div
              className="h-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderSidePanel()}
            </motion.div>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Main Content */}
          <ResizablePanel defaultSize={55}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={70}>
                <div className="h-full flex flex-col bg-editor">
                  <EditorTabs
                    tabs={openFiles}
                    activeTab={activeFile}
                    onTabSelect={setActiveFile}
                    onTabClose={handleTabClose}
                  />
                  {currentFile ? (
                    <div className="flex-1">
                      <CodeEditor
                        content={currentFile.content}
                        language={getLanguage(currentFile.name)}
                        onChange={handleCodeChange}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-3xl">📝</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No file open</h3>
                        <p className="text-sm text-muted-foreground">
                          Select a file from the explorer to start editing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

              {/* Terminal */}
              <ResizablePanel defaultSize={30} minSize={10}>
                <TerminalPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Preview / AI Chat */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={60}>
                <PreviewPanel 
                  ref={previewRef}
                  key={previewKey}
                  html={getPreviewHtml()} 
                  files={files}
                  onRefresh={() => setPreviewKey(prev => prev + 1)}
                />
              </ResizablePanel>
              <ResizableHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={40}>
                <AIChatPanel onCodeGenerated={handleAICodeGenerated} onFilesGenerated={handleFilesGenerated} previewHtml={getPreviewHtml()} onCaptureScreenshot={handleCaptureScreenshot} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        files={files}
        onFileSelect={handleFileSelect}
        onSave={handleSave}
        onExport={() => setIsExportImportOpen(true)}
        onImport={() => setIsExportImportOpen(true)}
        onRefreshPreview={() => setPreviewKey(prev => prev + 1)}
        onNewFile={() => handleCreateFile("/src", "NewFile.tsx")}
        onNewFolder={() => handleCreateFolder("/src", "new-folder")}
        onNewProject={() => setIsNewProjectOpen(true)}
        onOpenGitHub={() => setIsGitHubOpen(true)}
        onOpenSettings={() => setActiveTab("settings")}
        onOpenSearch={() => setActiveTab("search")}
        onOpenTerminal={() => setActiveTab("terminal")}
        onRun={handleRun}
      />
    </div>
  );
};

export default IDE;
