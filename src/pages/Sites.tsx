import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { SiteCard } from "@/components/molecules/SiteCard";
import { CreateSiteModal } from "@/components/molecules/CreateSiteModal";
import { LogsModal } from "@/components/molecules/LogsModal";
import { useSites } from "@/hooks/useSites";
import type { CreateSiteInput, Site } from "@/types/site";

export function SitesPage() {
  const { sites, fetchSites, createSite, deleteSite, startSite, stopSite, refreshStatus, enableSsl, disableSsl, enableMailcatcher, disableMailcatcher } = useSites();
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [logsSite, setLogsSite] = useState<Site | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Poll status every 3s for non-stopped sites
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const active = sites.filter((s) => s.status !== "stopped" && s.status !== "error");
    if (active.length === 0) return;

    pollingRef.current = setInterval(() => {
      active.forEach((s) => refreshStatus(s.id));
    }, 3000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [sites, refreshStatus]);

  const handleCreate = useCallback(async (input: CreateSiteInput) => {
    await createSite(input);
  }, [createSite]);

  const handleStart = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await startSite(id); }
    finally { setLoadingId(null); }
  }, [startSite]);

  const handleStop = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await stopSite(id); }
    finally { setLoadingId(null); }
  }, [stopSite]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Supprimer ce site ? Les données Docker seront supprimées.")) return;
    setLoadingId(id);
    try { await deleteSite(id); }
    finally { setLoadingId(null); }
  }, [deleteSite]);

  const handleEnableSsl = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await enableSsl(id); }
    catch (e: any) { alert(e?.message ?? "Erreur SSL"); }
    finally { setLoadingId(null); }
  }, [enableSsl]);

  const handleDisableSsl = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await disableSsl(id); }
    finally { setLoadingId(null); }
  }, [disableSsl]);

  const handleEnableMail = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await enableMailcatcher(id); }
    catch (e: any) { alert(e?.message ?? "Erreur Mailcatcher"); }
    finally { setLoadingId(null); }
  }, [enableMailcatcher]);

  const handleDisableMail = useCallback(async (id: string) => {
    setLoadingId(id);
    try { await disableMailcatcher(id); }
    finally { setLoadingId(null); }
  }, [disableMailcatcher]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Sites PrestaShop</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {sites.length === 0
              ? "Aucun site"
              : `${sites.length} site${sites.length > 1 ? "s" : ""} — ${sites.filter((s) => s.status === "running").length} actif${sites.filter((s) => s.status === "running").length > 1 ? "s" : ""}`
            }
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau site
        </Button>
      </div>

      {/* Empty state */}
      {sites.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">Aucun site PrestaShop</p>
          <p className="text-xs text-slate-500 mb-5">Créez votre premier site local en quelques secondes</p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Créer un site
          </Button>
        </div>
      )}

      {/* Grid */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              loading={loadingId === site.id}
              onStart={() => handleStart(site.id)}
              onStop={() => handleStop(site.id)}
              onDelete={() => handleDelete(site.id)}
              onLogs={() => setLogsSite(site)}
              onEnableSsl={() => handleEnableSsl(site.id)}
              onDisableSsl={() => handleDisableSsl(site.id)}
              onEnableMail={() => handleEnableMail(site.id)}
              onDisableMail={() => handleDisableMail(site.id)}
            />
          ))}
        </div>
      )}

      <CreateSiteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      {logsSite && (
        <LogsModal
          open={!!logsSite}
          siteId={logsSite.id}
          siteName={logsSite.name}
          onClose={() => setLogsSite(null)}
        />
      )}
    </div>
  );
}
