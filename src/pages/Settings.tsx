import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";

type CaStatus = "checking" | "installed" | "not_installed" | "installing" | "error";

export function SettingsPage() {
  const [dataDir, setDataDir] = useState<string>("");
  const [caStatus, setCaStatus] = useState<CaStatus>("checking");
  const [caError, setCaError] = useState<string>("");

  useEffect(() => {
    invoke<string>("get_data_dir").catch(() => setDataDir("—"));
    invoke<boolean>("check_ssl_ca")
      .then((ok) => setCaStatus(ok ? "installed" : "not_installed"))
      .catch(() => setCaStatus("not_installed"));
  }, []);

  const handleInstallCa = async () => {
    setCaStatus("installing");
    setCaError("");
    try {
      await invoke("install_ssl_ca");
      setCaStatus("installed");
    } catch (e: any) {
      setCaStatus("error");
      setCaError(String(e));
    }
  };

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
          {caStatus === "checking" && (
            <p className="text-xs text-slate-500">Vérification…</p>
          )}
          {caStatus === "installed" && (
            <div className="flex items-center gap-2 text-xs text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Certificat installé — HTTPS disponible sur tous les sites
            </div>
          )}
          {(caStatus === "not_installed" || caStatus === "error") && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Le certificat de sécurité local n'est pas encore installé. Votre mot de passe administrateur sera demandé une seule fois.
              </p>
              {caStatus === "error" && caError && (
                <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded px-3 py-2">{caError}</p>
              )}
              <button
                onClick={handleInstallCa}
                className="flex items-center gap-2 text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Installer le certificat SSL
              </button>
            </div>
          )}
          {caStatus === "installing" && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Installation en cours… Validez la fenêtre de votre système si elle apparaît.
            </div>
          )}
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

        <section className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">À propos</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">PrestaLaunch</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Créé par{" "}
                <button
                  onClick={() => openUrl("https://ponticom.fr")}
                  className="text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Alexis Pontikis — Ponti'Com
                </button>
              </p>
              <p className="text-xs text-slate-600 mt-1">Agence web • Guyane &amp; Métropole</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => openUrl("https://github.com/alexispontikis/prestalaunch")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub (open source)
            </button>
            <button
              onClick={() => openUrl("https://ponticom.fr")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              ponticom.fr
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
