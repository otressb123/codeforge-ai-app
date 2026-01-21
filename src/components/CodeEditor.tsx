import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import { Loader2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useState, useCallback } from "react";

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

interface DiagnosticCounts {
  errors: number;
  warnings: number;
  info: number;
}

const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
      return 'typescriptreact';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'javascriptreact';
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const CodeEditor = ({ content, language, onChange }: CodeEditorProps) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCounts>({ errors: 0, warnings: 0, info: 0 });

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Configure TypeScript/JavaScript compiler options for JSX support
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      strict: true,
      skipLibCheck: true,
      allowSyntheticDefaultImports: true,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      allowSyntheticDefaultImports: true,
    });

    // Enable validation
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add React types definition for better JSX support
    const reactTypes = `
      declare namespace React {
        interface ReactElement<P = any> {}
        interface ReactNode {}
        interface FC<P = {}> {
          (props: P): ReactElement | null;
        }
        function createElement(type: any, props?: any, ...children: any[]): ReactElement;
        function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
        function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        function useMemo<T>(factory: () => T, deps: any[]): T;
        function useRef<T>(initial: T): { current: T };
        function useContext<T>(context: any): T;
      }
      declare const React: typeof React;
      export = React;
      export as namespace React;
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(reactTypes, 'react.d.ts');
    monaco.languages.typescript.javascriptDefaults.addExtraLib(reactTypes, 'react.d.ts');
  };

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {

    // Listen for model markers (diagnostics) changes
    const updateDiagnostics = () => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const counts = { errors: 0, warnings: 0, info: 0 };
        
        markers.forEach(marker => {
          switch (marker.severity) {
            case monaco.MarkerSeverity.Error:
              counts.errors++;
              break;
            case monaco.MarkerSeverity.Warning:
              counts.warnings++;
              break;
            case monaco.MarkerSeverity.Info:
            case monaco.MarkerSeverity.Hint:
              counts.info++;
              break;
          }
        });
        
        setDiagnostics(counts);
      }
    };

    // Initial check
    setTimeout(updateDiagnostics, 500);

    // Listen for changes
    const disposable = monaco.editor.onDidChangeMarkers(() => {
      updateDiagnostics();
    });

    // Also update on content change (with debounce)
    let timeout: NodeJS.Timeout;
    const contentDisposable = editor.onDidChangeModelContent(() => {
      clearTimeout(timeout);
      timeout = setTimeout(updateDiagnostics, 300);
    });

    return () => {
      disposable.dispose();
      contentDisposable.dispose();
      clearTimeout(timeout);
    };
  }, []);

  const totalIssues = diagnostics.errors + diagnostics.warnings + diagnostics.info;

  return (
    <div className="h-full w-full bg-editor flex flex-col">
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={onChange}
          theme="vs-dark"
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            lineNumbers: "on",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 16 },
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            formatOnPaste: true,
            formatOnType: true,
            // Enable inline hints and diagnostics
            inlayHints: { enabled: "on" },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            parameterHints: { enabled: true },
            // Show lightbulb for quick fixes
            lightbulb: { enabled: "on" },
            // Show squiggly lines for errors
            renderValidationDecorations: "on",
          }}
        />
      </div>
      
      {/* Status bar with diagnostic counts */}
      <div className="h-6 bg-panel border-t border-border flex items-center justify-between px-3 text-xs">
        <div className="flex items-center gap-3">
          {diagnostics.errors > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              {diagnostics.errors} {diagnostics.errors === 1 ? 'error' : 'errors'}
            </span>
          )}
          {diagnostics.warnings > 0 && (
            <span className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3 h-3" />
              {diagnostics.warnings} {diagnostics.warnings === 1 ? 'warning' : 'warnings'}
            </span>
          )}
          {diagnostics.info > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Info className="w-3 h-3" />
              {diagnostics.info}
            </span>
          )}
          {totalIssues === 0 && (
            <span className="text-success flex items-center gap-1">
              ✓ No problems
            </span>
          )}
        </div>
        <span className="text-muted-foreground">{language}</span>
      </div>
    </div>
  );
};

export { getLanguage };
export default CodeEditor;
