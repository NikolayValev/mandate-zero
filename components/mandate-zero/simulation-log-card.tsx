"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SimulationLogCardProps {
  history: string[];
}

export function SimulationLogCard({ history }: SimulationLogCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Log</CardTitle>
        <CardDescription>
          Consequences propagate over time. Delayed effects can surface later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events yet. Choose doctrine, spend AP, and resolve the first crisis.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((entry, index) => (
              <li key={`${entry}-${index}`} className="rounded border p-2">
                {entry}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
