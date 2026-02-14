import { NextRequest, NextResponse } from 'next/server';
import { 
  ensurePlayerProfile,
  getPlayerProfile, 
  getPlayerCharacterData, 
  insertPlayerAction 
} from '@/lib/supabase/server';

type TestAction =
  | "getPlayerProfile"
  | "getCharacterData"
  | "getSpecificField"
  | "insertAction";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

interface TestFunctionsBody {
  action?: TestAction;
  gameId?: string;
  specificField?: string;
  actionType?: string;
  currentTick?: number;
  payload?: JsonObject;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const parsedBody = await request.json();
    const body: TestFunctionsBody = isJsonObject(parsedBody) ? parsedBody : {};
    const { action, specificField, actionType } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: "action is required" },
        { status: 400 },
      );
    }

    let result;
    let success = true;
    let message = '';

    switch (action) {
      case 'getPlayerProfile':
        try {
          const gameId = getRequiredString(body.gameId, "gameId");
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
          const gameId = getRequiredString(body.gameId, "gameId");
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
          const gameId = getRequiredString(body.gameId, "gameId");
          const fieldName = getRequiredString(specificField, "specificField");
          result = await getPlayerCharacterData(gameId, fieldName);
          message = `Specific field '${fieldName}' fetched successfully`;
        } catch (error) {
          success = false;
          result = null;
          message = error instanceof Error ? error.message : `Failed to fetch field '${specificField}'`;
        }
        break;

      case 'insertAction':
        try {
          const gameId = getRequiredString(body.gameId, "gameId");
          const safeActionType = getRequiredString(actionType, "actionType");
          const safeCurrentTick = body.currentTick;

          if (!Number.isInteger(safeCurrentTick) || safeCurrentTick === undefined) {
            throw new Error("currentTick must be an integer");
          }

          if (!isJsonObject(body.payload)) {
            throw new Error("payload must be a JSON object");
          }

          const playerProfile = await ensurePlayerProfile(gameId);

          result = await insertPlayerAction(
            gameId,
            playerProfile.id,
            safeCurrentTick,
            safeActionType,
            body.payload
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
    console.error('API Error:', error);
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
