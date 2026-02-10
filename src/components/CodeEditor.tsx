import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import { Loader2, AlertCircle, AlertTriangle, Info, Wand2 } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { detectMissingLucideImports, detectMissingFramerMotionImports } from "@/lib/autoFixImports";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [autoFixedIcons, setAutoFixedIcons] = useState<string[]>([]);
  const [autoFixedFramer, setAutoFixedFramer] = useState<string[]>([]);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);

  // Detect auto-fixed imports whenever content changes
  useEffect(() => {
    if (language === "typescriptreact" || language === "typescript" || language === "javascriptreact" || language === "javascript") {
      setAutoFixedIcons(detectMissingLucideImports(content));
      setAutoFixedFramer(detectMissingFramerMotionImports(content));
    } else {
      setAutoFixedIcons([]);
      setAutoFixedFramer([]);
    }
  }, [content, language]);

  // Apply Monaco decorations for auto-fixed icon usages
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const allFixed = [...autoFixedIcons, ...autoFixedFramer];
    if (!editor || !monaco || allFixed.length === 0) {
      if (editor && decorationsRef.current) {
        decorationsRef.current.clear();
        decorationsRef.current = null;
      }
      return;
    }

    const model = editor.getModel();
    if (!model) return;

    const decorations: any[] = [];
    const lineCount = model.getLineCount();

    for (let lineNum = 1; lineNum <= lineCount; lineNum++) {
      const lineContent = model.getLineContent(lineNum);
      for (const name of allFixed) {
        const re = new RegExp(`(?:<${name}[\\s/>]|\\b${name}[.(\\b])`);
        if (re.test(lineContent)) {
          const lib = autoFixedIcons.includes(name) ? 'lucide-react' : 'framer-motion';
          decorations.push({
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
              isWholeLine: false,
              glyphMarginClassName: "auto-fix-glyph",
              glyphMarginHoverMessage: { value: `⚡ **${name}** will be auto-imported from \`${lib}\`` },
              afterContentClassName: "auto-fix-after",
            },
          });
          break;
        }
      }
    }

    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = editor.createDecorationsCollection(decorations);
  }, [autoFixedIcons, autoFixedFramer, content]);

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
    editorRef.current = editor;
    monacoRef.current = monaco;

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

  const totalAutoFixes = autoFixedIcons.length + autoFixedFramer.length;
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
            inlayHints: { enabled: "on" },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            parameterHints: { enabled: true },
            lightbulb: { enabled: "on" },
            renderValidationDecorations: "on",
            glyphMargin: true,
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
        <div className="flex items-center gap-3">
          {totalAutoFixes > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-primary cursor-help">
                    <Wand2 className="w-3 h-3" />
                    {totalAutoFixes} auto-import{totalAutoFixes > 1 ? 's' : ''}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {autoFixedIcons.length > 0 && (
                    <div className="mb-1">
                      <p className="font-medium">lucide-react:</p>
                      <p className="text-muted-foreground">{autoFixedIcons.join(', ')}</p>
                    </div>
                  )}
                  {autoFixedFramer.length > 0 && (
                    <div>
                      <p className="font-medium">framer-motion:</p>
                      <p className="text-muted-foreground">{autoFixedFramer.join(', ')}</p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="text-muted-foreground">{language}</span>
        </div>
      </div>
    </div>
  );
};

export { getLanguage };
export default CodeEditor;
