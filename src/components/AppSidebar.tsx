import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  Compass, 
  LayoutGrid, 
  Star, 
  Users, 
  ChevronDown, 
  Plus,
  Layers,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SearchModal from "./SearchModal";

const AppSidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const projectItems = [
    { icon: LayoutGrid, label: "All projects", path: "/projects" },
    { icon: Star, label: "Starred", path: "/starred" },
    { icon: Users, label: "Shared with me", path: "/shared" },
  ];

  return (
    <>
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      
      <div 
        className={cn(
          "h-screen flex flex-col bg-[#09090b] border-r border-white/5 flex-shrink-0 transition-all duration-300 ease-in-out z-20",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Header Area */}
        <div className={cn("flex items-center", isCollapsed ? "flex-col justify-center py-4 gap-4" : "justify-between p-3 pb-2")}>
          <div className="flex items-center gap-2">
            {/* App Logo - Pink/Gradient Theme */}
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                 <Layers className="h-4 w-4 text-white" />
              </div>
              {!isCollapsed && <span className="font-bold text-white tracking-tight text-sm">Framio</span>}
            </Link>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("text-muted-foreground hover:text-foreground h-6 w-6", isCollapsed ? "" : "")}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
          {/* Main Nav */}
          <div className="px-2 space-y-0.5">
            <Link to="/" title={isCollapsed ? "Home" : undefined}>
              <button
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  isCollapsed ? "justify-center w-full" : "w-full",
                  isActive("/")
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && "Home"}
              </button>
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer",
                isCollapsed ? "justify-center w-full" : "w-full",
                "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
              title={isCollapsed ? "Search" : undefined}
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && "Search"}
            </button>

            <Link to="/resources" title={isCollapsed ? "Resources" : undefined}>
              <button
                className={cn(
                  "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  isCollapsed ? "justify-center w-full" : "w-full",
                  isActive("/resources")
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Compass className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && "Resources"}
              </button>
            </Link>
          </div>

          {/* Projects */}
          <div className="px-2 space-y-0.5">
             {!isCollapsed ? (
               <div className="px-2 py-1.5 flex items-center justify-between group">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Projects</span>
                  <Button variant="ghost" size="icon" className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3 w-3" />
                  </Button>
               </div>
             ) : (
               <div className="h-4" /> /* Spacer when collapsed */
             )}
             {projectItems.map((item) => (
               <Link key={item.path} to={item.path === "/projects" ? "/" : "#"} title={isCollapsed ? item.label : undefined}>
                <button
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                    isCollapsed ? "justify-center w-full" : "w-full",
                    // Highlight logic...
                    location.pathname === '/' && item.path === '/projects' ? "" : // Custom
                    "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && item.label}
                </button>
              </Link>
             ))}
          </div>
        </div>

         {/* Footer */}
         {!isCollapsed && (
           <div className="p-3 border-t border-white/5">
              <div className="rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-800/50 border border-white/5 p-2">
                 <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-medium text-zinc-300">Operational</span>
                 </div>
                 <p className="text-[9px] text-zinc-500 mt-0.5">v2.4.0 (Open Source)</p>
              </div>
           </div>
         )}
      </div>
    </>
  );
};

export default AppSidebar;