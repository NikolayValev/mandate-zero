"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppLanguage } from "./i18n";

interface OnboardingOverlayProps {
  language: AppLanguage;
  onDismiss: () => void;
}

export function OnboardingOverlay({ language, onDismiss }: OnboardingOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-background/75 p-4 backdrop-blur-[1px]">
      <Card className="mt-6 w-full max-w-xl border-primary/40">
        <CardHeader>
          <CardTitle data-testid="onboarding-title">
            {language === "bg" ? "Брифинг за първия ход" : "First Turn Briefing"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {language === "bg"
              ? "Не оптимизираш само числа. Стабилизираш държава под натрупващ се натиск."
              : "You are not optimizing raw numbers. You are stabilizing a state under compounding pressure."}
          </p>
          <p>
            {language === "bg"
              ? "Избери доктрина веднъж, използвай стратегически действия и после разреши кризата. Следи посока и инерция, не само етикети."
              : "Pick a doctrine once, use strategic actions to shape the field, then resolve the crisis. Watch direction and momentum, not just labels."}
          </p>
          <p>
            {language === "bg"
              ? "Всяко решение може да създаде отложен обратен ефект. Чети ситуацията, прогнозните диапазони и потока на причинност след развръзката."
              : "Every decision can create delayed backlash. Read the situation text, projected outcome windows, and causality feed after resolution."}
          </p>
          <div className="pt-1">
            <Button
              type="button"
              className="min-h-11 px-5"
              data-testid="onboarding-dismiss"
              onClick={onDismiss}
            >
              {language === "bg" ? "Влез в командване" : "Enter Command"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
