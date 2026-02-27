"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STAT_META } from "./data";
import { computeMandateObjectives, summarizeDelta, toPressureState, toTier } from "./engine";
import {
  getPressureLabel,
  getRegionLabel,
  getStatLabel,
  getTierLabel,
  type AppLanguage,
} from "./i18n";
import type { CausalityEntry, GameState, RegionKey } from "./types";

interface RunDebriefCardProps {
  game: GameState;
  entries: CausalityEntry[];
  language: AppLanguage;
  onRestart: () => void;
}

function topRegions(entries: CausalityEntry[]): RegionKey[] {
  const counts = new Map<RegionKey, number>();
  for (const entry of entries) {
    for (const region of entry.regionImpacts) {
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([region]) => region);
}

export function RunDebriefCard({ game, entries, language, onRestart }: RunDebriefCardProps) {
  const objectives = computeMandateObjectives(game);
  const pressureState = toPressureState(game.pressure);
  const keyChoices = entries
    .filter((entry) => !entry.actionLabel.startsWith("Doctrine:"))
    .slice(0, 3)
    .map((entry) => entry.actionLabel);
  const triggered = [...new Set(entries.flatMap((entry) => entry.thresholdsTriggered))].slice(0, 3);
  const delayed = [...new Set(entries.flatMap((entry) => entry.delayedEnqueued))].slice(0, 3);
  const hotspots = topRegions(entries).map((region) => getRegionLabel(region, language));
  const objectiveLabels =
    language === "bg"
      ? {
          stability: "Стабилност",
          trust: "Доверие",
          pressure: "Натиск",
          avgStress: "Среден стрес",
          coupRisk: "Риск от преврат",
        }
      : {
          stability: "Stability",
          trust: "Trust",
          pressure: "Pressure",
          avgStress: "Avg Stress",
          coupRisk: "Coup Risk",
        };
  const failedObjectives = [
    !objectives.passes.stability ? `${objectiveLabels.stability} < ${objectives.stabilityTarget}` : null,
    !objectives.passes.trust ? `${objectiveLabels.trust} < ${objectives.trustTarget}` : null,
    !objectives.passes.pressure ? `${objectiveLabels.pressure} >= ${objectives.pressureCap}` : null,
    !objectives.passes.avgStress ? `${objectiveLabels.avgStress} >= ${objectives.avgStressCap}` : null,
    !objectives.passes.coupRisk ? `${objectiveLabels.coupRisk} >= ${objectives.coupRiskCap}` : null,
  ].filter((entry): entry is string => Boolean(entry));
  const localizedStatMeta = STAT_META.map((stat) => ({
    ...stat,
    label: getStatLabel(stat.key, language),
  }));

  return (
    <Card data-testid="run-debrief-card" className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            {game.phase === "won"
              ? language === "bg"
                ? "Обобщение: Оцеляване"
                : "Mandate Debrief: Survived"
              : language === "bg"
                ? "Обобщение: Колапс"
                : "Mandate Debrief: Collapsed"}
          </CardTitle>
          <Badge variant={game.phase === "won" ? "default" : "destructive"}>
            {game.phase === "won"
              ? language === "bg"
                ? "Победа"
                : "Victory"
              : language === "bg"
                ? "Поражение"
                : "Defeat"}
          </Badge>
        </div>
        <CardDescription>
          {language === "bg" ? "Обобщение за ход" : "Turn"} {Math.min(game.turn - 1, game.maxTurns)}{" "}
          {language === "bg" ? "за сийд" : "summary for seed"}{" "}
          <span className="font-mono">{game.seedText}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{game.message}</p>
        <p>
          {language === "bg" ? "Крайно състояние на натиска" : "Final pressure state"}:{" "}
          <strong>{getPressureLabel(pressureState.label, language)}</strong>
        </p>
        <p>
          {language === "bg" ? "Крайни системи" : "Final systems"}:{" "}
          {STAT_META.map(
            (stat) =>
              `${getStatLabel(stat.key, language)} ${getTierLabel(toTier(game.stats[stat.key]).label, language)}`,
          ).join(" | ")}
        </p>
        <p>
          {language === "bg" ? "Неизпълнени цели" : "Failed objectives"}:{" "}
          {failedObjectives.length > 0 ? failedObjectives.join(" | ") : language === "bg" ? "Няма" : "None"}
        </p>
        <p>
          {language === "bg" ? "Последни системни промени" : "Recent system shifts"}:{" "}
          {summarizeDelta(game.lastStatDelta, localizedStatMeta) ||
            (language === "bg" ? "Няма незабавни промени." : "No immediate shifts recorded.")}
        </p>
        <p>
          {language === "bg" ? "Ключови избори" : "Key choices"}:{" "}
          {keyChoices.length > 0
            ? keyChoices.join(" -> ")
            : language === "bg"
              ? "Няма записани ключови действия."
              : "No major actions recorded."}
        </p>
        <p>
          {language === "bg" ? "Задействани резултати" : "Triggered outcomes"}:{" "}
          {triggered.length > 0 ? triggered.join(" | ") : language === "bg" ? "Няма" : "None"}
        </p>
        <p>
          {language === "bg" ? "Отложени ефекти" : "Delayed effects"}:{" "}
          {delayed.length > 0 ? delayed.join(" | ") : language === "bg" ? "Няма" : "None"}
        </p>
        <p>
          {language === "bg" ? "Най-засегнати региони" : "Most affected regions"}:{" "}
          {hotspots.length > 0 ? hotspots.join(", ") : language === "bg" ? "Няма" : "None"}
        </p>
        <Button type="button" className="min-h-11 px-5" data-testid="debrief-restart" onClick={onRestart}>
          {language === "bg" ? "Нова симулация (същия сийд)" : "Start New Run (Same Seed)"}
        </Button>
      </CardContent>
    </Card>
  );
}
