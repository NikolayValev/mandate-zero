"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { POLICIES } from "./data";
import type { GameState, PolicyCommitment } from "./types";

interface PoliciesCardProps {
  game: GameState;
  canPlay: boolean;
  onEnactPolicy: (policy: PolicyCommitment) => void;
}

export function PoliciesCard({ game, canPlay, onEnactPolicy }: PoliciesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Irreversible Policies</CardTitle>
        <CardDescription>Commitments persist and reshape every future turn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {POLICIES.map((policy) => {
          const active = game.activePolicies.includes(policy.id);
          const disabled =
            !canPlay ||
            active ||
            game.actionPoints < policy.apCost ||
            game.resources.capital < policy.capitalCost;

          return (
            <div key={policy.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{policy.title}</p>
                <Badge variant={active ? "default" : "outline"}>
                  {active ? "Active" : `AP ${policy.apCost} / Capital ${policy.capitalCost}`}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{policy.description}</p>
              <Button
                size="sm"
                className="mt-2"
                variant="secondary"
                disabled={disabled}
                onClick={() => onEnactPolicy(policy)}
              >
                {active ? "Committed" : "Commit"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
