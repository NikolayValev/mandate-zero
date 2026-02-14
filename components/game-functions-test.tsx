"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ApiResponse {
  success: boolean;
  message: string;
  result?: unknown;
  error?: string;
  timestamp?: string;
}

interface ResultsMap {
  playerProfile?: ApiResponse;
  characterData?: ApiResponse;
  specificField?: ApiResponse;
  insertAction?: ApiResponse;
}

interface GameFunctionsTestProps {
  defaultGameId: string;
}

export function GameFunctionsTest({ defaultGameId }: GameFunctionsTestProps) {
  const [gameId, setGameId] = useState(defaultGameId);
  const [specificField, setSpecificField] = useState("reputation");

  const [actionType, setActionType] = useState("bribe");
  const [targetPlayerId, setTargetPlayerId] = useState("xyz");
  const [amount, setAmount] = useState(5000);
  const [currentTick, setCurrentTick] = useState(1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultsMap>({});

  const runTest = async (body: Record<string, unknown>) => {
    const response = await fetch("/api/test-functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ApiResponse;
  };

  const testGetPlayerProfile = async () => {
    setLoading(true);
    try {
      const data = await runTest({ action: "getPlayerProfile", gameId });
      setResults((prev) => ({ ...prev, playerProfile: data }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        playerProfile: {
          success: false,
          message: "Failed to fetch player profile",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
    setLoading(false);
  };

  const testGetCharacterData = async () => {
    setLoading(true);
    try {
      const data = await runTest({ action: "getCharacterData", gameId });
      setResults((prev) => ({ ...prev, characterData: data }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        characterData: {
          success: false,
          message: "Failed to fetch character data",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
    setLoading(false);
  };

  const testGetSpecificField = async () => {
    setLoading(true);
    try {
      const data = await runTest({
        action: "getSpecificField",
        gameId,
        specificField,
      });
      setResults((prev) => ({ ...prev, specificField: data }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        specificField: {
          success: false,
          message: "Failed to fetch specific field",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
    setLoading(false);
  };

  const testInsertAction = async () => {
    setLoading(true);
    try {
      const data = await runTest({
        action: "insertAction",
        gameId,
        actionType,
        currentTick,
        payload: { target_player_id: targetPlayerId, amount },
      });
      setResults((prev) => ({ ...prev, insertAction: data }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        insertAction: {
          success: false,
          message: "Failed to insert action",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Functions Test Interface</CardTitle>
          <CardDescription>
            Test player profile reads, character reads, and action insertion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gameId">Game ID</Label>
            <Input
              id="gameId"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Player Profile</CardTitle>
            <CardDescription>Fetch your player row for the game.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testGetPlayerProfile}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Player Profile"}
            </Button>
            {Boolean(results.playerProfile) && (
              <div className="mt-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(results.playerProfile, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Character Data</CardTitle>
            <CardDescription>Fetch the full character sheet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testGetCharacterData}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Character Data"}
            </Button>
            {Boolean(results.characterData) && (
              <div className="mt-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(results.characterData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specific Field</CardTitle>
            <CardDescription>Fetch one field from character data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="specificField">Field Name</Label>
              <Input
                id="specificField"
                value={specificField}
                onChange={(e) => setSpecificField(e.target.value)}
                placeholder="reputation, health, level"
              />
            </div>
            <Button
              onClick={testGetSpecificField}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Specific Field"}
            </Button>
            {Boolean(results.specificField) && (
              <div className="mt-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(results.specificField, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insert Action</CardTitle>
            <CardDescription>Submit action for the next tick.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actionType">Action Type</Label>
                <Input
                  id="actionType"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  placeholder="bribe, move, attack"
                />
              </div>
              <div>
                <Label htmlFor="currentTick">Current Tick</Label>
                <Input
                  id="currentTick"
                  type="number"
                  value={currentTick}
                  onChange={(e) => setCurrentTick(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetPlayerId">Target Player ID</Label>
                <Input
                  id="targetPlayerId"
                  value={targetPlayerId}
                  onChange={(e) => setTargetPlayerId(e.target.value)}
                  placeholder="xyz"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
            </div>
            <Button
              onClick={testInsertAction}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Insert Action"}
            </Button>
            {Boolean(results.insertAction) && (
              <div className="mt-4">
                <h4 className="mb-2 font-semibold">Result:</h4>
                <pre className="max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(results.insertAction, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-60 overflow-auto rounded bg-muted p-4 text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
