import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export function SettingsPage() {
  const [dataDir, setDataDir] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_data_dir").catch(() => setDataDir("—"));
  }, []);

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-lg font-semibold text-white mb-6">Paramètres</h1>

      <div className="space-y-4">
        <section className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Application</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Version</p>
                <p className="text-xs text-slate-500">PrestaLaunch</p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-surface-800 px-2 py-1 rounded">v0.1.0</span>
            </div>
          </div>
        </section>

        <section className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Dossier données</h2>
          <p className="text-xs text-slate-500 mb-3">
            Fichiers Docker Compose et données des sites
          </p>
          <div className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 flex-shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs font-mono text-slate-400 truncate flex-1">
              {dataDir || "~/Library/Application Support/com.prestalaunch.app"}
            </span>
          </div>
        </section>

        <section className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">SSL local (mkcert)</h2>
          <p className="text-xs text-slate-500 mb-3">
            Requis pour activer HTTPS sur les sites locaux
          </p>
          <div className="bg-surface-800 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-slate-300 font-medium">Installation (une seule fois)</p>
            <code className="block text-xs font-mono text-brand-400 bg-black/40 rounded px-2.5 py-1.5">
              brew install mkcert && mkcert -install
            </code>
          </div>
        </section>

        <section className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Credentials par défaut</h2>
          <p className="text-xs text-slate-500 mb-3">Appliqués à tous les nouveaux sites</p>
          <div className="space-y-1">
            {[
              ["Admin PS", "admin@admin.com / Prestashop1!"],
              ["MySQL root", "prestashop"],
              ["MySQL user", "prestashop / prestashop"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 w-24">{k}</span>
                <span className="font-mono text-slate-300">{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
