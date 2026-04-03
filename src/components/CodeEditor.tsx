import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import { Loader2, AlertCircle, AlertTriangle, Info, Wand2, Sparkles, Palette, ChevronDown } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { detectMissingLucideImports, detectMissingFramerMotionImports } from "@/lib/autoFixImports";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MONACO_THEMES, DEFAULT_THEME_ID, type MonacoThemeDefinition } from "@/lib/monacoThemes";

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string | undefined) => void;
  onInlineEdit?: (selectedCode: string, instruction: string, fullContent: string) => Promise<string | null>;
  projectFiles?: { path: string; content: string }[];
  autocompleteEnabled?: boolean;
  onAutocompleteToggle?: () => void;
  editorTheme?: string;
  onThemeChange?: (themeId: string) => void;
}

interface DiagnosticCounts {
  errors: number;
  warnings: number;
  info: number;
}

const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': return 'typescriptreact';
    case 'ts': return 'typescript';
    case 'jsx': return 'javascriptreact';
    case 'js': return 'javascript';
    case 'json': return 'json';
    case 'css': return 'css';
    case 'html': return 'html';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const CodeEditor = ({ content, language, onChange, onInlineEdit, projectFiles, autocompleteEnabled = true, onAutocompleteToggle, editorTheme = DEFAULT_THEME_ID, onThemeChange }: CodeEditorProps) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCounts>({ errors: 0, warnings: 0, info: 0 });
  const [autoFixedIcons, setAutoFixedIcons] = useState<string[]>([]);
  const [autoFixedFramer, setAutoFixedFramer] = useState<string[]>([]);
  const [inlineEditVisible, setInlineEditVisible] = useState(false);
  const [inlineEditInstruction, setInlineEditInstruction] = useState("");
  const [inlineEditLoading, setInlineEditLoading] = useState(false);
  const [inlineEditPosition, setInlineEditPosition] = useState({ top: 0, left: 0 });
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any>(null);
  const inlineWidgetRef = useRef<any>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const themePickerRef = useRef<HTMLDivElement>(null);

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

  // ── Inline Edit (Cmd+K) ──
  const showInlineEdit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) {
      // Use current line if no selection
      const pos = editor.getPosition();
      if (pos) {
        editor.setSelection({
          startLineNumber: pos.lineNumber,
          startColumn: 1,
          endLineNumber: pos.lineNumber,
          endColumn: editor.getModel()?.getLineLength(pos.lineNumber) + 1 || 1,
        });
      }
    }

    // Get position for the inline widget
    const sel = editor.getSelection();
    if (!sel) return;

    const coords = editor.getScrolledVisiblePosition({ lineNumber: sel.endLineNumber, column: 1 });
    if (coords) {
      setInlineEditPosition({ top: coords.top + coords.height + 4, left: coords.left + 60 });
    }
    
    setInlineEditVisible(true);
    setInlineEditInstruction("");
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  }, []);

  const handleInlineEditSubmit = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || !inlineEditInstruction.trim()) return;
    
    const selection = editor.getSelection();
    if (!selection) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    const selectedText = model.getValueInRange(selection);
    const fullContent = model.getValue();
    
    setInlineEditLoading(true);
    
    try {
      if (onInlineEdit) {
        const result = await onInlineEdit(selectedText, inlineEditInstruction, fullContent);
        if (result) {
          editor.executeEdits("inline-edit", [{
            range: selection,
            text: result,
          }]);
        }
      } else {
        // Built-in inline edit via edge function
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { role: "user", content: `Edit this code according to the instruction. Return ONLY the modified code, no explanations, no markdown fences.\n\nInstruction: ${inlineEditInstruction}\n\nCode:\n${selectedText}` }
            ],
            model: "google/gemini-3-flash-preview",
          }),
        });

        if (!response.ok || !response.body) throw new Error("Failed");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, idx);
            textBuffer = textBuffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) result += c;
            } catch {}
          }
        }

        // Strip markdown fences if the model wrapped them
        let cleaned = result.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
        }

        if (cleaned) {
          editor.executeEdits("inline-edit", [{
            range: selection,
            text: cleaned,
          }]);
        }
      }
    } catch (err) {
      console.error("Inline edit error:", err);
    } finally {
      setInlineEditLoading(false);
      setInlineEditVisible(false);
    }
  }, [inlineEditInstruction, onInlineEdit]);

  const cancelInlineEdit = useCallback(() => {
    setInlineEditVisible(false);
    setInlineEditInstruction("");
    editorRef.current?.focus();
  }, []);

  // ── AI Autocomplete ──
  const registerAutocomplete = useCallback((editor: any, monaco: any) => {
    monaco.languages.registerInlineCompletionsProvider(
      ["typescript", "typescriptreact", "javascript", "javascriptreact", "css", "html"],
      {
        provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
          // Debounce - only trigger after user pauses typing
          if (autocompleteTimerRef.current) {
            clearTimeout(autocompleteTimerRef.current);
          }

          return new Promise((resolve) => {
            if (!autocompleteEnabled) {
              resolve({ items: [] });
              return;
            }
            autocompleteTimerRef.current = setTimeout(async () => {
              try {
                // Get surrounding code context
                const textBefore = model.getValueInRange({
                  startLineNumber: Math.max(1, position.lineNumber - 20),
                  startColumn: 1,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                });
                const textAfter = model.getValueInRange({
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 5),
                  endColumn: model.getLineLength(Math.min(model.getLineCount(), position.lineNumber + 5)) + 1,
                });

                // Don't trigger on very short context or empty lines
                const currentLine = model.getLineContent(position.lineNumber).trim();
                if (currentLine.length < 3 && position.lineNumber > 1) {
                  resolve({ items: [] });
                  return;
                }

                if (token.isCancellationRequested) {
                  resolve({ items: [] });
                  return;
                }

                const response = await fetch(CHAT_URL, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                  },
                  body: JSON.stringify({
                    messages: [
                      {
                        role: "user",
                        content: `Complete this code. Return ONLY the completion text (the code that comes next), nothing else. No explanations, no markdown. Just the raw code continuation.\n\nCode before cursor:\n${textBefore}\n\nCode after cursor:\n${textAfter}`,
                      },
                    ],
                    model: "google/gemini-2.5-flash-lite",
                  }),
                });

                if (!response.ok || !response.body) {
                  resolve({ items: [] });
                  return;
                }

                // Read non-streaming or streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let completion = "";
                let buf = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buf += decoder.decode(value, { stream: true });
                  let idx: number;
                  while ((idx = buf.indexOf("\n")) !== -1) {
                    let line = buf.slice(0, idx);
                    buf = buf.slice(idx + 1);
                    if (line.endsWith("\r")) line = line.slice(0, -1);
                    if (!line.startsWith("data: ")) continue;
                    const j = line.slice(6).trim();
                    if (j === "[DONE]") break;
                    try {
                      const p = JSON.parse(j);
                      const c = p.choices?.[0]?.delta?.content;
                      if (c) completion += c;
                    } catch {}
                  }
                }

                let cleaned = completion.trim();
                // Strip markdown fences
                if (cleaned.startsWith("```")) {
                  cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
                }

                if (cleaned && cleaned.length > 2 && cleaned.length < 500) {
                  resolve({
                    items: [{
                      insertText: cleaned,
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
                    }],
                  });
                } else {
                  resolve({ items: [] });
                }
              } catch {
                resolve({ items: [] });
              }
            }, 1500); // 1.5s debounce
          });
        },
        freeInlineCompletions: () => {},
      }
    );
  }, []);

  const handleBeforeMount: BeforeMount = (monaco) => {
    // Register all custom themes
    MONACO_THEMES.forEach((theme) => {
      monaco.editor.defineTheme(theme.id, {
        base: theme.base,
        inherit: true,
        rules: theme.rules,
        colors: theme.colors,
      });
    });
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

    // Add React types definition
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

    // ── Register Cmd+K for inline edit ──
    editor.addAction({
      id: "inline-edit",
      label: "AI: Edit Selection (Cmd+K)",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => showInlineEdit(),
    });

    // ── Register AI autocomplete ──
    registerAutocomplete(editor, monaco);

    // Listen for model markers (diagnostics) changes
    const updateDiagnostics = () => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const counts = { errors: 0, warnings: 0, info: 0 };
        
        markers.forEach((marker: any) => {
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

    setTimeout(updateDiagnostics, 500);

    const disposable = monaco.editor.onDidChangeMarkers(() => {
      updateDiagnostics();
    });

    let timeout: ReturnType<typeof setTimeout>;
    const contentDisposable = editor.onDidChangeModelContent(() => {
      clearTimeout(timeout);
      timeout = setTimeout(updateDiagnostics, 300);
    });

    return () => {
      disposable.dispose();
      contentDisposable.dispose();
      clearTimeout(timeout);
    };
  }, [showInlineEdit, registerAutocomplete]);

  const totalAutoFixes = autoFixedIcons.length + autoFixedFramer.length;
  const totalIssues = diagnostics.errors + diagnostics.warnings + diagnostics.info;

  return (
    <div ref={containerRef} className="h-full w-full bg-editor flex flex-col relative">
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={onChange}
          theme={editorTheme}
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
            minimap: { enabled: true, scale: 1, showSlider: "always" },
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
            inlineSuggest: { enabled: true },
            folding: true,
            foldingStrategy: "indentation",
            showFoldingControls: "always",
            matchBrackets: "always",
            guides: { bracketPairs: true, indentation: true },
            multiCursorModifier: "alt",
            find: { addExtraSpaceOnTop: true, autoFindInSelection: "multiline", seedSearchStringFromSelection: "selection" },
            linkedEditing: true,
            renderWhitespace: "selection",
            columnSelection: true,
            dragAndDrop: true,
            snippetSuggestions: "inline",
            tabCompletion: "on",
            stickyScroll: { enabled: true },
          }}
        />
      </div>

      {/* Inline Edit Widget (Cmd+K) */}
      {inlineEditVisible && (
        <div 
          className="absolute z-50 bg-popover border border-border rounded-lg shadow-2xl p-3 w-[400px]"
          style={{ top: Math.min(inlineEditPosition.top, (containerRef.current?.offsetHeight || 400) - 120), left: Math.max(inlineEditPosition.left, 60) }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">AI Edit (Cmd+K)</span>
            {inlineEditLoading && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
          </div>
          <input
            ref={inlineInputRef}
            type="text"
            value={inlineEditInstruction}
            onChange={(e) => setInlineEditInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleInlineEditSubmit();
              }
              if (e.key === "Escape") cancelInlineEdit();
            }}
            placeholder="Describe the edit... (Enter to apply, Esc to cancel)"
            className="w-full bg-background text-foreground text-sm px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={inlineEditLoading}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Select code → Cmd+K → describe change</span>
            <div className="flex gap-2">
              <button onClick={cancelInlineEdit} className="px-2 py-1 rounded hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleInlineEditSubmit} className="px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" disabled={inlineEditLoading}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
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
          {/* AI Copilot Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAutocompleteToggle}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                    autocompleteEnabled
                      ? "text-primary bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-medium">Copilot</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>AI Autocomplete: <strong>{autocompleteEnabled ? "ON" : "OFF"}</strong> — Click to toggle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-primary/70 cursor-help flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  Cmd+K
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Select code and press <strong>Cmd+K</strong> for AI inline editing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-muted-foreground">{language}</span>
        </div>
      </div>
    </div>
  );
};

export { getLanguage };
export default CodeEditor;