import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import ActivityBar from "@/components/ActivityBar";
import FileExplorer, { FileNode } from "@/components/FileExplorer";
import EditorTabs from "@/components/EditorTabs";
import CodeEditor, { getLanguage } from "@/components/CodeEditor";
import AIChatPanel from "@/components/AIChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import SearchPanel from "@/components/SearchPanel";
import TerminalPanel from "@/components/TerminalPanel";
import SettingsPanel from "@/components/SettingsPanel";
import NewProjectDialog from "@/components/NewProjectDialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { toast } from "sonner";

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

  const handleSave = () => {
    setOpenFiles((prev) => prev.map((f) => ({ ...f, isModified: false })));
    toast.success("All files saved!");
  };

  const handleRun = () => {
    toast.success("Running application...");
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

  // Generate preview HTML from open files
  const getPreviewHtml = useCallback(() => {
    // Find index.html
    const htmlFile = openFiles.find(f => f.name === "index.html");
    const cssFile = openFiles.find(f => f.name === "styles.css" || f.name.endsWith(".css"));
    const appFile = openFiles.find(f => f.name === "App.tsx" || f.name === "App.jsx");
    
    if (htmlFile) {
      let html = htmlFile.content;
      // Inject CSS if available
      if (cssFile) {
        html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
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
  }, [openFiles, currentFile]);

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
        return <AIChatPanel />;
      case "terminal":
        return <TerminalPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar 
        projectName={projectName} 
        onSave={handleSave} 
        onRun={handleRun} 
        onNewProject={() => setIsNewProjectOpen(true)} 
      />
      
      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onCreateProject={handleNewProject}
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
                <PreviewPanel html={getPreviewHtml()} />
              </ResizablePanel>
              <ResizableHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />
              <ResizablePanel defaultSize={40}>
                <AIChatPanel onCodeGenerated={handleAICodeGenerated} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default IDE;
