import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  Compass, 
  LayoutGrid, 
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Settings,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
              {/* Pro Plan Card - BLUE THEME */}
              <div className="rounded-xl bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-indigo-600/20 border border-blue-500/20 p-4 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-blue-400/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-semibold text-white">Framio Pro</span>
                    </div>
                    <p className="text-xs text-blue-200/70 mb-3 leading-relaxed">
                    Unlock advanced AI models, unlimited projects and more.
                    </p>
                    <Link to="/pricing">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white h-8 text-xs font-medium border-0 shadow-sm transition-colors">
                        Upgrade Plan
                    </Button>
                    </Link>
                 </div>
              </div>

              {/* Version & Inbox */}
              <div className="flex items-center justify-between px-1">
                 <p className="text-sm font-medium text-zinc-400">v2.4.0 (Beta)</p>
                 
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 relative">
                            <Inbox className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="end" className="w-[380px] p-0 border-white/10 bg-[#09090b] text-white shadow-2xl overflow-hidden mr-4">
                        <Tabs defaultValue="whats_new" className="w-full">
                            <div className="p-2 bg-black/40 border-b border-white/5">
                                <TabsList className="w-full bg-white/5 p-1 h-9">
                                    <TabsTrigger value="inbox" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">Inbox</TabsTrigger>
                                    <TabsTrigger value="whats_new" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">What's new</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <TabsContent value="inbox" className="m-0 h-[400px] flex items-center justify-center text-zinc-500 text-xs flex-col gap-2">
                                <Inbox className="h-8 w-8 opacity-20" />
                                <span>No new notifications</span>
                            </TabsContent>
                            
                            <TabsContent value="whats_new" className="m-0 h-[400px] flex items-center justify-center text-zinc-500 text-xs flex-col gap-2">
                                <Sparkles className="h-8 w-8 opacity-20" />
                                <span>All caught up! No new updates.</span>
                            </TabsContent>
                        </Tabs>
                    </PopoverContent>
                 </Popover>
              </div>
           </div>
         )}
      </div>
    </>
  );
};

export default AppSidebar;