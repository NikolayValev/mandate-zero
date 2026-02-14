"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
                    <p className="font-medium">
                      T{entry.turn}: {entry.title}
                    </p>
                    {entry.steps.map((step) => (
                      <p key={`${entry.id}-${step.label}`} className="text-xs text-muted-foreground">
                        {step.label}: {step.detail}
                      </p>
                    ))}
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
