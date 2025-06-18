"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GameFunctionsTestProps {
  initialPlayerProfile?: unknown;
  initialCharacterData?: unknown;
  initialReputationData?: unknown;
}

export function GameFunctionsTest({ 
  initialPlayerProfile, 
  initialCharacterData, 
  initialReputationData 
}: GameFunctionsTestProps) {
  const [gameId, setGameId] = useState("demo-game-id");
  const [specificField, setSpecificField] = useState("reputation");
  
  // Action form state
  const [actionType, setActionType] = useState("bribe");
  const [targetPlayerId, setTargetPlayerId] = useState("xyz");
  const [amount, setAmount] = useState(5000);
  const [currentTick, setCurrentTick] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>>({});

  const testGetPlayerProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getPlayerProfile', 
          gameId 
        }),
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, playerProfile: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, playerProfile: { error: (error as Error).message } }));
    }
    setLoading(false);
  };

  const testGetCharacterData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getCharacterData', 
          gameId 
        }),
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, characterData: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, characterData: { error: (error as Error).message } }));
    }
    setLoading(false);
  };

  const testGetSpecificField = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getSpecificField', 
          gameId,
          specificField 
        }),
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, specificField: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, specificField: { error: (error as Error).message } }));
    }
    setLoading(false);
  };

  const testInsertAction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'insertAction',
          gameId,
          actionType,
          currentTick,
          payload: { target_player_id: targetPlayerId, amount }
        }),
      });
      const data = await response.json();
      setResults(prev => ({ ...prev, insertAction: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, insertAction: { error: (error as Error).message } }));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎮 Game Functions Test Interface</CardTitle>
          <CardDescription>
            Test the player profile, character data, and action insertion functions
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Profile Test */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Player Profile</CardTitle>
            <CardDescription>Fetch player profile for the game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testGetPlayerProfile} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Player Profile"}
            </Button>
            {results.playerProfile && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Result:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(results.playerProfile, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Character Data Test */}
        <Card>
          <CardHeader>
            <CardTitle>🧬 Character Data</CardTitle>
            <CardDescription>Fetch full character sheet data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testGetCharacterData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Character Data"}
            </Button>
            {results.characterData && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Result:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(results.characterData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specific Field Test */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Specific Field</CardTitle>
            <CardDescription>Fetch specific character data field</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="specificField">Field Name</Label>
              <Input
                id="specificField"
                value={specificField}
                onChange={(e) => setSpecificField(e.target.value)}
                placeholder="e.g., reputation, health, level"
              />
            </div>
            <Button 
              onClick={testGetSpecificField} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Loading..." : "Get Specific Field"}
            </Button>
            {results.specificField && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Result:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(results.specificField, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Insertion Test */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Insert Action</CardTitle>
            <CardDescription>Submit a new action for the next tick</CardDescription>
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
            {results.insertAction && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Result:</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(results.insertAction, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Results */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
