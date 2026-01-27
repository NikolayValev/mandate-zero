/**
 * Demo/Mock data for when Supabase is not available
 * Used when NEXT_PUBLIC_DEMO_MODE=true or Supabase credentials are missing
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const demoUser = {
  id: 'demo-user-001',
  email: 'demo@mandate-zero.local',
  role: 'authenticated',
  created_at: new Date('2024-01-01').toISOString(),
  app_metadata: {},
  user_metadata: {
    name: 'Demo Player',
  },
};

export const demoPlayerProfile = {
  id: 'demo-player-001',
  user_id: 'demo-user-001',
  game_id: 'demo-game-id',
  character_data: {
    name: 'Ambassador Vex',
    reputation: 85,
    influence: 72,
    credits: 15000,
    level: 5,
    faction: 'Stellar Alliance',
    skills: {
      diplomacy: 8,
      espionage: 6,
      combat: 4,
      engineering: 5,
    },
    inventory: [
      { item: 'Diplomatic Credentials', quantity: 1 },
      { item: 'Encrypted Communicator', quantity: 1 },
      { item: 'Emergency Credits', quantity: 5000 },
    ],
    location: 'Mars Station Omega',
    status: 'active',
  },
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date().toISOString(),
};

export const demoActions = [
  {
    id: 'action-001',
    game_id: 'demo-game-id',
    player_id: 'demo-player-001',
    tick_target: 2,
    type: 'negotiate',
    payload: {
      target_faction: 'Lunar Consortium',
      offer_type: 'trade_agreement',
      value: 10000,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: 'action-002',
    game_id: 'demo-game-id',
    player_id: 'demo-player-001',
    tick_target: 3,
    type: 'intelligence',
    payload: {
      target_region: 'Europa Sector',
      resource_type: 'military_movements',
    },
    created_at: new Date().toISOString(),
  },
];

export function getDemoPlayerProfile(gameId: string) {
  if (gameId === 'demo-game-id') {
    return demoPlayerProfile;
  }
  return null;
}

export function getDemoCharacterData(gameId: string, specificField?: string) {
  const profile = getDemoPlayerProfile(gameId);
  if (!profile) return null;
  
  if (specificField) {
    // Safely access the field with runtime check
    const characterData = profile.character_data as Record<string, unknown>;
    return characterData[specificField];
  }
  
  return profile.character_data;
}

export function insertDemoAction(
  gameId: string,
  playerId: string,
  currentTick: number,
  actionType: string,
  payload: Record<string, unknown>
) {
  // In demo mode, just simulate success
  const newAction = {
    id: `action-demo-${Date.now()}`,
    game_id: gameId,
    player_id: playerId,
    tick_target: currentTick + 1,
    type: actionType,
    payload,
    created_at: new Date().toISOString(),
  };
  
  return {
    success: true,
    message: 'Action inserted successfully (DEMO MODE)',
    action: newAction,
  };
}

export function isDemoMode() {
  return DEMO_MODE || !hasSupabaseVars();
}

export function hasSupabaseVars() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key'
  );
}
