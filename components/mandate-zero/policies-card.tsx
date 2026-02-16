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
import { getResourceLabel, type AppLanguage } from "./i18n";
import type { GameState, PolicyCommitment } from "./types";

interface PoliciesCardProps {
  game: GameState;
  canPlay: boolean;
  language: AppLanguage;
  policies: PolicyCommitment[];
  onEnactPolicy: (policy: PolicyCommitment) => void;
}

export function PoliciesCard({ game, canPlay, language, policies, onEnactPolicy }: PoliciesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "bg" ? "Необратими политики" : "Irreversible Policies"}</CardTitle>
        <CardDescription>
          {language === "bg"
            ? "Ангажиментите остават и променят всеки следващ ход."
            : "Commitments persist and reshape every future turn."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {policies.map((policy) => {
          const active = game.activePolicies.includes(policy.id);
          const disabled =
            !canPlay ||
            active ||
            game.actionPoints < policy.apCost ||
            game.resources.capital < policy.capitalCost;

          return (
            <div key={policy.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{policy.title}</p>
                <Badge variant={active ? "default" : "outline"}>
                  {active
                    ? language === "bg"
                      ? "Активна"
                      : "Active"
                    : `AP ${policy.apCost} / ${getResourceLabel("capital", language)} ${policy.capitalCost}`}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{policy.description}</p>
              <Button
                size="sm"
                className="mt-2"
                variant="secondary"
                disabled={disabled}
                onClick={() => onEnactPolicy(policy)}
              >
                {active ? (language === "bg" ? "Потвърдена" : "Committed") : language === "bg" ? "Потвърди" : "Commit"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
