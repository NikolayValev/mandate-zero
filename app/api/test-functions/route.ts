import { NextRequest, NextResponse } from 'next/server';
import { 
  getPlayerProfile, 
  getPlayerCharacterData, 
  insertPlayerAction 
} from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, specificField, actionType, currentTick, payload } = body;

    let result;
    let success = true;
    let message = '';

    switch (action) {
      case 'getPlayerProfile':
        try {
          result = await getPlayerProfile(gameId);
          message = 'Player profile fetched successfully';
        } catch (error) {
          success = false;
          result = null;
          message = error instanceof Error ? error.message : 'Failed to fetch player profile';
        }
        break;

      case 'getCharacterData':
        try {
          result = await getPlayerCharacterData(gameId);
          message = 'Character data fetched successfully';
        } catch (error) {
          success = false;
          result = null;
          message = error instanceof Error ? error.message : 'Failed to fetch character data';
        }
        break;

      case 'getSpecificField':
        try {
          result = await getPlayerCharacterData(gameId, specificField);
          message = `Specific field '${specificField}' fetched successfully`;
        } catch (error) {
          success = false;
          result = null;
          message = error instanceof Error ? error.message : `Failed to fetch field '${specificField}'`;
        }
        break;

      case 'insertAction':
        try {
          // First get player profile to get player ID
          const playerProfile = await getPlayerProfile(gameId);
          if (!playerProfile?.id) {
            throw new Error('Player profile not found - cannot insert action');
          }

          result = await insertPlayerAction(
            gameId,
            playerProfile.id,
            currentTick,
            actionType,
            payload
          );
          message = 'Action inserted successfully';
        } catch (error) {
          success = false;
          result = null;
          message = error instanceof Error ? error.message : 'Failed to insert action';
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: 'Unknown action type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success,
      message,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error);
    }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
