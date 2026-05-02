import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/organisms/Sidebar";

export function AppShell() {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface-950">
        <Outlet />
      </main>
    </div>
  );
}
