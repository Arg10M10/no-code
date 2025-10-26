"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import RecentProjectsSheet from "./RecentProjectsSheet";

const Navigation: React.FC = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Bot className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">Dyad</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8">
            <Button variant="ghost" onClick={() => setIsSheetOpen(true)}>
              Proyectos
            </Button>
            <RecentProjectsSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} />
            <Link to="/pricing">
              <Button variant="ghost">Precios</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;