import type { RiskLevel, Scenario, ScenarioOption, StrategicAction } from "./types";
import type { AppLanguage } from "./i18n";

function riskTone(risk: RiskLevel, language: AppLanguage) {
  if (language === "bg") {
    if (risk === "High") {
      return "Екстремна волатилност. Очаквайте дестабилизация и остри вторични шокове.";
    }
    if (risk === "Medium") {
      return "Умерен риск. Може да овладее кризата, но ще прехвърли натиск другаде.";
    }
    return "Консервативен подход. Ограничен риск, но може да не реши първопричината.";
  }
  if (risk === "High") {
    return "Extreme volatility. Anticipate destabilization and severe secondary shocks.";
  }
  if (risk === "Medium") {
    return "Moderate risk. May contain the immediate threat, but shifts pressure elsewhere.";
  }
  return "Conservative approach. Limited blowback, though root causes may persist.";
}

function delayedSignal(option: ScenarioOption, language: AppLanguage) {
  if (!option.delayed || option.delayed.length === 0) {
    return ""; // Remove the "No obvious delayed backlash" line to reduce clutter
  }
  if (language === "bg") {
    return `Разузнаването предупреждава за латентни заплахи: ${option.delayed.map((item) => item.label).join(", ")}.`;
  }
  return `Intelligence flags latent threats: ${option.delayed.map((item) => item.label).join(", ")}.`;
}

export function buildScenarioBrief(scenario: Scenario, language: AppLanguage = "en") {
  if (language === "bg") {
    return `${scenario.description} Ситуацията е активна. Необходима е директива, преди кризата да обхване съседни региони.`;
  }
  if (scenario.briefing) {
    return scenario.briefing;
  }
  return `${scenario.description} The situation is active. A directive is required before regional containment fails.`;
}

export function buildSituationExplanation(
  scenario: Scenario,
  option: ScenarioOption,
  language: AppLanguage = "en",
) {
  if (language === "bg") {
    const tension = `${riskTone(option.risk, language)} Очаквана реакция: ${option.factionReaction}.`;
    const delayed = delayedSignal(option, language);
    return `${option.description} ${tension} ${delayed}`.trim();
  }
  const scene = option.narrative ?? option.description;
  const tension =
    option.riskHint ??
    `${riskTone(option.risk, language)} Projected faction response: ${option.factionReaction}.`;
  const delayed = delayedSignal(option, language);
  return `${scene} ${tension} ${delayed}`.trim();
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
