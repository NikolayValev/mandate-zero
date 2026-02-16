"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STAT_META } from "./data";
import { summarizeDelta } from "./engine";
import { getRegionLabel, getStatLabel, type AppLanguage } from "./i18n";
import type { CausalityEntry } from "./types";

interface SimulationLogCardProps {
  entries: CausalityEntry[];
  selectedEntryId: string | null;
  language: AppLanguage;
  onSelectEntry: (entry: CausalityEntry) => void;
}

export function SimulationLogCard({
  entries,
  selectedEntryId,
  language,
  onSelectEntry,
}: SimulationLogCardProps) {
  const localizedStatMeta = STAT_META.map((entry) => ({
    ...entry,
    label: getStatLabel(entry.key, language),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "bg" ? "Поток на причинност" : "Causality Feed"}</CardTitle>
        <CardDescription>
          {language === "bg"
            ? "Действие -> незабавни промени -> планирани последствия -> прагове -> регионален ефект."
            : "Action to immediate deltas to queued fallout to thresholds to region impact."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {language === "bg"
              ? "Още няма събития. Избери доктрина, изразходвай AP и реши първата криза."
              : "No events yet. Choose doctrine, spend AP, and resolve the first crisis."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {entries.map((entry) => (
              <li
                key={entry.id}
                data-testid="causality-entry"
                className={`rounded border p-2 transition-colors ${
                  selectedEntryId === entry.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto w-full justify-start px-0 py-0 text-left"
                  onClick={() => onSelectEntry(entry)}
                >
                  <div className="w-full">
                    <p className="font-medium">{language === "bg" ? "Ход" : "Turn"} {entry.turn}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bg" ? "Действие" : "Action"}: {entry.actionLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bg" ? "Незабавно" : "Immediate"}:{" "}
                      {summarizeDelta(entry.immediateDeltas, localizedStatMeta) ||
                        (language === "bg" ? "няма" : "none")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bg" ? "Отложено" : "Delayed"}:{" "}
                      {entry.delayedEnqueued.join(", ") || (language === "bg" ? "няма" : "none")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bg" ? "Задействано" : "Triggered"}:{" "}
                      {entry.thresholdsTriggered.join(" | ") || (language === "bg" ? "няма" : "none")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bg" ? "Засегнати региони" : "Affected regions"}:{" "}
                      {entry.regionImpacts.length > 0
                        ? entry.regionImpacts
                            .map((region) => getRegionLabel(region, language))
                            .join(", ")
                        : language === "bg"
                          ? "няма"
                          : "none"}
                    </p>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
