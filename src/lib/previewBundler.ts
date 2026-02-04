import { FileNode } from "@/components/FileExplorer";
import * as Babel from "@babel/standalone";

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

// Transpile JSX/TSX to JavaScript using Babel
const transpileCode = (code: string, filename: string): string => {
  try {
    const result = Babel.transform(code, {
      presets: ["react", "typescript"],
      filename,
      plugins: [],
    });
    return result?.code || "";
  } catch (error) {
    console.error("Babel transpilation error:", error);
    return `console.error("Transpilation error: ${error instanceof Error ? error.message.replace(/"/g, '\\"') : 'Unknown error'}");`;
  }
};

// Resolve imports and build a module system
const buildModuleSystem = (files: Record<string, string>): string => {
  const modules: Record<string, string> = {};
  
  // Process all JS/TS/JSX/TSX files
  for (const [path, content] of Object.entries(files)) {
    if (path.match(/\.(js|jsx|ts|tsx)$/) && !path.includes("node_modules")) {
      // Normalize path
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      
      // Process imports to use our module system
      let processedCode = content;
      
      // Remove type-only imports (TypeScript)
      processedCode = processedCode.replace(/import\s+type\s+.*?;/g, "");
      processedCode = processedCode.replace(/import\s*\{[^}]*\btype\s+[^}]*\}\s*from\s*['"][^'"]+['"];?/g, (match) => {
        // Remove type imports from mixed imports
        return match.replace(/\btype\s+\w+,?\s*/g, "").replace(/,\s*}/g, "}").replace(/{\s*,/g, "{");
      });
      
      // Transform relative imports
      processedCode = processedCode.replace(
        /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g,
        (match, imports, modulePath) => {
          // Skip external modules - we'll provide them globally
          if (!modulePath.startsWith(".") && !modulePath.startsWith("@/") && !modulePath.startsWith("/")) {
            return `// External: ${match}`;
          }
          
          // Resolve relative path
          let resolvedPath = modulePath;
          if (modulePath.startsWith("@/")) {
            resolvedPath = "/src" + modulePath.slice(1);
          } else if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
            // Resolve relative to current file
            const currentDir = normalizedPath.substring(0, normalizedPath.lastIndexOf("/"));
            const parts = [...currentDir.split("/"), ...modulePath.split("/")];
            const resolved: string[] = [];
            for (const part of parts) {
              if (part === "..") resolved.pop();
              else if (part !== "." && part !== "") resolved.push(part);
            }
            resolvedPath = "/" + resolved.join("/");
          }
          
          // Add extension if missing
          if (!resolvedPath.match(/\.(js|jsx|ts|tsx|css)$/)) {
            const extensions = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
            for (const ext of extensions) {
              const testPath = resolvedPath + ext;
              const normalizedTestPath = testPath.startsWith("/") ? testPath.slice(1) : testPath;
              if (Object.keys(files).some(p => p === normalizedTestPath || p === testPath.slice(1))) {
                resolvedPath = testPath;
                break;
              }
            }
          }
          
          // Handle CSS imports
          if (resolvedPath.endsWith(".css")) {
            return `// CSS import: ${modulePath}`;
          }
          
          return `const ${imports.includes("{") ? imports : `{ default: ${imports.trim()} }`} = __require("${resolvedPath}")`;
        }
      );
      
      // Transform exports
      processedCode = processedCode.replace(/export\s+default\s+/g, "__exports.default = ");
      processedCode = processedCode.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, "$1 $2; __exports.$2 = $2");
      processedCode = processedCode.replace(/export\s*\{([^}]+)\}/g, (_, exports) => {
        return exports.split(",").map((e: string) => {
          const [name, alias] = e.trim().split(/\s+as\s+/);
          return `__exports.${alias || name} = ${name}`;
        }).join("; ");
      });
      
      // Transpile
      const transpiled = transpileCode(processedCode, normalizedPath);
      modules[normalizedPath] = transpiled;
    }
  }
  
  return JSON.stringify(modules);
};

