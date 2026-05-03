import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/atoms/Button";

type DockerStatus = "checking" | "not_installed" | "installed_not_running" | "ready" | "error";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [dockerStatus, setDockerStatus] = useState<DockerStatus>("checking");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    invoke<boolean>("get_onboarding_done").then(async (done) => {
      if (!done) {
        navigate("/onboarding");
        return;
      }
      const status = await invoke<any>("check_docker").catch(() => "error");
      if (status === "ready") {
        setDockerStatus("ready");
      } else if (status === "installed_not_running") {
        setDockerStatus("installed_not_running");
      } else if (typeof status === "object" && status?.error) {
        setDockerStatus("error");
      } else {
        setDockerStatus("not_installed");
      }
      setChecked(true);
    });
  }, [navigate]);

  const handleStartDocker = async () => {
    setStarting(true);
    try {
      await invoke("start_docker");
      setDockerStatus("ready");
    } catch {
      setDockerStatus("error");
    } finally {
      setStarting(false);
    }
  };

  if (!checked) return null;

  if (dockerStatus === "not_installed") {
    return (
      <div className="h-full flex items-center justify-center bg-surface-950 p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Docker non installé</h2>
          <p className="text-sm text-slate-400 mb-6">
            PrestaLaunch nécessite Docker Desktop pour fonctionner.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate("/onboarding")}>
            Installer Docker
          </Button>
        </div>
      </div>
    );
  }

  if (dockerStatus === "installed_not_running") {
    return (
      <div className="h-full flex items-center justify-center bg-surface-950 p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Docker n'est pas lancé</h2>
          <p className="text-sm text-slate-400 mb-6">
            Docker Desktop est installé mais inactif. Démarrez-le pour continuer.
          </p>
          <Button variant="primary" className="w-full" loading={starting} onClick={handleStartDocker}>
            Démarrer Docker
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
