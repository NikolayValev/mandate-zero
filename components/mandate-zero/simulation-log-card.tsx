"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { REGION_META, STAT_META } from "./data";
import { summarizeDelta } from "./engine";
import type { CausalityEntry } from "./types";

interface SimulationLogCardProps {
  entries: CausalityEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: CausalityEntry) => void;
}

export function SimulationLogCard({ entries, selectedEntryId, onSelectEntry }: SimulationLogCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Causality Feed</CardTitle>
        <CardDescription>
          Action to immediate deltas to queued fallout to thresholds to region impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events yet. Choose doctrine, spend AP, and resolve the first crisis.
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
                    <p className="font-medium">Turn {entry.turn}</p>
                    <p className="text-xs text-muted-foreground">
                      Action: {entry.actionLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Immediate: {summarizeDelta(entry.immediateDeltas, STAT_META) || "none"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delayed: {entry.delayedEnqueued.join(", ") || "none"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Triggered: {entry.thresholdsTriggered.join(" | ") || "none"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Affected regions:{" "}
                      {entry.regionImpacts.length > 0
                        ? entry.regionImpacts
                            .map(
                              (region) =>
                                REGION_META.find((meta) => meta.key === region)?.label ?? region,
                            )
                            .join(", ")
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
