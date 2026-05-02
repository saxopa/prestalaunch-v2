import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import type { CreateSiteInput, SiteTemplate } from "@/types/site";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateSiteInput) => Promise<void>;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateSiteModal({ open, onClose, onCreate }: Props) {
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<SiteTemplate | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [domainTouched, setDomainTouched] = useState(false);
  const [psVersion, setPsVersion] = useState("");
  const [phpVersion, setPhpVersion] = useState("");
  const [mysqlVersion, setMysqlVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save template state
  const [savingTpl, setSavingTpl] = useState(false);
  const [tplName, setTplName] = useState("");
  const [savingTplLoading, setSavingTplLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    const tpls = await invoke<SiteTemplate[]>("list_templates");
    setTemplates(tpls);
    return tpls;
  }, []);

  useEffect(() => {
    if (!open) return;
    loadTemplates().then((tpls) => {
      const def = tpls.find((t) => t.is_default) ?? tpls[0] ?? null;
      if (def) applyTemplate(def);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName(""); setDomain(""); setDomainTouched(false);
      setError(null); setLoading(false);
      setSavingTpl(false); setTplName("");
    }
  }, [open]);

  const applyTemplate = useCallback((tpl: SiteTemplate) => {
    setSelectedTpl(tpl);
    setPsVersion(tpl.ps_version);
    setPhpVersion(tpl.php_version);
    setMysqlVersion(tpl.mysql_version);
  }, []);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!domainTouched) setDomain(slugify(v) + ".local");
  };

  const handleSaveTemplate = async () => {
    if (!tplName.trim()) return;
    setSavingTplLoading(true);
    try {
      const tpl = await invoke<SiteTemplate>("create_template", {
        name: tplName.trim(),
        psVersion,
        phpVersion,
        mysqlVersion,
      });
      setTemplates((prev) => [...prev, tpl]);
      setSelectedTpl(tpl);
      setSavingTpl(false);
      setTplName("");
    } finally {
      setSavingTplLoading(false);
    }
  };

  const handleDeleteTemplate = async (tpl: SiteTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    await invoke("delete_template", { templateId: tpl.id });
    setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
    if (selectedTpl?.id === tpl.id) {
      const fallback = templates.find((t) => t.id !== tpl.id) ?? null;
      if (fallback) applyTemplate(fallback);
      else setSelectedTpl(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !domain.trim()) {
      setError("Nom et domaine requis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), domain: domain.trim(), ps_version: psVersion, php_version: phpVersion, mysql_version: mysqlVersion });
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau site PrestaShop">
      <div className="space-y-5">
        {/* Template selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Template</label>
          <div className="grid grid-cols-3 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className={`relative px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                  selectedTpl?.id === tpl.id
                    ? "bg-brand-500/10 border-brand-500/50 text-brand-400"
                    : "bg-surface-800 border-surface-700 text-slate-300 hover:border-surface-600"
                }`}
              >
                <span className="block font-semibold mb-0.5 pr-4">{tpl.name}</span>
                <span className="text-slate-500 font-normal">PS {tpl.ps_version}</span>
                {tpl.user_created === 1 && (
                  <span
                    onClick={(e) => handleDeleteTemplate(tpl, e)}
                    className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Supprimer ce template"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Save as template */}
          <div className="mt-2">
            {savingTpl ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); if (e.key === "Escape") setSavingTpl(false); }}
                  placeholder="Nom du template…"
                  className="flex-1 bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <Button size="sm" variant="primary" onClick={handleSaveTemplate} loading={savingTplLoading} disabled={!tplName.trim()}>
                  Sauvegarder
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSavingTpl(false)} disabled={savingTplLoading}>
                  Annuler
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setSavingTpl(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Sauvegarder les versions comme template
              </button>
            )}
          </div>
        </div>

        {/* Name + domain */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom du site</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Mon PrestaShop"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Domaine local</label>
            <input
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setDomainTouched(true); }}
              placeholder="mon-shop.local"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Version overrides */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Versions</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">PrestaShop</label>
              <select
                value={psVersion}
                onChange={(e) => { setPsVersion(e.target.value); setSelectedTpl(null); }}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.1.7", "8.1.6", "8.1.5", "8.1.4", "8.1.3", "8.0.5", "8.0.4", "8.0.3", "1.7.8.11", "1.7.8.10", "1.7.8", "1.6.1.24"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">PHP</label>
              <select
                value={phpVersion}
                onChange={(e) => { setPhpVersion(e.target.value); setSelectedTpl(null); }}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.3", "8.2", "8.1", "8.0", "7.4", "7.3", "7.2"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">MySQL</label>
              <select
                value={mysqlVersion}
                onChange={(e) => { setMysqlVersion(e.target.value); setSelectedTpl(null); }}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.4", "8.0", "5.7"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
            Créer le site
          </Button>
        </div>
      </div>
    </Modal>
  );
}
