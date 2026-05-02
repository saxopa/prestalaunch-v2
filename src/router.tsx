import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layouts/AppShell";
import { SitesPage } from "@/pages/Sites";
import { SiteDetailPage } from "@/pages/SiteDetail";
import { SettingsPage } from "@/pages/Settings";
import { OnboardingPage } from "@/pages/Onboarding";

export const router = createBrowserRouter([
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/sites" replace /> },
      { path: "sites", element: <SitesPage /> },
      { path: "sites/:siteId", element: <SiteDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
