import React from "react";
import { useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import CustomTitleBar from "./CustomTitleBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isEditor = location.pathname.startsWith("/editor");
  const isPreview = location.pathname.startsWith("/preview");
  const isElectron = typeof window.electronAPI !== 'undefined';

  if (isPreview) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background"> {/* Added bg-background here */}
        {isElectron && <CustomTitleBar />}
        <div className="flex-1 min-h-0 flex flex-col rounded-xl overflow-hidden">
          {isEditor ? (
            <div className="h-full w-full overflow-hidden">
              {children}
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              {children}
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;