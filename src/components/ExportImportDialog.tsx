import { useState, useCallback, useRef } from "react";
import { Download, Upload, FolderArchive, FileArchive, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FileNode } from "@/components/FileExplorer";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  files: FileNode[];
  onImport: (files: FileNode[]) => void;
}

const countFiles = (nodes: FileNode[]): number => {
  return nodes.reduce((acc, node) => {
    if (node.type === "file") return acc + 1;
    return acc + countFiles(node.children || []);
  }, 0);
};

const ExportImportDialog = ({
  open,
  onOpenChange,
  projectName,
  files,
  onImport,
}: ExportImportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFilesToZip = useCallback((zip: JSZip, nodes: FileNode[], basePath = "") => {
    for (const node of nodes) {
      const path = basePath ? `${basePath}/${node.name}` : node.name;
      if (node.type === "file") {
        zip.file(path, node.content || "");
      } else if (node.children) {
        addFilesToZip(zip, node.children, path);
      }
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      addFilesToZip(zip, files);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${projectName}.zip`);
      
      toast.success("Project exported successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to export project");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const parseZipToFiles = async (file: File): Promise<FileNode[]> => {
    const zip = await JSZip.loadAsync(file);
    const rootNodes: FileNode[] = [];
    const folderMap: Record<string, FileNode> = {};

    const entries = Object.entries(zip.files).sort(([a], [b]) => a.localeCompare(b));

    for (const [path, zipEntry] of entries) {
      if (path.endsWith("/")) continue; // Skip folder entries
      
      const parts = path.split("/").filter(Boolean);
      const fileName = parts.pop()!;
      
      // Create folder structure
      let currentLevel = rootNodes;
      let currentPath = "";
      
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderMap[currentPath]) {
          const newFolder: FileNode = {
            name: part,
            type: "folder",
            children: [],
          };
          folderMap[currentPath] = newFolder;
          currentLevel.push(newFolder);
        }
        currentLevel = folderMap[currentPath].children!;
      }
      
      // Add file
      const content = await zipEntry.async("string");
      currentLevel.push({
        name: fileName,
        type: "file",
        content,
      });
    }

    return rootNodes;
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const importedFiles = await parseZipToFiles(file);
      onImport(importedFiles);
      toast.success("Project imported successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to import project. Make sure it's a valid ZIP file.");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".zip")) {
      handleImport(file);
    } else {
      toast.error("Please drop a ZIP file");
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const fileCount = countFiles(files);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-primary" />
            Export / Import Project
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/30">
            <TabsTrigger value="export" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileArchive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{projectName}.zip</p>
                  <p className="text-sm text-muted-foreground">{fileCount} files</p>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• All project files will be included</p>
                <p>• Folder structure will be preserved</p>
                <p>• Download as a ZIP archive</p>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download ZIP
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm text-foreground mb-1">
                {dragActive ? "Drop your ZIP file here" : "Drag & drop a ZIP file"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <Button 
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select ZIP File
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Importing will replace your current project
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImportDialog;
