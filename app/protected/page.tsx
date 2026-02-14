import { redirect } from "next/navigation";
import { InfoIcon } from "lucide-react";

import {
  createClient,
  ensurePlayerProfile,
  getPlayerCharacterData,
} from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DEMO_GAME_ID = "demo-game-id";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  let playerProfile: unknown = null;
  let playerError: string | null = null;
  let characterData: unknown = null;
  let characterError: string | null = null;
  let reputationData: unknown = null;

  try {
    playerProfile = await ensurePlayerProfile(DEMO_GAME_ID);
  } catch (err) {
    playerError =
      err instanceof Error ? err.message : "Failed to ensure player profile";
  }

  if (!playerError) {
    try {
      characterData = await getPlayerCharacterData(DEMO_GAME_ID);
    } catch (err) {
      characterError =
        err instanceof Error ? err.message : "Failed to fetch character data";
    }

    try {
      reputationData = await getPlayerCharacterData(DEMO_GAME_ID, "reputation");
    } catch {
      // No-op. Full character data fetch already reports errors.
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <div className="w-full rounded-md bg-accent p-3 px-5 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <InfoIcon size="16" strokeWidth={2} />
          Supabase integration verification area. The core gameplay demo lives
          on the public home page.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Auth Session Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Confirms the protected route is session-gated and user identity is available server-side.
            </p>
            <pre className="max-h-56 overflow-auto rounded border p-3 font-mono text-xs">
              {JSON.stringify(data.user, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Bootstrap Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Target demo game: <code>{DEMO_GAME_ID}</code>
            </p>
            {playerProfile ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Player profile initialized successfully.
              </p>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {playerError ??
                  "Run supabase/schema.sql in Supabase SQL Editor to initialize demo tables and seed data."}
              </p>
            )}
            {characterError ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {characterError}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Character Data Read Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Validates both full document reads and specific field-level reads.
          </p>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Full Character Payload
            </p>
            <pre className="max-h-56 overflow-auto rounded border p-3 font-mono text-xs">
              {JSON.stringify(characterData ?? {}, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Reputation Field Query
            </p>
            <pre className="max-h-40 overflow-auto rounded border p-3 font-mono text-xs">
              {JSON.stringify(reputationData ?? {}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/">Back to Gameplay MVP</Link>
        </Button>
      </div>
    </div>
  );
}
