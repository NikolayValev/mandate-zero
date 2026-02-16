"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_SEED } from "./data";
import type { AppLanguage } from "./i18n";
import type { DemoSeed } from "./types";

interface DemoSeedsCardProps {
  language: AppLanguage;
  seedInput: string;
  onSeedInputChange: (value: string) => void;
  onStartRunWithSeed: (seedValue: string) => void;
  onClearLocalData: () => void;
  newSeedName: string;
  onNewSeedNameChange: (value: string) => void;
  newSeedValue: string;
  onNewSeedValueChange: (value: string) => void;
  onAddCustomSeed: () => void;
  seedMessage: string | null;
  allSeeds: DemoSeed[];
  onRemoveCustomSeed: (seedId: string) => void;
}

export function DemoSeedsCard({
  language,
  seedInput,
  onSeedInputChange,
  onStartRunWithSeed,
  onClearLocalData,
  newSeedName,
  onNewSeedNameChange,
  newSeedValue,
  onNewSeedValueChange,
  onAddCustomSeed,
  seedMessage,
  allSeeds,
  onRemoveCustomSeed,
}: DemoSeedsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{language === "bg" ? "Демо сийдове" : "Demo Seeds"}</CardTitle>
        <CardDescription className="hidden sm:block">
          {language === "bg"
            ? "Готови сценарии за детерминистични демонстрации."
            : "Scenario presets for deterministic demos."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <details className="group rounded-lg border p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {language === "bg" ? "Библиотека със сийдове" : "Seed Library"}
              </p>
              <p className="text-xs text-muted-foreground">
                {allSeeds.length} {language === "bg" ? "сценария" : "scenarios"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground group-open:hidden">
              {language === "bg" ? "Разгъни" : "Expand"}
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              {language === "bg" ? "Свий" : "Collapse"}
            </span>
          </summary>

          <div className="mt-4 space-y-4">
            <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <Label htmlFor="seed-input">{language === "bg" ? "Текущ сийд" : "Current Seed"}</Label>
                <Input
                  id="seed-input"
                  value={seedInput}
                  onChange={(event) => onSeedInputChange(event.target.value)}
                  placeholder={DEFAULT_SEED}
                />
              </div>
              <Button onClick={() => onStartRunWithSeed(seedInput)} variant="outline">
                {language === "bg" ? "Рестарт" : "Restart"}
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <Label htmlFor="new-seed-name">{language === "bg" ? "Име на сийд" : "Seed Name"}</Label>
                <Input
                  id="new-seed-name"
                  value={newSeedName}
                  onChange={(event) => onNewSeedNameChange(event.target.value)}
                  placeholder={language === "bg" ? "Демо: пазарна паника" : "Investor Panic Demo"}
                />
              </div>
              <div>
                <Label htmlFor="new-seed-value">{language === "bg" ? "Стойност на сийд" : "Seed Value"}</Label>
                <Input
                  id="new-seed-value"
                  value={newSeedValue}
                  onChange={(event) => onNewSeedValueChange(event.target.value)}
                  placeholder={seedInput}
                />
              </div>
              <Button onClick={onAddCustomSeed}>{language === "bg" ? "Добави" : "Add"}</Button>
            </div>

            <div className="flex items-center justify-between gap-2">
              {seedMessage ? <p className="text-xs text-muted-foreground">{seedMessage}</p> : <span />}
              <Button onClick={onClearLocalData} variant="destructive" size="sm">
                {language === "bg" ? "Изчисти локалните данни" : "Clear Local Data"}
              </Button>
            </div>

            <div className="space-y-2">
              {allSeeds.map((seed) => (
                <div
                  key={seed.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{seed.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{seed.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartRunWithSeed(seed.value)}
                    >
                      {language === "bg" ? "Зареди" : "Load"}
                    </Button>
                    {seed.custom ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemoveCustomSeed(seed.id)}
                      >
                        {language === "bg" ? "Премахни" : "Remove"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
