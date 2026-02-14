import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { PostgrestError } from "@supabase/supabase-js";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

export interface PlayerProfile {
  id: string;
  user_id: string;
  game_id: string;
  character_data: JsonObject;
  created_at: string;
  updated_at: string;
}

export interface PlayerAction {
  id: number;
  game_id: string;
  player_id: string;
  tick_target: number;
  type: string;
  payload: JsonObject;
  created_at: string;
}

const DEFAULT_CHARACTER_DATA: JsonObject = {
  reputation: 0,
  health: 100,
  credits: 1000,
  level: 1,
  inventory: [],
};

const UNIQUE_VIOLATION = "23505";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

async function getCurrentUserId(client?: Awaited<ReturnType<typeof createClient>>) {
  const supabase = client ?? (await createClient());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User not authenticated");
  }

  return user.id;
}

function isUniqueViolation(error: PostgrestError | null) {
  return error?.code === UNIQUE_VIOLATION;
}

/**
 * Get player profile in a specific game
 * @param gameId - The ID of the game
 * @returns Player profile data or null if not found
 */
export async function getPlayerProfile(gameId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);

  // Fetch the player profile for this user in the specified game
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch player profile: ${error.message}`);
  }

  return player as PlayerProfile | null;
}

/**
 * Ensure the current user has a player profile in the requested game.
 * Creates one with starter character data when missing.
 */
export async function ensurePlayerProfile(gameId: string) {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);

  const existing = await getPlayerProfile(gameId);
  if (existing) {
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("players")
    .insert({
      user_id: userId,
      game_id: gameId,
      character_data: DEFAULT_CHARACTER_DATA,
    })
    .select("*")
    .single();

  if (insertError && !isUniqueViolation(insertError)) {
    throw new Error(`Failed to create player profile: ${insertError.message}`);
  }

  // If another request inserted at the same time, fetch the row again.
  if (!created) {
    const fallback = await getPlayerProfile(gameId);
    if (!fallback) {
      throw new Error("Player profile was not found after create attempt");
    }
    return fallback;
  }

  return created as PlayerProfile;
}

/**
 * Read player character sheet data
 * @param gameId - The ID of the game
 * @param specificField - Optional specific field to read (e.g., 'reputation')
 * @returns Character data or specific field value
 */
export async function getPlayerCharacterData(gameId: string, specificField?: string) {
  const player = await getPlayerProfile(gameId);

  if (!player) {
    throw new Error(`No player profile found for game '${gameId}'`);
  }

  const characterData = player.character_data ?? {};

  if (!specificField) {
    return characterData;
  }

  return {
    field: specificField,
    value: Object.prototype.hasOwnProperty.call(characterData, specificField)
      ? characterData[specificField]
      : null,
  };
}

/**
 * Insert new action for the current tick
 * @param gameId - The ID of the game
 * @param playerId - The player's ID
 * @param currentTick - The current game tick
 * @param actionType - Type of action (e.g., 'bribe', 'move', 'attack')
 * @param payload - Action payload data
 * @returns Success confirmation
 */
export async function insertPlayerAction(
  gameId: string,
  playerId: string,
  currentTick: number,
  actionType: string,
  payload: JsonObject,
) {
  const supabase = await createClient();
  const userId = await getCurrentUserId(supabase);

  const normalizedActionType = actionType.trim();
  if (!normalizedActionType) {
    throw new Error("Action type is required");
  }

  if (!Number.isInteger(currentTick) || currentTick < 0) {
    throw new Error("Current tick must be a non-negative integer");
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();

  if (playerError) {
    throw new Error(`Failed to validate player ownership: ${playerError.message}`);
  }

  if (!player) {
    throw new Error("Player profile does not belong to the current user");
  }

  const { data: insertedAction, error } = await supabase
    .from("actions")
    .insert({
      game_id: gameId,
      player_id: playerId,
      tick_target: currentTick + 1,
      type: normalizedActionType,
      payload,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert action: ${error.message}`);
  }

  return insertedAction as PlayerAction;
}
