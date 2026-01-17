import { X, FileCode } from "lucide-react";
import { motion } from "framer-motion";

interface Tab {
  path: string;
  name: string;
  isModified?: boolean;
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTab: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
}

const EditorTabs = ({ tabs, activeTab, onTabSelect, onTabClose }: EditorTabsProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-tab-inactive border-b border-border overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => (
        <motion.div
          key={tab.path}
          className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-border min-w-fit group ${
            activeTab === tab.path
              ? "bg-editor border-t-2 border-t-primary"
              : "bg-tab-inactive hover:bg-secondary/30"
          }`}
          onClick={() => onTabSelect(tab.path)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
        >
          <FileCode className={`w-4 h-4 ${activeTab === tab.path ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm ${activeTab === tab.path ? "text-foreground" : "text-muted-foreground"}`}>
            {tab.name}
          </span>
          {tab.isModified && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.path);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
          >
            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default EditorTabs;
