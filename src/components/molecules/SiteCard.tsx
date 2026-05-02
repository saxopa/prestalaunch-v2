import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { StatusDot } from "@/components/atoms/StatusDot";
import { Button } from "@/components/atoms/Button";
import type { Site } from "@/types/site";

const STATUS_LABEL: Record<Site["status"], string> = {
  running: "Actif",
  stopped: "Arrêté",
  starting: "Démarrage…",
  error: "Erreur",
};

interface Props {
  site: Site;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export function SiteCard({ site, onStart, onStop, onDelete, loading }: Props) {
  const isRunning = site.status === "running";
  const isStarting = site.status === "starting";
  const canToggle = !loading && site.status !== "starting";

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col gap-3 hover:border-surface-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <StatusDot status={site.status} />
            <span className="text-sm font-semibold text-white truncate">{site.name}</span>
          </div>
          {isRunning ? (
            <button
              onClick={() => openUrl(`http://${site.domain}:${site.port}`)}
              className="text-xs text-brand-400 hover:text-brand-300 truncate transition-colors"
            >
              {site.domain}:{site.port}
            </button>
          ) : (
            <p className="text-xs text-slate-500 truncate">{site.domain}</p>
          )}
        </div>
        <span className={`text-xs font-medium flex-shrink-0 ${
          isRunning ? "text-success" : isStarting ? "text-warning" : "text-slate-500"
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-surface-800">
        {isRunning ? (
          <Button size="sm" variant="secondary" disabled={!canToggle} loading={loading} onClick={onStop}
            className="flex-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            Arrêter
          </Button>
        ) : (
          <Button size="sm" variant="primary" disabled={!canToggle} loading={loading || isStarting} onClick={onStart}
            className="flex-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Démarrer
          </Button>
        )}

        {isRunning && (
          <>
            <Button size="icon" variant="ghost" title="Ouvrir dans le navigateur"
              onClick={() => openUrl(`http://${site.domain}:${site.port}`)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </Button>
            <Button size="icon" variant="ghost" title="PhpMyAdmin"
              onClick={() => openUrl(`http://${site.domain}:${site.pma_port}`)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </Button>
          </>
        )}

        <div className="flex items-center gap-1 ml-auto">
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
