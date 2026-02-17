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
import { RESOURCE_META, STAT_META } from "./data";
import { computeTrend, toTier } from "./engine";
import {
  getDirectionLabel,
  getMomentumLabel,
  getResourceLabel,
  getStatLabel,
  getTierLabel,
  type AppLanguage,
} from "./i18n";
import type { CoreSystemKey, GameState } from "./types";

interface SystemStateCardProps {
  game: GameState;
  warnings: string[];
  highlightedSystems: CoreSystemKey[];
  showDebugNumbers: boolean;
  language: AppLanguage;
  onToggleDebugNumbers: () => void;
}

function resourceStateLabel(value: number) {
  if (value >= 8) {
    return "Ready";
  }
  if (value >= 4) {
    return "Tight";
  }
  return "Low";
}

export function SystemStateCard({
  game,
  warnings,
  highlightedSystems,
  showDebugNumbers,
  language,
  onToggleDebugNumbers,
}: SystemStateCardProps) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{language === "bg" ? "Състояние на системата" : "System State"}</CardTitle>
          {isDev ? (
            <Button type="button" variant="outline" size="sm" className="min-h-10 px-3 text-xs" onClick={onToggleDebugNumbers}>
              {showDebugNumbers
                ? language === "bg"
                  ? "Скрий числа"
                  : "Hide Numbers"
                : language === "bg"
                  ? "Покажи числа"
                  : "Show Numbers"}
            </Button>
          ) : null}
        </div>
        <CardDescription className="hidden sm:block">
          {language === "bg"
            ? "Ключовите системи са качествени. Стрелките показват посока, а повторението - инерция."
            : "Core systems are qualitative. Arrows show direction and repeated movement shows momentum."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {STAT_META.map((stat) => {
          const value = game.stats[stat.key];
          const tier = toTier(value);
          const trend = computeTrend(game.systemHistory.map((snapshot) => snapshot[stat.key]));
          const severityWidth = (5 - tier.severity) * 20;
          const highlighted = highlightedSystems.includes(stat.key);
          return (
            <div
              key={stat.key}
              data-testid={`system-row-${stat.key}`}
              data-highlighted={highlighted ? "true" : "false"}
              className={`space-y-1 rounded-md border p-2 transition-colors ${
                highlighted ? "border-primary/60 bg-primary/5 animate-pulse" : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">{getStatLabel(stat.key, language)}</div>
                <Badge
                  data-testid={`system-tier-${stat.key}`}
                  variant={tier.severity >= 3 ? "destructive" : tier.severity >= 2 ? "secondary" : "outline"}
                >
                  {getTierLabel(tier.label, language)} {getDirectionLabel(trend.direction, language)}
                </Badge>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-primary/70 transition-all"
                  style={{ width: `${severityWidth}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {language === "bg" ? "Тренд" : "Trend"} {getDirectionLabel(trend.direction, language)}
                {trend.momentum ? `, ${getMomentumLabel(trend.momentum, language)}` : ""}
                {showDebugNumbers ? ` | ${value}` : ""}
              </p>
            </div>
          );
        })}

        <div className="pt-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {language === "bg" ? "Ресурси" : "Resources"}
          </p>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_META.map((resource) => {
              const delta = game.lastResourceDelta[resource.key] ?? 0;
              return (
                <Badge key={resource.key} variant="outline">
                  <span className="sm:hidden">
                    {getResourceLabel(resource.key, language)}: {resourceStateLabel(game.resources[resource.key])}
                  </span>
                  <span className="hidden sm:inline">
                    {getResourceLabel(resource.key, language)}: {game.resources[resource.key]}
                    {delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
                  </span>
                </Badge>
              );
            })}
          </div>
        </div>

        {warnings.length > 0 ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
