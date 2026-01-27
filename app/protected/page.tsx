import { redirect } from "next/navigation";

import { getUser, getPlayerProfile, getPlayerCharacterData } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { GameFunctionsTest } from "@/components/game-functions-test";
import { EnvStatus } from "@/components/env-status";

export default async function ProtectedPage() {
  const { data, error } = await getUser();
  
  if (error || !data?.user) {
    // In demo mode, we still show the page but with a notice
    if (!isDemoMode()) {
      redirect("/auth/login");
    }
  }

  // Example: Try to fetch player profile for a demo game
  // You can replace 'demo-game-id' with an actual game ID from your database
  let playerProfile = null;
  let playerError = null;
  let characterData = null;
  let characterError = null;
  let reputationData = null;
  
  try {
    playerProfile = await getPlayerProfile('demo-game-id');
  } catch (err) {
    playerError = err instanceof Error ? err.message : 'Failed to fetch player profile';
  }

  // Try to fetch character data
  try {
    characterData = await getPlayerCharacterData('demo-game-id');
  } catch (err) {
    characterError = err instanceof Error ? err.message : 'Failed to fetch character data';
  }

  // Try to fetch specific field (reputation)
  try {
    reputationData = await getPlayerCharacterData('demo-game-id', 'reputation');
  } catch {
    // Ignore specific field errors if main character data also failed
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <EnvStatus />
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(data.user, null, 2)}
        </pre>
      </div>
      
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Player Profile</h2>
        {playerProfile ? (
          <div className="w-full">
            <div className="bg-green-50 dark:bg-green-950 text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-3">
              <InfoIcon size="16" strokeWidth={2} />
              Player profile found! This shows your character data for the game.
            </div>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(playerProfile, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="w-full">
            <div className="bg-yellow-50 dark:bg-yellow-950 text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-3">
              <InfoIcon size="16" strokeWidth={2} />
              {playerError || "No player profile found for demo game. Create a 'players' table and add some data to see this in action!"}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>To test this feature:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create a &apos;players&apos; table in your Supabase database</li>
                <li>Add columns: user_id (uuid), game_id (text), and any character data you want</li>
                <li>Insert a row with your user ID and game_id=&apos;demo-game-id&apos;</li>
                <li>Refresh this page to see your player profile!</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Character Sheet Data</h2>
        {characterData ? (
          <div className="w-full space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
              <InfoIcon size="16" strokeWidth={2} />
              Character data loaded! This shows your character&apos;s attributes and stats.
            </div>
            <div>
              <h3 className="font-semibold mb-2">Full Character Data:</h3>
              <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                {JSON.stringify(characterData, null, 2)}
              </pre>
            </div>
            {reputationData && (
              <div>
                <h3 className="font-semibold mb-2">Reputation (Specific Field):</h3>
                <pre className="text-xs font-mono p-3 rounded border">
                  {JSON.stringify(reputationData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="bg-yellow-50 dark:bg-yellow-950 text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-3">
              <InfoIcon size="16" strokeWidth={2} />
              {characterError || "No character data found. Add a &apos;character_data&apos; JSON column to your players table!"}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Character data features:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Store JSON data like reputation, skills, inventory</li>
                <li>Query specific fields: <code className="bg-muted px-1 rounded">character_data{'->>'}reputation</code></li>
                <li>Flexible schema for any game mechanics</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Action System</h2>
        <div className="w-full">
          <div className="bg-purple-50 dark:bg-purple-950 text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center mb-3">
            <InfoIcon size="16" strokeWidth={2} />
            Action insertion is ready! Players can submit actions for future ticks.
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Example action types you can implement:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Bribe:</strong> <code className="bg-muted px-1 rounded">{'{ target_player_id: "xyz", amount: 5000 }'}</code></li>
              <li><strong>Move:</strong> <code className="bg-muted px-1 rounded">{'{ destination: "mars", fuel_cost: 100 }'}</code></li>
              <li><strong>Attack:</strong> <code className="bg-muted px-1 rounded">{'{ target: "enemy_base", weapon: "laser" }'}</code></li>
            </ul>
            <p className="mt-3">
              <span className="font-semibold">Note:</span> Action insertion is commented out in the code to prevent spam. 
              Uncomment the action insertion code to test it live!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Test Interface */}
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">🧪 Interactive Function Testing</h2>
        <GameFunctionsTest 
          initialPlayerProfile={playerProfile}
          initialCharacterData={characterData}
          initialReputationData={reputationData}
        />
      </div>
      
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
