import React from "react";
import AppSidebar from "./AppSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
            {children}
        </ScrollArea>
      </main>
    </div>
  );
};

export default AppLayout;