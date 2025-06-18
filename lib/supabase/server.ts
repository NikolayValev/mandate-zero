import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

/**
 * Get player profile in a specific game
 * @param gameId - The ID of the game
 * @returns Player profile data or null if not found
 */
export async function getPlayerProfile(gameId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Fetch the player profile for this user in the specified game
  const { data: player, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch player profile: ${error.message}`);
  }

  return player;
}

/**
 * Read player character sheet data
 * @param gameId - The ID of the game
 * @param specificField - Optional specific field to read (e.g., 'reputation')
 * @returns Character data or specific field value
 */
export async function getPlayerCharacterData(gameId: string, specificField?: string) {
  const supabase = await createClient();
  
  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Build the select query - either full character_data or specific field
  const selectQuery = specificField 
    ? `character_data->>${specificField}` 
    : 'character_data';

  // Fetch the character data for this user in the specified game
  const { data: characterData, error } = await supabase
    .from('players')
    .select(selectQuery)
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch character data: ${error.message}`);
  }

  return characterData;
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
  payload: Record<string, any>
) {
  const supabase = await createClient();
  
  // Get the current user for authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Insert the new action
  const { error } = await supabase
    .from('actions')
    .insert([{
      game_id: gameId,
      player_id: playerId,
      tick_target: currentTick + 1,
      type: actionType,
      payload: payload
    }]);

  if (error) {
    throw new Error(`Failed to insert action: ${error.message}`);
  }

  return { success: true, message: 'Action inserted successfully' };
}
