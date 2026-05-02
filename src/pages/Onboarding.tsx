export function OnboardingPage() {
  return (
    <div className="h-full flex items-center justify-center bg-surface-950">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Bienvenue sur PrestaLaunch</h1>
        <p className="text-slate-400 text-sm">Sprint 2 — Onboarding en construction.</p>
      </div>
    </div>
  );
}
