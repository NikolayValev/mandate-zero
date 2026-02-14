import { MandateZeroMvp } from "@/components/mandate-zero-mvp";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-10">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-6xl items-center justify-between p-3 px-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mandate Zero
              </p>
              <p className="font-semibold">Playable MVP Demo</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="w-full max-w-6xl space-y-6 p-5">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Lead the state through 10 crisis turns
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This MVP is intentionally local and instant. No signup or database
              setup is required to play the core loop.
            </p>
          </header>
          <MandateZeroMvp />
        </div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-10 text-center text-xs">
          <p>Local MVP loop running in your browser.</p>
        </footer>
      </div>
    </main>
  );
}
