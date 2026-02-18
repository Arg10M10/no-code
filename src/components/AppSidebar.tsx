import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  Compass, 
  LayoutGrid, 
  Plus,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SearchModal from "./SearchModal";
import SettingsModal from "./SettingsModal";

const AppSidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const projectItems = [
    { icon: LayoutGrid, label: "All projects", path: "/projects" },
  ];

  return (
    <>
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      
      <div 
        className={cn(
          "h-screen flex flex-col bg-[#09090b] border-r border-white/5 flex-shrink-0 transition-all duration-300 ease-in-out z-20",
          isCollapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Header Area */}
        <div className={cn("flex items-center", isCollapsed ? "flex-col justify-center py-4 gap-4" : "justify-between p-4 pb-2")}>
          <div className="flex items-center gap-3">
            {/* App Logo - Custom Image */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-8 rounded-lg flex-shrink-0 object-contain bg-white/5 p-0.5" 
              />
              {!isCollapsed && <span className="font-bold text-white tracking-tight text-base">Framio</span>}
            </Link>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn("text-muted-foreground hover:text-foreground h-7 w-7", isCollapsed ? "" : "")}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide">
          {/* Main Nav */}
          <div className="px-3 space-y-1">
            <Link to="/" title={isCollapsed ? "Home" : undefined}>
              <button
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center w-full px-2" : "w-full",
                  isActive("/")
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && "Home"}
              </button>
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                isCollapsed ? "justify-center w-full px-2" : "w-full",
                "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
              title={isCollapsed ? "Search" : undefined}
            >
              <Search className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && "Search"}
            </button>

            <Link to="/resources" title={isCollapsed ? "Resources" : undefined}>
              <button
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center w-full px-2" : "w-full",
                  isActive("/resources")
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Compass className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && "Resources"}
              </button>
            </Link>
            
            <SettingsModal 
              trigger={
                <button
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isCollapsed ? "justify-center w-full px-2" : "w-full",
                    "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                  title={isCollapsed ? "Settings" : undefined}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && "Settings"}
                </button>
              }
            />
          </div>

          {/* Projects */}
          <div className="px-3 space-y-1">
             {!isCollapsed ? (
               <div className="px-3 py-2 flex items-center justify-between group">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Projects</span>
                  <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3 w-3" />
                  </Button>
               </div>
             ) : (
               <div className="h-4" /> /* Spacer when collapsed */
             )}
             {projectItems.map((item) => (
               <Link key={item.path} to={item.path} title={isCollapsed ? item.label : undefined}>
                <button
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isCollapsed ? "justify-center w-full px-2" : "w-full",
                    isActive(item.path)
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && item.label}
                </button>
              </Link>
             ))}
          </div>
        </div>

         {/* Footer */}
         {!isCollapsed && (
           <div className="p-4 border-t border-white/5 space-y-4">
              {/* Pro Plan Card */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-semibold text-white">Framio Pro</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    Unlock advanced AI models, unlimited projects and more.
                    </p>
                    <Link to="/pricing">
                    <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 h-8 text-xs font-medium border-0 shadow-none">
                        Upgrade Plan
                    </Button>
                    </Link>
                 </div>
              </div>

              {/* Version Text */}
              <div className="flex justify-center">
                 <p className="text-[10px] text-zinc-600 font-mono">v2.4.0 (Open Source)</p>
              </div>
           </div>
         )}
      </div>
    </>
  );
};

export default AppSidebar;