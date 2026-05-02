import { create } from "zustand";
import type { Site } from "@/types/site";

interface SiteStore {
  sites: Site[];
  selectedSiteId: string | null;
  setSites: (sites: Site[]) => void;
  updateSite: (id: string, patch: Partial<Site>) => void;
  addSite: (site: Site) => void;
  removeSite: (id: string) => void;
  selectSite: (id: string | null) => void;
}

export const useSiteStore = create<SiteStore>((set) => ({
  sites: [],
  selectedSiteId: null,

  setSites: (sites) => set({ sites }),

  updateSite: (id, patch) =>
    set((state) => ({
      sites: state.sites.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  addSite: (site) =>
    set((state) => ({ sites: [...state.sites, site] })),

  removeSite: (id) =>
    set((state) => ({
      sites: state.sites.filter((s) => s.id !== id),
      selectedSiteId: state.selectedSiteId === id ? null : state.selectedSiteId,
    })),

  selectSite: (id) => set({ selectedSiteId: id }),
}));
