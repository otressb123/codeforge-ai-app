import { Files, Bot, Play, Terminal, Settings, Search } from "lucide-react";
import { motion } from "framer-motion";

type SidebarTab = "files" | "search" | "ai" | "terminal" | "settings";

interface ActivityBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const ActivityBar = ({ activeTab, onTabChange }: ActivityBarProps) => {
  const tabs = [
    { id: "files" as SidebarTab, icon: Files, label: "Explorer" },
    { id: "search" as SidebarTab, icon: Search, label: "Search" },
    { id: "ai" as SidebarTab, icon: Bot, label: "AI Assistant" },
    { id: "terminal" as SidebarTab, icon: Terminal, label: "Terminal" },
    { id: "settings" as SidebarTab, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-12 bg-sidebar border-r border-border flex flex-col items-center py-2 gap-1">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group ${
            activeTab === tab.id
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {activeTab === tab.id && (
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r"
              layoutId="activeTab"
            />
          )}
          <tab.icon className="w-5 h-5" />
          
          {/* Tooltip */}
          <div className="absolute left-12 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {tab.label}
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default ActivityBar;
