import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

export type DockerStatus =
  | "not_installed"
  | "installed_not_running"
  | "ready"
  | { error: string };

export interface DockerProgress {
  step: string;
  percent: number;
  message: string;
}

export function useDocker() {
  const { dockerStatus, setDockerStatus } = useAppStore();
  const unlistenRef = useRef<(() => void) | null>(null);

  const check = useCallback(async () => {
    setDockerStatus("checking");
    try {
      const status = await invoke<DockerStatus>("check_docker");
      if (status === "ready") {
        setDockerStatus("ready");
      } else if (status === "installed_not_running") {
        setDockerStatus("installing");
      } else {
        setDockerStatus("not_installed" as any);
      }
    } catch {
      setDockerStatus("error");
    }
  }, [setDockerStatus]);

  const startDocker = useCallback(
    async (onProgress: (p: DockerProgress) => void) => {
      const unlisten = await listen<DockerProgress>("docker:progress", (e) => {
        onProgress(e.payload);
        if (e.payload.step === "ready") setDockerStatus("ready");
      });
      unlistenRef.current = unlisten;

      try {
        await invoke("start_docker");
      } finally {
        unlisten();
      }
    },
    [setDockerStatus]
  );

  const installDocker = useCallback(
    async (onProgress: (p: DockerProgress) => void) => {
      const unlisten = await listen<DockerProgress>("docker:progress", (e) => {
        onProgress(e.payload);
        if (e.payload.step === "ready") setDockerStatus("ready");
      });
      unlistenRef.current = unlisten;

      try {
        await invoke("install_docker");
      } finally {
        unlisten();
      }
    },
    [setDockerStatus]
  );

  useEffect(() => {
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  return { dockerStatus, check, startDocker, installDocker };
}
