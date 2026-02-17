import { applyActorEffects, applyResourceEffects, applyStatEffects, getDoctrine } from "@/components/mandate-zero/engine";
import { withSystemHistory } from "@/components/mandate-zero/runtime/helpers";
import type { AppLanguage } from "@/components/mandate-zero/i18n";
import type { CausalityEntry, DoctrineId, GameState } from "@/components/mandate-zero/types";
import type { Dispatch, SetStateAction } from "react";

interface TriggerDoctrineActionArgs {
  doctrineId: DoctrineId;
  game: GameState;
  language: AppLanguage;
  localizedScenarioTitle: string;
  doctrineTitleById: Record<DoctrineId, string>;
  setGame: Dispatch<SetStateAction<GameState>>;
  setHistory: Dispatch<SetStateAction<string[]>>;
  appendCausalityEntry: (entryInput: Omit<CausalityEntry, "id">) => void;
}

export function triggerDoctrineAction({
  doctrineId,
  game,
  language,
  localizedScenarioTitle,
  doctrineTitleById,
  setGame,
  setHistory,
  appendCausalityEntry,
}: TriggerDoctrineActionArgs) {
  if (game.doctrine || game.phase !== "playing") {
    return;
  }
  const selected = getDoctrine(doctrineId);
  if (!selected) {
    return;
  }

  const stats = applyStatEffects(game.stats, selected.startEffects.statEffects ?? {});
  const resources = applyResourceEffects(game.resources, selected.startEffects.resourceEffects ?? {});
  const actorApplication = applyActorEffects(game.actors, selected.startEffects.actorEffects ?? {});
  const doctrineTitle = doctrineTitleById[doctrineId] ?? selected.title;

  setGame((prev) => ({
    ...prev,
    doctrine: doctrineId,
    turnStage: "decision",
    stats,
    resources,
    actors: actorApplication.actors,
    ...withSystemHistory(prev, stats, prev.pressure),
    message:
      language === "bg"
        ? `Ð˜Ð·Ð±Ñ€Ð°Ð½Ð° Ð´Ð¾ÐºÑ‚Ñ€Ð¸Ð½Ð°: ${doctrineTitle}. Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¸Ñ‚Ðµ ÐºÐ¾Ð¼Ð¿Ñ€Ð¾Ð¼Ð¸ÑÐ¸ Ð²ÐµÑ‡Ðµ ÑÐ° Ð·Ð°ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¸.`
        : `${doctrineTitle} doctrine selected. Strategic tradeoffs are now locked in.`,
    lastStatDelta: selected.startEffects.statEffects ?? {},
    lastResourceDelta: selected.startEffects.resourceEffects ?? {},
    lastActorLoyaltyDelta: actorApplication.loyaltyDelta,
    lastActorPressureDelta: actorApplication.pressureDelta,
  }));
  setHistory((prev) =>
    [
      language === "bg"
        ? `Ð˜Ð·Ð±Ñ€Ð°Ð½Ð° Ð´Ð¾ÐºÑ‚Ñ€Ð¸Ð½Ð° -> ${doctrineTitle}`
        : `Doctrine selected -> ${doctrineTitle}`,
      ...prev,
    ].slice(0, 18),
  );
  appendCausalityEntry({
    turn: game.turn,
    phase: "decision",
    actionId: selected.id,
    actionLabel: `${language === "bg" ? "Ð”Ð¾ÐºÑ‚Ñ€Ð¸Ð½Ð°" : "Doctrine"}: ${doctrineTitle}`,
    crisisId: game.scenarioId,
    crisisLabel: localizedScenarioTitle,
    immediateDeltas: selected.startEffects.statEffects ?? {},
    delayedEnqueued: [],
    thresholdsTriggered: [],
    regionImpacts: [],
  });
}