// Generate a complete HTML preview from the file tree
export const bundlePreview = (files: FileNode[]): string => {
  const flatFiles = flattenFiles(files);
  
  // Find index.html for pure HTML projects
  const htmlContent = findFileByName(flatFiles, "index.html");
  const globalCss = findFileByName(flatFiles, "index.css") || findFileByName(flatFiles, "styles.css") || findFileByName(flatFiles, "style.css") || "";
  
  // Check if this is a React project
  const hasApp = findFileByName(flatFiles, "App.tsx") || findFileByName(flatFiles, "App.jsx");
  const hasMain = findFileByName(flatFiles, "main.tsx") || findFileByName(flatFiles, "index.tsx");
  
  if (hasApp || hasMain) {
    return generateReactPreview(flatFiles, globalCss);
  }
  
  // For pure HTML projects
  if (htmlContent) {
    let enhanced = htmlContent;
    if (globalCss) {
      enhanced = enhanced.replace("</head>", `<style>${globalCss}</style></head>`);
    }
    return enhanced;
  }
  
  // Fallback
  return generateFileListPreview(Object.keys(flatFiles));
};

// Generate a working React preview
const generateReactPreview = (files: Record<string, string>, globalCss: string): string => {
  const modulesJson = buildModuleSystem(files);
  
  // Collect all CSS
  let allCss = globalCss;
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith(".css") && !path.includes("index.css") && !path.includes("styles.css")) {
      allCss += "\n" + content;
    }
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${allCss}
    
    /* Base reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* Error display */
    .preview-error {
      padding: 2rem;
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      margin: 1rem;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script>
    // Console capture for parent frame
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      function sendToParent(type, args) {
        try {
          parent.postMessage({
            type: 'console',
            message: '[' + type + '] ' + Array.from(args).map(a => String(a)).join(' ')
          }, '*');
        } catch(e) {}
      }
      
      console.log = function() { sendToParent('log', arguments); originalLog.apply(console, arguments); };
      console.error = function() { sendToParent('error', arguments); originalError.apply(console, arguments); };
      console.warn = function() { sendToParent('warn', arguments); originalWarn.apply(console, arguments); };
    })();
    
    // Module system
    const __modules = ${modulesJson};
    const __cache = {};
    
    function __require(path) {
      // Handle external modules
      if (path === 'react' || path === 'React') return { default: React, ...React };
      if (path === 'react-dom' || path === 'react-dom/client') {
        return { default: ReactDOM, createRoot: ReactDOM.createRoot };
      }
      
      // Normalize path
      let normalizedPath = path;
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      
      // Try with extensions
      const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
      let moduleCode = null;
      let foundPath = null;
      
      for (const ext of extensions) {
        const testPath = normalizedPath + ext;
        if (__modules[testPath]) {
          moduleCode = __modules[testPath];
          foundPath = testPath;
          break;
        }
      }
      
      if (!moduleCode) {
        console.warn('Module not found:', path);
        return { default: () => React.createElement('div', null, 'Module not found: ' + path) };
      }
      
      if (__cache[foundPath]) {
        return __cache[foundPath];
      }
      
      const __exports = {};
      try {
        const fn = new Function('__exports', '__require', 'React', 'ReactDOM', moduleCode);
        fn(__exports, __require, React, ReactDOM);
      } catch (error) {
        console.error('Module execution error in ' + foundPath + ':', error);
        __exports.default = () => React.createElement('div', { className: 'preview-error' }, 
          'Error in ' + foundPath + ':\\n' + error.message
        );
      }
      
      __cache[foundPath] = __exports;
      return __exports;
    }
    
    // Boot the app
    try {
      // Try to find and render the App
      let App;
      
      // Try main entry points
      const entryPoints = ['/src/main.tsx', '/src/index.tsx', '/src/main.jsx', '/src/index.jsx', '/main.tsx', '/index.tsx'];
      let mainModule = null;
      
      for (const entry of entryPoints) {
        if (__modules[entry]) {
          mainModule = __require(entry);
          break;
        }
      }
      
      // If main didn't render, try App directly
      const appPaths = ['/src/App.tsx', '/src/App.jsx', '/App.tsx', '/App.jsx'];
      for (const appPath of appPaths) {
        if (__modules[appPath]) {
          App = __require(appPath).default;
          break;
        }
      }
      
      if (App && !document.getElementById('root').hasChildNodes()) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      }
      
      if (!App && !mainModule) {
        document.getElementById('root').innerHTML = '<div class="preview-error">No App component found. Make sure you have App.tsx or main.tsx in your project.</div>';
      }
    } catch (error) {
      console.error('Render error:', error);
      document.getElementById('root').innerHTML = '<div class="preview-error">Render error: ' + error.message + '</div>';
    }
  </script>
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
