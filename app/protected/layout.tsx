import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center gap-10">
        <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
          <div className="flex w-full max-w-[1200px] items-center justify-between p-3 px-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mandate Zero
              </p>
              <Link href="/" className="font-semibold">
                Protected Sandbox
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <AuthButton />
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
        <div className="w-full max-w-[1200px] p-5">{children}</div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-10 text-center text-xs">
          <p>Authenticated sandbox for optional Supabase flow.</p>
        </footer>
      </div>
    </main>
  );
}
