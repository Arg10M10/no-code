import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  Compass, 
  LayoutGrid, 
  Star, 
  Users, 
  PanelLeft, 
  ChevronDown, 
  Settings,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SettingsModal from "./SettingsModal";

const AppSidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search", disabled: true },
    { icon: Compass, label: "Resources", path: "/resources", disabled: true },
  ];

  const projectItems = [
    { icon: LayoutGrid, label: "All projects", path: "/projects" },
    { icon: Star, label: "Starred", path: "/starred" },
    { icon: Users, label: "Shared with me", path: "/shared" },
  ];

  return (
    <div className="w-[260px] h-screen flex flex-col bg-[#09090b] border-r border-white/5 text-sm flex-shrink-0">
      {/* Header Area */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="h-3 w-3 bg-white rounded-full opacity-50" />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* User/Workspace Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
              <Avatar className="h-8 w-8 rounded-lg border border-white/10">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>DM</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate group-hover:text-white transition-colors">Damian</div>
                <div className="text-xs text-muted-foreground truncate">Pro Plan</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Settings</span>
                  <SettingsModal />
               </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-6">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <Link key={item.path} to={item.disabled ? "#" : item.path}>
              <button
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Projects Section */}
        <div className="space-y-0.5">
          <div className="px-3 py-2 flex items-center justify-between group">
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Projects</span>
            <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {projectItems.map((item) => (
            <Link key={item.path} to={item.path === "/projects" ? "/" : "#"}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  // Highlight "All projects" if at root and explicitly not handled by navItems, or just keep it simple
                  location.pathname === '/' && item.path === '/projects' ? "" : // Home is highlighted for root usually
                  "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer / Status */}
      <div className="p-4 border-t border-white/5">
         <div className="rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/5 p-3">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-white">System Operational</span>
            </div>
            <p className="text-[10px] text-muted-foreground">v2.4.0 (Desktop)</p>
         </div>
      </div>
    </div>
  );
};

export default AppSidebar;