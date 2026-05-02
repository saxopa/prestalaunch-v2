import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button";
import { ProgressBar } from "@/components/molecules/ProgressBar";
import { useDocker, type DockerProgress } from "@/hooks/useDocker";

type Step = "welcome" | "docker" | "ready";

const LOGO = (
  <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/30">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  </div>
);

export function OnboardingPage() {
  const navigate = useNavigate();
  const { dockerStatus, check, installDocker, startDocker } = useDocker();
  const [step, setStep] = useState<Step>("welcome");
  const [progress, setProgress] = useState<DockerProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDockerSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await check();
      // check() met à jour dockerStatus via le store
    } catch {
      setError("Impossible de vérifier Docker.");
    } finally {
      setLoading(false);
    }
  }, [check]);

  useEffect(() => {
    if (step === "docker") {
      handleDockerSetup();
    }
  }, [step]);

  useEffect(() => {
    if (dockerStatus === "ready" && step === "docker") {
      setStep("ready");
    }
  }, [dockerStatus, step]);

  const handleInstall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await installDocker((p) => setProgress(p));
    } catch (e: any) {
      setError(e.message ?? "Erreur installation Docker.");
    } finally {
      setLoading(false);
    }
  }, [installDocker]);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await startDocker((p) => setProgress(p));
    } catch (e: any) {
      setError(e.message ?? "Erreur démarrage Docker.");
    } finally {
      setLoading(false);
    }
  }, [startDocker]);

  const handleFinish = useCallback(async () => {
    await invoke("set_onboarding_done");
    navigate("/sites");
  }, [navigate]);

  return (
    <div className="h-full flex items-center justify-center bg-surface-950 p-6">
      <div className="w-full max-w-md">
        {step === "welcome" && (
          <div className="text-center">
            {LOGO}
            <h1 className="text-2xl font-bold text-white mb-2">
              Bienvenue sur PrestaLaunch
            </h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Lancez des sites PrestaShop locaux en quelques secondes.
              Zéro configuration, zéro prise de tête.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-10 text-center">
              {[
                { icon: "⚡", label: "Rapide", sub: "Site prêt en < 2 min" },
                { icon: "📦", label: "Isolé", sub: "Chaque site indépendant" },
                { icon: "🔁", label: "Templates", sub: "Configs sauvegardées" },
              ].map((f) => (
                <div key={f.label} className="bg-surface-900 border border-surface-800 rounded-xl p-3">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <p className="text-xs font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.sub}</p>
                </div>
              ))}
            </div>
            <Button variant="primary" className="w-full" onClick={() => setStep("docker")}>
              Commencer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
        )}

        {step === "docker" && (
          <div className="text-center">
            {LOGO}
            <h2 className="text-xl font-bold text-white mb-2">
              Vérification Docker
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              PrestaLaunch utilise Docker pour isoler chaque site.
              L'installation est automatique.
            </p>

            {dockerStatus === "checking" && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Détection en cours…</p>
              </div>
            )}

            {dockerStatus === "not_installed" && !loading && (
              <div className="space-y-4">
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-left">
                  <p className="text-sm font-medium text-warning mb-1">Docker non détecté</p>
                  <p className="text-xs text-slate-400">
                    Docker Desktop va être téléchargé et installé automatiquement (~500 MB).
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={handleInstall} loading={loading}>
                  Installer Docker automatiquement
                </Button>
              </div>
            )}

            {dockerStatus === "installing" && !loading && (
              <div className="space-y-4">
                <div className="bg-info/10 border border-info/20 rounded-xl p-4 text-left">
                  <p className="text-sm font-medium text-info mb-1">Docker installé mais non démarré</p>
                  <p className="text-xs text-slate-400">
                    Docker Desktop est présent. Cliquez pour le démarrer.
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={handleStart} loading={loading}>
                  Démarrer Docker
                </Button>
              </div>
            )}

            {(loading || (progress && progress.step !== "ready")) && (
              <div className="space-y-4 mt-4">
                {progress && (
                  <>
                    <ProgressBar percent={progress.percent} />
                    <p className="text-xs text-slate-400">{progress.message}</p>
                  </>
                )}
                {!progress && (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-danger/10 border border-danger/20 rounded-xl p-4 text-left">
                <p className="text-xs text-danger">{error}</p>
                <button
                  className="text-xs text-brand-400 underline mt-2"
                  onClick={handleDockerSetup}
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        {step === "ready" && (
          <div className="text-center">
            {LOGO}
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Tout est prêt !</h2>
            <p className="text-slate-400 text-sm mb-8">
              Docker est actif. Vous pouvez créer votre premier site PrestaShop.
            </p>
            <Button variant="primary" className="w-full" onClick={handleFinish}>
              Créer mon premier site
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
        )}

        {/* Indicateur étapes */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {(["welcome", "docker", "ready"] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-6 bg-brand-500" : "w-1.5 bg-surface-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
