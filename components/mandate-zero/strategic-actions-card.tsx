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
import { STRATEGIC_ACTIONS } from "./data";
import { riskVariant } from "./engine";
import type { StrategicAction } from "./types";

interface StrategicActionsCardProps {
  getActionDisabledReason: (action: StrategicAction) => string | null;
  onTriggerStrategicAction: (action: StrategicAction) => void;
}

export function StrategicActionsCard({
  getActionDisabledReason,
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
          return (
            <div key={action.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{action.title}</p>
                <Badge variant={riskVariant(action.risk)}>Risk {action.risk}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AP {action.apCost}, cooldown {action.cooldown}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
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
