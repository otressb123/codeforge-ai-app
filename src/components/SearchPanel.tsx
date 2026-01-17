import { Search, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  file: string;
  line: number;
  content: string;
  match: string;
}

interface SearchPanelProps {
  onResultClick?: (file: string, line: number) => void;
}

const SearchPanel = ({ onResultClick }: SearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search results
  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      setResults([
        { file: "src/App.tsx", line: 12, content: "const App = () => {", match: value },
        { file: "src/components/Button.tsx", line: 5, content: `className="${value}"`, match: value },
        { file: "src/utils/helpers.ts", line: 23, content: `export const ${value} = () => {}`, match: value },
      ]);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="h-full bg-sidebar flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search in files..."
            className="w-full bg-input border border-border rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <AnimatePresence>
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result, index) => (
                <motion.div
                  key={`${result.file}-${result.line}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => onResultClick?.(result.file, result.line)}
                >
                  <div className="text-xs text-muted-foreground mb-1">{result.file}</div>
                  <div className="text-sm font-mono text-foreground/80">
                    <span className="text-muted-foreground mr-2">:{result.line}</span>
                    {result.content}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : query.length > 0 && query.length <= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Type at least 3 characters
            </p>
          ) : query.length > 2 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results found
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Search for code across your project
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPanel;
