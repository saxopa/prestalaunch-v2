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

  useEffect(() => {
    if (!open) return;
    invoke<SiteTemplate[]>("list_templates").then((tpls) => {
      setTemplates(tpls);
      const def = tpls.find((t) => t.is_default) ?? tpls[0] ?? null;
      if (def) applyTemplate(def);
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName(""); setDomain(""); setDomainTouched(false);
      setError(null); setLoading(false);
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
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                  selectedTpl?.id === tpl.id
                    ? "bg-brand-500/10 border-brand-500/50 text-brand-400"
                    : "bg-surface-800 border-surface-700 text-slate-300 hover:border-surface-600"
                }`}
              >
                <span className="block font-semibold mb-0.5">{tpl.name}</span>
                <span className="text-slate-500 font-normal">PS {tpl.ps_version}</span>
              </button>
            ))}
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
                onChange={(e) => setPsVersion(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.1.7", "8.1.6", "1.7.8"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">PHP</label>
              <select
                value={phpVersion}
                onChange={(e) => setPhpVersion(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.3", "8.2", "8.1", "7.4"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">MySQL</label>
              <select
                value={mysqlVersion}
                onChange={(e) => setMysqlVersion(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {["8.0", "5.7"].map((v) => <option key={v}>{v}</option>)}
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
