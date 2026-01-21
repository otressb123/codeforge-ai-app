import { FileNode } from "@/components/FileExplorer";

// Flatten file tree to a map of path -> content
export const flattenFiles = (nodes: FileNode[], basePath = ""): Record<string, string> => {
  const result: Record<string, string> = {};
  
  for (const node of nodes) {
    const path = basePath ? `${basePath}/${node.name}` : node.name;
    if (node.type === "file") {
      result[path] = node.content || "";
    }
    if (node.children) {
      Object.assign(result, flattenFiles(node.children, path));
    }
  }
  
  return result;
};

// Find file content by name (searches all paths)
const findFileByName = (files: Record<string, string>, name: string): string | null => {
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(name) || path.endsWith(`/${name}`)) {
      return content;
    }
  }
  return null;
};

// Generate a complete HTML preview from the file tree
export const bundlePreview = (files: FileNode[]): string => {
  const flatFiles = flattenFiles(files);
  
  // Find index.html
  let htmlContent = findFileByName(flatFiles, "index.html");
  const cssContent = findFileByName(flatFiles, "styles.css") || findFileByName(flatFiles, "style.css");
  
  // Collect all JS/TS files for script bundling
  const jsFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(flatFiles)) {
    if (path.match(/\.(js|jsx|ts|tsx)$/) && !path.includes("node_modules")) {
      jsFiles[path] = content;
    }
  }

  // If we have an index.html, enhance it
  if (htmlContent) {
    // Inject CSS if found
    if (cssContent) {
      htmlContent = htmlContent.replace("</head>", `<style>${cssContent}</style></head>`);
    }
    
    // Inline any JS script references
    for (const [path, content] of Object.entries(jsFiles)) {
      const fileName = path.split("/").pop();
      // Look for script tags referencing this file
      const scriptRegex = new RegExp(`<script[^>]*src=["'][^"']*${fileName}["'][^>]*><\\/script>`, "g");
      if (htmlContent.match(scriptRegex)) {
        // Convert JSX/TSX to plain JS (basic transformation)
        const transformedJs = transformToJS(content);
        htmlContent = htmlContent.replace(scriptRegex, `<script>${transformedJs}</script>`);
      }
    }
    
    // Add error handling script
    htmlContent = htmlContent.replace("</body>", `
      <script>
        window.onerror = function(msg, url, line) {
          console.error('Error:', msg, 'at line', line);
          return false;
        };
      </script>
    </body>`);
    
    return htmlContent;
  }
  
  // If no index.html, try to generate a preview from React files
  const appFile = findFileByName(flatFiles, "App.tsx") || findFileByName(flatFiles, "App.jsx");
  const mainFile = findFileByName(flatFiles, "main.tsx") || findFileByName(flatFiles, "index.tsx");
  
  if (appFile || mainFile) {
    return generateReactPreview(flatFiles, cssContent);
  }
  
  // Fallback: show file list
  return generateFileListPreview(Object.keys(flatFiles));
};

// Basic JSX to JS transformation (simplified)
const transformToJS = (code: string): string => {
  // Remove TypeScript type annotations
  let transformed = code
    .replace(/:\s*(string|number|boolean|any|void|null|undefined)\s*/g, "")
    .replace(/:\s*\w+\[\]/g, "")
    .replace(/<[A-Z]\w*>/g, "")
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, "");
  
  // Basic JSX transformation
  transformed = transformed
    .replace(/import\s+.*from\s+['"][^'"]+['"];?/g, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/export\s+/g, "");
  
  return transformed;
};

// Generate a React-like preview
const generateReactPreview = (files: Record<string, string>, css: string | null): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      min-height: 100vh;
      color: white;
    }
    .preview-container {
      padding: 2rem;
    }
    .preview-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .preview-title {
      font-size: 2rem;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .preview-subtitle {
      color: rgba(255,255,255,0.6);
    }
    .file-list {
      max-width: 600px;
      margin: 0 auto;
    }
    .file-item {
      background: rgba(255,255,255,0.1);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .file-icon { opacity: 0.7; }
    ${css || ""}
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1 class="preview-title">React Project</h1>
      <p class="preview-subtitle">Build preview - Full bundling simulated</p>
    </div>
    <div class="file-list">
      ${Object.keys(files).map(f => `
        <div class="file-item">
          <span class="file-icon">📄</span>
          <span>${f}</span>
        </div>
      `).join("")}
    </div>
  </div>
</body>
</html>`;
};

// Fallback preview showing file list
const generateFileListPreview = (filePaths: string[]): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      min-height: 100vh;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container { text-align: center; padding: 2rem; }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .file-list {
      text-align: left;
      background: rgba(255,255,255,0.1);
      padding: 1rem;
      border-radius: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }
    .file { padding: 0.25rem 0; opacity: 0.8; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Project Files</h1>
    <div class="file-list">
      ${filePaths.map(f => `<div class="file">📄 ${f}</div>`).join("")}
    </div>
  </div>
</body>
</html>`;
};
