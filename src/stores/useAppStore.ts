import { create } from "zustand";

type DockerStatus = "unknown" | "checking" | "installing" | "ready" | "error";

interface AppStore {
  onboardingDone: boolean;
  dockerStatus: DockerStatus;
  setOnboardingDone: (done: boolean) => void;
  setDockerStatus: (status: DockerStatus) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  onboardingDone: false,
  dockerStatus: "unknown",
  setOnboardingDone: (done) => set({ onboardingDone: done }),
  setDockerStatus: (status) => set({ dockerStatus: status }),
}));
