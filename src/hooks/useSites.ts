import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";
import { useSiteStore } from "@/stores/useSiteStore";
import type { Site, CreateSiteInput } from "@/types/site";

export function useSites() {
  const { sites, setSites, updateSite, addSite, removeSite } = useSiteStore();

  const fetchSites = useCallback(async () => {
    const data = await invoke<Site[]>("list_sites");
    setSites(data);
  }, [setSites]);

  const createSite = useCallback(
    async (input: CreateSiteInput): Promise<Site> => {
      const site = await invoke<Site>("create_site", { input });
      addSite(site);
      return site;
    },
    [addSite]
  );

  const deleteSite = useCallback(
    async (siteId: string) => {
      await invoke("delete_site", { siteId });
      removeSite(siteId);
    },
    [removeSite]
  );

  const startSite = useCallback(
    async (siteId: string) => {
      updateSite(siteId, { status: "starting" });
      await invoke("start_site", { siteId });
      updateSite(siteId, { status: "running" });
    },
    [updateSite]
  );

  const stopSite = useCallback(
    async (siteId: string) => {
      await invoke("stop_site", { siteId });
      updateSite(siteId, { status: "stopped" });
    },
    [updateSite]
  );

  const refreshStatus = useCallback(
    async (siteId: string) => {
      const status = await invoke<string>("get_site_status", { siteId });
      updateSite(siteId, { status: status as Site["status"] });
    },
    [updateSite]
  );

  const enableSsl = useCallback(
    async (siteId: string) => {
      const site = await invoke<Site>("enable_ssl", { siteId });
      updateSite(siteId, { ssl_port: site.ssl_port });
    },
    [updateSite]
  );

  const disableSsl = useCallback(
    async (siteId: string) => {
      await invoke("disable_ssl", { siteId });
      updateSite(siteId, { ssl_port: null });
    },
    [updateSite]
  );

  const enableMailcatcher = useCallback(
    async (siteId: string) => {
      const site = await invoke<Site>("enable_mailcatcher", { siteId });
      updateSite(siteId, { mail_port: site.mail_port });
    },
    [updateSite]
  );

  const disableMailcatcher = useCallback(
    async (siteId: string) => {
      await invoke("disable_mailcatcher", { siteId });
      updateSite(siteId, { mail_port: null });
    },
    [updateSite]
  );

  return { sites, fetchSites, createSite, deleteSite, startSite, stopSite, refreshStatus, enableSsl, disableSsl, enableMailcatcher, disableMailcatcher };
}
