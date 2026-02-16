import type { RiskLevel, Scenario, ScenarioOption, StrategicAction } from "./types";
import type { AppLanguage } from "./i18n";

function riskTone(risk: RiskLevel, language: AppLanguage) {
  if (language === "bg") {
    if (risk === "High") {
      return "Това е ход с висока волатилност и може да създаде вторични шокове.";
    }
    if (risk === "Medium") {
      return "Това може да стабилизира един фронт, но да отвори натиск другаде.";
    }
    return "Това е по-нискорисков избор, но може да не реши коренния натиск.";
  }
  if (risk === "High") {
    return "This is a high-volatility move and can create second-order shocks.";
  }
  if (risk === "Medium") {
    return "This can stabilize one front while opening pressure elsewhere.";
  }
  return "This is a lower-volatility option, but it may not resolve root pressure.";
}

function delayedSignal(option: ScenarioOption, language: AppLanguage) {
  if (!option.delayed || option.delayed.length === 0) {
    if (language === "bg") {
      return "В момента няма ясен сигнал за отложен обратен ефект.";
    }
    return "No obvious delayed backlash is currently flagged.";
  }
  if (language === "bg") {
    return `Следете за отложени последствия: ${option.delayed.map((item) => item.label).join(", ")}.`;
  }
  return `Watch for delayed fallout: ${option.delayed.map((item) => item.label).join(", ")}.`;
}

export function buildScenarioBrief(scenario: Scenario, language: AppLanguage = "en") {
  if (language === "bg") {
    return `${scenario.description} Екипът ви се нуждае от реакция, преди ситуацията да се втвърди по региони.`;
  }
  if (scenario.briefing) {
    return scenario.briefing;
  }
  return `${scenario.description} Your team needs a response before the situation hardens across regions.`;
}

export function buildSituationExplanation(
  scenario: Scenario,
  option: ScenarioOption,
  language: AppLanguage = "en",
) {
  if (language === "bg") {
    return `${scenario.title}: ${option.description} ${riskTone(option.risk, language)} Натискът между заинтересованите групи вероятно ще се промени (${option.factionReaction}). ${delayedSignal(option, language)}`;
  }
  const scene = option.narrative ?? `${scenario.title}: ${option.description}`;
  const tension =
    option.riskHint ??
    `${riskTone(option.risk, language)} Stakeholder pressure is likely to shift (${option.factionReaction}).`;
  return `${scene} ${tension} ${delayedSignal(option, language)}`;
}

export function buildActionExplanation(action: StrategicAction, language: AppLanguage = "en") {
  if (language === "bg") {
    return `${action.description} ${riskTone(action.risk, language)} Третирайте го като подготвящ ход, не като пълно решение.`;
  }
  const scene = action.narrative ?? action.description;
  const tension =
    action.riskHint ??
    `${riskTone(action.risk, language)} It should be treated as a setup move, not a full resolution.`;
  return `${scene} ${tension}`;
}
