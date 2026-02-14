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
import { RESOURCE_META, STAT_META, STRATEGIC_ACTIONS } from "./data";
import { confidenceBand, riskVariant, summarizeDelta } from "./engine";
import type { QueuedEffect, StrategicAction } from "./types";

interface StrategicActionsCardProps {
  getActionDisabledReason: (action: StrategicAction) => string | null;
  getActionPointCost: (action: StrategicAction) => number;
  outcomeVariance: number;
  upcomingEffects: QueuedEffect[];
  onTriggerStrategicAction: (action: StrategicAction) => void;
}

export function StrategicActionsCard({
  getActionDisabledReason,
  getActionPointCost,
  outcomeVariance,
  upcomingEffects,
  onTriggerStrategicAction,
}: StrategicActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategic Actions</CardTitle>
        <CardDescription>
          Spend AP before crisis resolution. Empty AP triggers overextension penalties.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {STRATEGIC_ACTIONS.map((action) => {
          const disabledReason = getActionDisabledReason(action);
          const apCost = getActionPointCost(action);
          return (
            <div key={action.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{action.title}</p>
                <Badge variant={riskVariant(action.risk)}>Risk {action.risk}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AP {apCost}, cooldown {action.cooldown}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Confidence band: {confidenceBand(outcomeVariance)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Predicted stats: {summarizeDelta(action.effects.statEffects ?? {}, STAT_META) || "none"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Predicted resources:{" "}
                {summarizeDelta(action.effects.resourceEffects ?? {}, RESOURCE_META) || "none"}
              </p>
              {upcomingEffects.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Queued fallout:{" "}
                  {upcomingEffects
                    .slice(0, 2)
                    .map((effect) => `${effect.source} (T${effect.turnToApply})`)
                    .join(" | ")}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-11 px-4"
                  onClick={() => onTriggerStrategicAction(action)}
                  disabled={Boolean(disabledReason)}
                >
                  Use
                </Button>
                {disabledReason ? (
                  <span className="text-xs text-muted-foreground">{disabledReason}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
