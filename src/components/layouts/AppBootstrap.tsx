import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    invoke<boolean>("get_onboarding_done").then((done) => {
      if (!done) navigate("/onboarding");
      setChecked(true);
    });
  }, [navigate]);

  if (!checked) return null;
  return <>{children}</>;
}
