import { NavLink } from "react-router-dom";
import { useSiteStore } from "@/stores/useSiteStore";

const navItems = [
  {
    to: "/sites",
    label: "Sites",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Paramètres",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const sites = useSiteStore((s) => s.sites);
  const running = sites.filter((s) => s.status === "running").length;

  return (
    <aside className="flex flex-col w-60 bg-surface-950 border-r border-surface-800 h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-surface-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">PrestaLaunch</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {running} actif{running !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                isActive
                  ? "bg-brand-500/10 text-brand-400"
                  : "text-slate-400 hover:text-white hover:bg-surface-800"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-surface-800">
        <p className="text-xs text-slate-600 px-3">v0.1.0</p>
      </div>
    </aside>
  );
}
