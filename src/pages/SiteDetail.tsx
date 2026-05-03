import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { StatusDot } from "@/components/atoms/StatusDot";
import { useSites } from "@/hooks/useSites";
import { useCallback } from "react";
import { useSiteStore } from "@/stores/useSiteStore";
import type { Site } from "@/types/site";

type Tab = "overview" | "credentials" | "logs" | "modules" | "config";

interface PsModule {
  name: string;
  active: boolean;
  version: string;
}

// ── helpers ──────────────────────���──────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-surface-800 last:border-0">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-200 font-mono flex-1 truncate">{value}</span>
      <button
        onClick={copy}
        className="text-xs text-slate-500 hover:text-brand-400 transition-colors flex-shrink-0"
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}

function logLineColor(line: string) {
  if (/error|ERR!|fatal|FATAL/i.test(line)) return "text-red-400";
  if (/warn|WARN/i.test(line)) return "text-yellow-400";
  if (/success|ready|started|running/i.test(line)) return "text-green-400";
  return "text-slate-400";
}

// ── tabs ────────────────────────────────────────────────────────���────────────

function TabOverview({ site, onEnableSsl, onDisableSsl, onEnableMail, onDisableMail, loading }: {
  site: Site;
  onEnableSsl: () => void;
  onDisableSsl: () => void;
  onEnableMail: () => void;
  onDisableMail: () => void;
  loading: boolean;
}) {
  const isRunning = site.status === "running";
  const sslActive = site.ssl_port !== null;
  const mailActive = site.mail_port !== null;
  const httpsUrl = sslActive ? `https://${site.domain}:${site.ssl_port}` : null;
  const httpUrl = `http://${site.domain}:${site.port}`;

  return (
    <div className="space-y-6">
      {/* URLs */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Accès</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <UrlCard
            label="Front-office"
            url={httpsUrl ?? httpUrl}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>}
            disabled={!isRunning}
          />
          <UrlCard
            label="Back-office"
            url={`${httpsUrl ?? httpUrl}/admin`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            disabled={!isRunning}
          />
          <UrlCard
            label="phpMyAdmin"
            url={`http://${site.domain}:${site.pma_port}`}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>}
            disabled={!isRunning}
          />
          {mailActive && (
            <UrlCard
              label="Mailcatcher"
              url={`http://${site.domain}:${site.mail_port}`}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
              disabled={!isRunning}
            />
          )}
        </div>
      </div>

      {/* Open in */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Ouvrir dans</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => invoke("open_site_folder", { siteId: site.id, app: "finder" })}
            className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-lg text-xs text-slate-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            Finder
          </button>
          <button onClick={() => invoke("open_site_folder", { siteId: site.id, app: "vscode" })}
            className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-lg text-xs text-slate-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            VS Code
          </button>
          <button onClick={() => invoke("open_site_folder", { siteId: site.id, app: "terminal" })}
            className="flex items-center gap-2 px-3 py-2 bg-surface-800 hover:bg-surface-700 border border-surface-700 rounded-lg text-xs text-slate-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
            Terminal
          </button>
        </div>
      </div>

      {/* SSL */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">HTTPS local</h3>
        <div className="flex items-center justify-between bg-surface-800 border border-surface-700 rounded-xl p-4">
          <div>
            <p className="text-sm font-medium text-white">SSL via mkcert</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {sslActive
                ? `Actif — https://${site.domain}:${site.ssl_port}`
                : "Inactif — nécessite mkcert -install"}
            </p>
          </div>
          <Button size="sm" variant={sslActive ? "secondary" : "primary"}
            loading={loading} disabled={!isRunning || loading}
            onClick={sslActive ? onDisableSsl : onEnableSsl}>
            {sslActive ? "Désactiver" : "Activer"}
          </Button>
        </div>
      </div>

      {/* Mailcatcher */}
      <div>
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Mailcatcher</h3>
        <div className="flex items-center justify-between bg-surface-800 border border-surface-700 rounded-xl p-4">
          <div>
            <p className="text-sm font-medium text-white">Mailpit — intercepter les emails</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {mailActive
                ? `Actif — http://${site.domain}:${site.mail_port} — PS SMTP configuré automatiquement`
                : "Inactif — les emails passent par PHP mail()"}
            </p>
          </div>
          <Button size="sm" variant={mailActive ? "secondary" : "primary"}
            loading={loading} disabled={!isRunning || loading}
            onClick={mailActive ? onDisableMail : onEnableMail}>
            {mailActive ? "Désactiver" : "Activer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UrlCard({ label, url, icon, disabled }: { label: string; url: string; icon: React.ReactNode; disabled: boolean }) {
  return (
    <button
      onClick={() => !disabled && openUrl(url)}
      disabled={disabled}
      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
        disabled
          ? "bg-surface-800/50 border-surface-800 text-slate-600 cursor-not-allowed"
          : "bg-surface-800 border-surface-700 text-slate-300 hover:border-brand-500/50 hover:text-white"
      }`}
    >
      <span className={disabled ? "text-slate-600" : "text-brand-400"}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xs text-slate-500 truncate">{disabled ? "Site arrêté" : url.replace(/^https?:\/\//, "")}</p>
      </div>
    </button>
  );
}

function TabCredentials({ site }: { site: Site }) {
  const httpsUrl = site.ssl_port ? `https://${site.domain}:${site.ssl_port}` : null;
  const adminUrl = `${httpsUrl ?? `http://${site.domain}:${site.port}`}/admin`;

  return (
    <div className="space-y-5">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Admin PrestaShop
        </h3>
        <CopyField label="URL back-office" value={adminUrl} />
        <CopyField label="Email" value="admin@admin.com" />
        <CopyField label="Mot de passe" value="Prestashop1!" />
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
            <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          Base de données MySQL
        </h3>
        <CopyField label="Hôte" value="127.0.0.1" />
        <CopyField label="Port" value={String(site.pma_port)} />
        <CopyField label="Base" value="prestashop" />
        <CopyField label="Utilisateur" value="prestashop" />
        <CopyField label="Mot de passe" value="prestashop" />
        <CopyField label="Root password" value="prestashop" />
      </div>
    </div>
  );
}

function TabLogs({ site }: { site: Site }) {
  const [lines, setLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLines([]);
    let unlisten: (() => void) | null = null;
    const start = async () => {
      unlisten = await listen<string>(`site:log:${site.id}`, (e) => {
        setLines((prev) => {
          const next = [...prev, e.payload];
          return next.length > 500 ? next.slice(-500) : next;
        });
      });
      await invoke("stream_site_logs", { siteId: site.id });
    };
    start();
    return () => { unlisten?.(); invoke("stop_site_logs", { siteId: site.id }); };
  }, [site.id]);

  useEffect(() => {
    if (autoScrollRef.current) bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [lines]);

  return (
    <div
      ref={containerRef}
      onScroll={() => {
        const el = containerRef.current;
        if (el) autoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      }}
      className="bg-black rounded-xl h-[calc(100vh-260px)] overflow-y-auto p-4 font-mono text-xs leading-5"
    >
      {lines.length === 0 && <span className="text-slate-500">En attente des logs…</span>}
      {lines.map((line, i) => (
        <div key={i} className={`whitespace-pre-wrap break-all ${logLineColor(line)}`}>{line}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function TabModules({ site }: { site: Site }) {
  const [modules, setModules] = useState<PsModule[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (site.status !== "running") return;
    setLoading(true);
    invoke<PsModule[]>("get_site_modules", { siteId: site.id })
      .then(setModules)
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [site.id, site.status]);

  if (site.status !== "running") {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <p className="text-sm text-slate-400">Site arrêté</p>
        <p className="text-xs text-slate-600 mt-1">Démarrez le site pour voir les modules installés</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-sm text-slate-400 py-8 text-center">Chargement des modules…</div>;
  }

  if (error) {
    return <div className="text-sm text-red-400 py-8 text-center">Erreur : {error}</div>;
  }

  const filtered = (modules ?? []).filter((m) => {
    if (filter === "active" && !m.active) return false;
    if (filter === "inactive" && m.active) return false;
    return m.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = (modules ?? []).filter((m) => m.active).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un module…"
          className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <div className="flex items-center gap-1 bg-surface-800 border border-surface-700 rounded-lg p-1">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filter === f ? "bg-brand-500/20 text-brand-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "all" ? `Tous (${modules?.length ?? 0})` : f === "active" ? `Actifs (${activeCount})` : `Inactifs (${(modules?.length ?? 0) - activeCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px] text-xs font-medium text-slate-500 px-4 py-2.5 border-b border-surface-700">
          <span>Module</span><span>Version</span><span>Statut</span>
        </div>
        <div className="divide-y divide-surface-700 max-h-[calc(100vh-360px)] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-500">Aucun module trouvé</div>
          )}
          {filtered.map((m) => (
            <div key={m.name} className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-2.5 hover:bg-surface-700/50 transition-colors">
              <span className="text-xs text-slate-200 font-mono truncate">{m.name}</span>
              <span className="text-xs text-slate-500">{m.version}</span>
              <span className={`text-xs font-medium ${m.active ? "text-green-400" : "text-slate-600"}`}>
                {m.active ? "Actif" : "Inactif"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabConfig({ site }: { site: Site }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Versions</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "PrestaShop", value: site.ps_version },
            { label: "PHP", value: site.php_version },
            { label: "MySQL", value: site.mysql_version },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ports</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "HTTP", value: String(site.port) },
            { label: "phpMyAdmin", value: String(site.pma_port) },
            { label: "HTTPS (SSL)", value: site.ssl_port ? String(site.ssl_port) : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-900 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────��────

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Vue d'ensemble" },
  { id: "credentials", label: "Identifiants" },
  { id: "logs",        label: "Logs" },
  { id: "modules",     label: "Modules" },
  { id: "config",      label: "Configuration" },
];

const STATUS_LABEL: Record<Site["status"], string> = {
  running: "Actif", stopped: "Arrêté", starting: "Démarrage…", initializing: "Chargement…", error: "Erreur",
};

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const site = useSiteStore((s) => s.sites.find((x) => x.id === siteId));
  const { startSite, stopSite, enableSsl, disableSsl, enableMailcatcher, disableMailcatcher } = useSites();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!site) navigate("/sites", { replace: true }); }, [site]);
  if (!site) return null;

  const isRunning = site.status === "running";
  const isStarting = site.status === "starting";

  const handleStart = async () => {
    setLoading(true);
    try { await startSite(site.id); } finally { setLoading(false); }
  };
  const handleStop = async () => {
    setLoading(true);
    try { await stopSite(site.id); } finally { setLoading(false); }
  };
  const handleEnableSsl = async () => {
    setLoading(true);
    try { await enableSsl(site.id); }
    catch (e: any) { alert(e?.message ?? "Erreur SSL"); }
    finally { setLoading(false); }
  };
  const handleDisableSsl = async () => {
    setLoading(true);
    try { await disableSsl(site.id); } finally { setLoading(false); }
  };

  const handleEnableMail = useCallback(async () => {
    setLoading(true);
    try { await enableMailcatcher(site.id); }
    catch (e: any) { alert(e?.message ?? "Erreur Mailcatcher"); }
    finally { setLoading(false); }
  }, [site.id, enableMailcatcher]);

  const handleDisableMail = useCallback(async () => {
    setLoading(true);
    try { await disableMailcatcher(site.id); } finally { setLoading(false); }
  }, [site.id, disableMailcatcher]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 border-b border-surface-800">
        <button
          onClick={() => navigate("/sites")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Sites
        </button>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <StatusDot status={site.status} size="lg" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-white truncate">{site.name}</h1>
              <p className="text-xs text-slate-500">{site.domain}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              isRunning ? "bg-success/10 text-success" :
              isStarting ? "bg-warning/10 text-warning" :
              "bg-surface-800 text-slate-500"
            }`}>
              {STATUS_LABEL[site.status]}
            </span>
          </div>

          <div className="flex-shrink-0">
            {isRunning ? (
              <Button size="sm" variant="secondary" loading={loading} disabled={loading} onClick={handleStop}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                Arrêter
              </Button>
            ) : (
              <Button size="sm" variant="primary" loading={loading || isStarting} disabled={loading || isStarting} onClick={handleStart}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Démarrer
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === t.id
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "overview" && (
          <TabOverview site={site}
            onEnableSsl={handleEnableSsl} onDisableSsl={handleDisableSsl}
            onEnableMail={handleEnableMail} onDisableMail={handleDisableMail}
            loading={loading} />
        )}
        {tab === "credentials" && <TabCredentials site={site} />}
        {tab === "logs" && <TabLogs site={site} />}
        {tab === "modules" && <TabModules site={site} />}
        {tab === "config" && <TabConfig site={site} />}
      </div>
    </div>
  );
}
