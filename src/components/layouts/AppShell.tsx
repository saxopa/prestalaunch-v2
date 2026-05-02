import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/organisms/Sidebar";
import { AppBootstrap } from "./AppBootstrap";

export function AppShell() {
  return (
    <AppBootstrap>
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface-950">
          <Outlet />
        </main>
      </div>
    </AppBootstrap>
  );
}
