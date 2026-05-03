import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Button } from "@/components/atoms/Button";
import type { Site } from "@/types/site";

const STATUS_LABEL: Record<Site["status"], string> = {
  running: "Actif",
  stopped: "Arrêté",
  starting: "Démarrage…",
  initializing: "Chargement…",
  error: "Erreur",
};

interface Props {
  site: Site;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onLogs: () => void;
  onEnableSsl: () => void;
  onDisableSsl: () => void;
  onEnableMail: () => void;
  onDisableMail: () => void;
  loading?: boolean;
}

export function SiteCard({ site, onStart, onStop, onDelete, onLogs, onEnableSsl, onDisableSsl, loading }: Props) {
  const navigate = useNavigate();
  const isRunning = site.status === "running";
  const isStarting = site.status === "starting";
  const isInitializing = site.status === "initializing";
  const canToggle = !loading && site.status !== "starting" && site.status !== "initializing";
  const sslActive = site.ssl_port !== null;
  const httpsUrl = sslActive ? `https://${site.domain}:${site.ssl_port}` : null;
  const httpUrl = `http://${site.domain}:${site.port}`;

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col gap-3 hover:border-surface-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/sites/${site.id}`)}>
          <div className="flex items-center gap-2 mb-0.5">
            <StatusDot status={site.status} />
            <span className="text-sm font-semibold text-white truncate hover:text-brand-400 transition-colors">{site.name}</span>
          </div>
          {isRunning ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {httpsUrl && (
                <button
                  onClick={() => openUrl(httpsUrl)}
                  className="text-xs text-green-400 hover:text-green-300 truncate transition-colors flex items-center gap-1"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {site.domain}:{site.ssl_port}
                </button>
              )}
              <button
                onClick={() => openUrl(httpUrl)}
                className={`text-xs truncate transition-colors ${httpsUrl ? "text-slate-500 hover:text-slate-400" : "text-brand-400 hover:text-brand-300"}`}
              >
                {httpsUrl ? `http :${site.port}` : `${site.domain}:${site.port}`}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 truncate">{site.domain}</p>
          )}
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${
          isRunning ? "text-success" : (isStarting || isInitializing) ? "text-warning" : "text-slate-500"
        }`}>
          {STATUS_LABEL[site.status]}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs bg-surface-800 text-slate-400 rounded px-1.5 py-0.5">
          PS {site.ps_version}
        </span>
        <span className="text-xs bg-surface-800 text-slate-400 rounded px-1.5 py-0.5">
          PHP {site.php_version}
        </span>
        <span className="text-xs bg-surface-800 text-slate-400 rounded px-1.5 py-0.5">
          MySQL {site.mysql_version}
        </span>
        {sslActive && (
          <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded px-1.5 py-0.5">
            HTTPS
          </span>
        )}
      </div>

      {/* Message initializing */}
      {isInitializing && (
        <p className="text-xs text-warning/80 bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
          Le site peut prendre 3 à 5 minutes à démarrer lors du premier lancement…
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-surface-800">
        {/* Start / Stop */}
        {isRunning ? (
          <Button size="sm" variant="secondary" disabled={!canToggle} loading={loading} onClick={onStop}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            Arrêter
          </Button>
        ) : (
          <Button size="sm" variant="primary" disabled={!canToggle} loading={loading || isStarting || isInitializing} onClick={onStart}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            {isInitializing ? "Chargement…" : "Démarrer"}
          </Button>
        )}

        {/* Icônes site (running uniquement) */}
        {isRunning && (
          <>
            <Button size="icon" variant="ghost"
              title={sslActive ? "Désactiver HTTPS" : "Activer HTTPS"}
              onClick={sslActive ? onDisableSsl : onEnableSsl}
              className={sslActive ? "text-green-400 hover:text-green-300" : ""}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {sslActive
                  ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                  : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>
                }
              </svg>
            </Button>
            <Button size="icon" variant="ghost" title="PhpMyAdmin"
              onClick={() => openUrl(`http://${site.domain}:${site.pma_port}`)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </Button>
            <Button size="icon" variant="ghost" title="Logs" onClick={onLogs}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </Button>
            {site.mail_port && (
              <Button size="icon" variant="ghost" title="Mailcatcher (Mailpit)"
                onClick={() => openUrl(`http://${site.domain}:${site.mail_port}`)}
                className="text-blue-400 hover:text-blue-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </Button>
            )}
          </>
        )}

        {/* Séparateur + outils fichiers */}
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" title="Ouvrir dans Finder"
            onClick={() => invoke("open_site_folder", { siteId: site.id, app: "finder" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </Button>
          <Button size="icon" variant="ghost" title="Ouvrir dans VS Code"
            onClick={() => invoke("open_site_folder", { siteId: site.id, app: "vscode" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </Button>
          <Button size="icon" variant="ghost" title="Ouvrir dans Terminal"
            onClick={() => invoke("open_site_folder", { siteId: site.id, app: "terminal" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </Button>
          <div className="w-px h-4 bg-surface-700 mx-0.5" />
          <Button size="icon" variant="ghost" title="Supprimer" onClick={onDelete}
            className="text-danger/70 hover:text-danger hover:bg-danger/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
