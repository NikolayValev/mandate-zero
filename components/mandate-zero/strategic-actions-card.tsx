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
import { riskVariant } from "./engine";
import {
  getConfidenceLabel,
  getRiskLabel,
  getStatLabel,
  type AppLanguage,
} from "./i18n";
import { buildActionExplanation } from "./situation-copy";
import type { OutcomeEstimate, QueuedEffect, StrategicAction } from "./types";

interface StrategicActionsCardProps {
  language: AppLanguage;
  actions: StrategicAction[];
  getActionDisabledReason: (action: StrategicAction) => string | null;
  getActionPointCost: (action: StrategicAction) => number;
  getActionOutcomeEstimate: (action: StrategicAction) => OutcomeEstimate[];
  upcomingEffects: QueuedEffect[];
  onTriggerStrategicAction: (action: StrategicAction) => void;
}

export function StrategicActionsCard({
  language,
  actions,
  getActionDisabledReason,
  getActionPointCost,
  getActionOutcomeEstimate,
  upcomingEffects,
  onTriggerStrategicAction,
}: StrategicActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "bg" ? "Стратегически действия" : "Strategic Actions"}</CardTitle>
        <CardDescription>
          {language === "bg"
            ? "Изразходвай AP преди развръзката. Нулев AP активира санкции за преразтягане."
            : "Spend AP before crisis resolution. Empty AP triggers overextension penalties."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const disabledReason = getActionDisabledReason(action);
          const apCost = getActionPointCost(action);
          return (
            <div key={action.id} data-testid={`strategic-action-${action.id}`} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{action.title}</p>
                <Badge variant={riskVariant(action.risk)}>
                  {language === "bg" ? "Риск" : "Risk"} {getRiskLabel(action.risk, language)}
                </Badge>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {language === "bg" ? "Ситуация" : "Situation"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{buildActionExplanation(action, language)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AP {apCost}, {language === "bg" ? "възстановяване" : "cooldown"} {action.cooldown}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {language === "bg" ? "Прогнозен диапазон" : "Projected Outcome Window"}
              </p>
              {(getActionOutcomeEstimate(action) ?? []).slice(0, 4).map((estimate) => {
                const statLabel = getStatLabel(estimate.system, language);
                const minLabel = estimate.min > 0 ? `+${estimate.min}` : `${estimate.min}`;
                const maxLabel = estimate.max > 0 ? `+${estimate.max}` : `${estimate.max}`;
                return (
                  <p key={`${action.id}-${estimate.system}`} className="mt-1 text-xs text-muted-foreground">
                    {statLabel}: {minLabel} {language === "bg" ? "до" : "to"} {maxLabel} (
                    {getConfidenceLabel(estimate.confidence, language)})
                  </p>
                );
              })}
              {upcomingEffects.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {language === "bg" ? "Планирани последствия:" : "Queued fallout:"}{" "}
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
                  {language === "bg" ? "Използвай" : "Use"}
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
