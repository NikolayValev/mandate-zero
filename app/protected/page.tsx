import { redirect } from "next/navigation";
import { InfoIcon } from "lucide-react";

import {
  createClient,
  ensurePlayerProfile,
  getPlayerCharacterData,
} from "@/lib/supabase/server";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { GameFunctionsTest } from "@/components/game-functions-test";

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
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="w-full rounded-md bg-accent p-3 px-5 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page visible only to authenticated users.
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Your user details</h2>
        <pre className="max-h-32 overflow-auto rounded border p-3 font-mono text-xs">
          {JSON.stringify(data.user, null, 2)}
        </pre>
      </div>

      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Game Setup Status</h2>
        {playerProfile ? (
          <div className="w-full space-y-4">
            <div className="rounded-md bg-green-50 p-3 px-5 text-sm text-foreground dark:bg-green-950">
              <div className="flex items-center gap-3">
                <InfoIcon size="16" strokeWidth={2} />
                Player profile is ready for <code>{DEMO_GAME_ID}</code>.
              </div>
            </div>
            <pre className="max-h-40 w-full overflow-auto rounded border p-3 font-mono text-xs">
              {JSON.stringify(playerProfile, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <div className="rounded-md bg-yellow-50 p-3 px-5 text-sm text-foreground dark:bg-yellow-950">
              <div className="flex items-center gap-3">
                <InfoIcon size="16" strokeWidth={2} />
                {playerError ??
                  "Game schema is not ready yet. Run supabase/schema.sql in Supabase SQL Editor."}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Required setup:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>Open Supabase SQL Editor.</li>
                <li>Run SQL from <code>supabase/schema.sql</code>.</li>
                <li>Refresh this page.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Character Sheet Data</h2>
        {characterData ? (
          <div className="w-full space-y-4">
            <div className="rounded-md bg-blue-50 p-3 px-5 text-sm text-foreground dark:bg-blue-950">
              <div className="flex items-center gap-3">
                <InfoIcon size="16" strokeWidth={2} />
                Character data loaded successfully.
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Full Character Data</h3>
              <pre className="max-h-40 overflow-auto rounded border p-3 font-mono text-xs">
                {JSON.stringify(characterData, null, 2)}
              </pre>
            </div>
            {Boolean(reputationData) && (
              <div>
                <h3 className="mb-2 font-semibold">
                  Reputation (specific field)
                </h3>
                <pre className="rounded border p-3 font-mono text-xs">
                  {JSON.stringify(reputationData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full rounded-md bg-yellow-50 p-3 px-5 text-sm text-foreground dark:bg-yellow-950">
            <div className="flex items-center gap-3">
              <InfoIcon size="16" strokeWidth={2} />
              {characterError ??
                "Character data unavailable. This is expected until the game schema is installed."}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Action System</h2>
        <div className="w-full space-y-3 text-sm text-muted-foreground">
          <div className="rounded-md bg-purple-50 p-3 px-5 text-foreground dark:bg-purple-950">
            <div className="flex items-center gap-3">
              <InfoIcon size="16" strokeWidth={2} />
              Action insertion is enabled through the test interface below.
            </div>
          </div>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Bribe payload:{" "}
              <code className="rounded bg-muted px-1">
                {`{ "target_player_id": "xyz", "amount": 5000 }`}
              </code>
            </li>
            <li>
              Move payload:{" "}
              <code className="rounded bg-muted px-1">
                {`{ "destination": "mars", "fuel_cost": 100 }`}
              </code>
            </li>
            <li>
              Attack payload:{" "}
              <code className="rounded bg-muted px-1">
                {`{ "target": "enemy_base", "weapon": "laser" }`}
              </code>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">Interactive Function Testing</h2>
        <GameFunctionsTest defaultGameId={DEMO_GAME_ID} />
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
