"use client";

import { useEffect, useState } from "react";
import { MandateZeroMvp } from "@/components/mandate-zero-mvp";
import {
  APP_LANGUAGE_OPTIONS,
  APP_LANGUAGE_STORAGE_KEY,
  type AppLanguage,
} from "@/components/mandate-zero/i18n";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function HomeShell() {
  const [language, setLanguage] = useState<AppLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "bg") {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-10">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-[1500px] items-center justify-between gap-3 p-3 px-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mandate Zero
              </p>
              <p className="font-semibold">
                {language === "bg" ? "Игрова MVP демо версия" : "Playable MVP Demo"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="language-switcher" className="text-xs text-muted-foreground">
                {language === "bg" ? "Език" : "Language"}
              </label>
              <select
                id="language-switcher"
                value={language}
                onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                className="h-9 rounded-md border bg-background px-2 text-xs"
              >
                {APP_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="w-full max-w-[1500px] space-y-6 p-5">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "bg"
                ? "Води държавата през 10 кризисни хода"
                : "Lead the state through 10 crisis turns"}
            </h1>
            <p className="max-w-4xl text-sm text-muted-foreground">
              {language === "bg"
                ? "Това MVP е умишлено локално и мигновено. Не са нужни регистрация или база данни за основния цикъл."
                : "This MVP is intentionally local and instant. No signup or database setup is required to play the core loop."}
            </p>
          </header>
          <MandateZeroMvp language={language} />
        </div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-10 text-center text-xs">
          <p>
            {language === "bg"
              ? "Локалният MVP цикъл работи в браузъра ви."
              : "Local MVP loop running in your browser."}
          </p>
        </footer>
      </div>
    </main>
  );
}
