import type { RiskLevel, Scenario, ScenarioOption, StrategicAction } from "./types";

function riskTone(risk: RiskLevel) {
  if (risk === "High") {
    return "This is a high-volatility move and can create second-order shocks.";
  }
  if (risk === "Medium") {
    return "This can stabilize one front while opening pressure elsewhere.";
  }
  return "This is a lower-volatility option, but it may not resolve root pressure.";
}

function delayedSignal(option: ScenarioOption) {
  if (!option.delayed || option.delayed.length === 0) {
    return "No obvious delayed backlash is currently flagged.";
  }
  return `Watch for delayed fallout: ${option.delayed.map((item) => item.label).join(", ")}.`;
}

export function buildScenarioBrief(scenario: Scenario) {
  if (scenario.briefing) {
    return scenario.briefing;
  }
  return `${scenario.description} Your team needs a response before the situation hardens across regions.`;
}

export function buildSituationExplanation(scenario: Scenario, option: ScenarioOption) {
  const scene = option.narrative ?? `${scenario.title}: ${option.description}`;
  const tension =
    option.riskHint ??
    `${riskTone(option.risk)} Stakeholder pressure is likely to shift (${option.factionReaction}).`;
  return `${scene} ${tension} ${delayedSignal(option)}`;
}

export function buildActionExplanation(action: StrategicAction) {
  const scene = action.narrative ?? action.description;
  const tension =
    action.riskHint ??
    `${riskTone(action.risk)} It should be treated as a setup move, not a full resolution.`;
  return `${scene} ${tension}`;
}
