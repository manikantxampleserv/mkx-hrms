import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "shared/Sidebar";
import { Header } from "shared/Header";
import { cn } from "utils";

export function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-out",
          isSidebarCollapsed ? "ml-[72px]" : "ml-[260px]",
        )}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
