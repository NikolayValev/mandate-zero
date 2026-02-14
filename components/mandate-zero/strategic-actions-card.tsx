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
import { STAT_META, STRATEGIC_ACTIONS } from "./data";
import { riskVariant } from "./engine";
import { buildActionExplanation } from "./situation-copy";
import type { OutcomeEstimate, QueuedEffect, StrategicAction } from "./types";

interface StrategicActionsCardProps {
  getActionDisabledReason: (action: StrategicAction) => string | null;
  getActionPointCost: (action: StrategicAction) => number;
  getActionOutcomeEstimate: (action: StrategicAction) => OutcomeEstimate[];
  upcomingEffects: QueuedEffect[];
  onTriggerStrategicAction: (action: StrategicAction) => void;
}

export function StrategicActionsCard({
  getActionDisabledReason,
  getActionPointCost,
  getActionOutcomeEstimate,
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
            <div key={action.id} data-testid={`strategic-action-${action.id}`} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{action.title}</p>
                <Badge variant={riskVariant(action.risk)}>Risk {action.risk}</Badge>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Situation</p>
              <p className="mt-1 text-xs text-muted-foreground">{buildActionExplanation(action)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AP {apCost}, cooldown {action.cooldown}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                Projected Outcome Window
              </p>
              {(getActionOutcomeEstimate(action) ?? []).slice(0, 4).map((estimate) => {
                const statLabel = STAT_META.find((entry) => entry.key === estimate.system)?.label ?? estimate.system;
                const minLabel = estimate.min > 0 ? `+${estimate.min}` : `${estimate.min}`;
                const maxLabel = estimate.max > 0 ? `+${estimate.max}` : `${estimate.max}`;
                return (
                  <p key={`${action.id}-${estimate.system}`} className="mt-1 text-xs text-muted-foreground">
                    {statLabel}: {minLabel} to {maxLabel} ({estimate.confidence})
                  </p>
                );
              })}
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
                  data-testid={`use-action-${action.id}`}
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
