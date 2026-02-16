import type {
  ActorKey,
  DemoSeed,
  Doctrine,
  DoctrineId,
  PolicyCommitment,
  PolicyId,
  RegionKey,
  ResourceKey,
  RiskLevel,
  Scenario,
  StatKey,
  StrategicAction,
  TrendDirection,
  TrendMomentum,
  TurnStage,
} from "./types";

export type AppLanguage = "en" | "bg";

export const APP_LANGUAGE_STORAGE_KEY = "mandate-zero-language-v1";

export const APP_LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "bg", label: "Български" },
];

const STAT_LABELS: Record<AppLanguage, Record<StatKey, string>> = {
  en: {
    stability: "Stability",
    treasury: "Treasury",
    influence: "Influence",
    security: "Security",
    trust: "Public Trust",
  },
  bg: {
    stability: "Стабилност",
    treasury: "Хазна",
    influence: "Влияние",
    security: "Сигурност",
    trust: "Обществено доверие",
  },
};

const RESOURCE_LABELS: Record<AppLanguage, Record<ResourceKey, string>> = {
  en: {
    intel: "Intel",
    supplies: "Supplies",
    capital: "Political Capital",
  },
  bg: {
    intel: "Разузнаване",
    supplies: "Ресурси",
    capital: "Политически капитал",
  },
};

const ACTOR_LABELS: Record<AppLanguage, Record<ActorKey, string>> = {
  en: {
    banks: "Banks",
    military: "Military",
    media: "Media",
    public: "Public Factions",
  },
  bg: {
    banks: "Банки",
    military: "Армия",
    media: "Медии",
    public: "Обществени групи",
  },
};

const REGION_LABELS: Record<AppLanguage, Record<RegionKey, string>> = {
  en: {
    north: "North",
    south: "South",
    capital: "Capital",
    industry: "Industry Belt",
    border: "Borderline",
    coast: "Coast",
  },
  bg: {
    north: "Север",
    south: "Юг",
    capital: "Столица",
    industry: "Индустриален пояс",
    border: "Граница",
    coast: "Крайбрежие",
  },
};

const RISK_LABELS: Record<AppLanguage, Record<RiskLevel, string>> = {
  en: {
    Low: "Low",
    Medium: "Medium",
    High: "High",
  },
  bg: {
    Low: "Нисък",
    Medium: "Среден",
    High: "Висок",
  },
};

const CONFIDENCE_LABELS: Record<AppLanguage, Record<"High" | "Medium" | "Low", string>> = {
  en: {
    High: "High",
    Medium: "Medium",
    Low: "Low",
  },
  bg: {
    High: "Висока",
    Medium: "Средна",
    Low: "Ниска",
  },
};

const TIER_LABELS: Record<AppLanguage, Record<string, string>> = {
  en: {
    Strong: "Strong",
    Stable: "Stable",
    Unstable: "Unstable",
    Fragile: "Fragile",
    Critical: "Critical",
  },
  bg: {
    Strong: "Силна",
    Stable: "Стабилна",
    Unstable: "Нестабилна",
    Fragile: "Крехка",
    Critical: "Критична",
  },
};

const PRESSURE_LABELS: Record<AppLanguage, Record<string, string>> = {
  en: {
    Breaking: "Breaking",
    Hot: "Hot",
    Tense: "Tense",
    Calm: "Calm",
  },
  bg: {
    Breaking: "Критична",
    Hot: "Гореща",
    Tense: "Напрегната",
    Calm: "Спокойна",
  },
};

const DIRECTION_LABELS: Record<AppLanguage, Record<TrendDirection, string>> = {
  en: {
    up: "UP",
    down: "DOWN",
    flat: "FLAT",
  },
  bg: {
    up: "НАГОРЕ",
    down: "НАДОЛУ",
    flat: "БЕЗ ПРОМЯНА",
  },
};

const TURN_STAGE_LABELS: Record<AppLanguage, Record<TurnStage, string>> = {
  en: {
    crisis: "crisis",
    decision: "decision",
    resolution: "resolution",
    fallout: "fallout",
  },
  bg: {
    crisis: "криза",
    decision: "решение",
    resolution: "развръзка",
    fallout: "последствия",
  },
};

const BUILT_IN_SEED_NAMES_BG: Record<string, string> = {
  baseline: "Базов мандат",
  fragile: "Крехка коалиция",
  security: "Спирала на сигурността",
  banking: "Банкова паника",
};

const DOCTRINE_BG: Record<DoctrineId, { title: string; description: string }> = {
  technocrat: {
    title: "Технократ",
    description: "По-висока точност в планирането, по-слаба обществена легитимност.",
  },
  populist: {
    title: "Популист",
    description: "Силен обществен импулс и волатилност, по-слаба фискална дисциплина.",
  },
  militarist: {
    title: "Милитарист",
    description: "Силна сигурност, но растящо гражданско недоволство.",
  },
};

const POLICY_BG: Record<PolicyId, { title: string; description: string }> = {
  "emergency-powers-act": {
    title: "Закон за извънредни правомощия",
    description: "Централизация на властта. По-силен контрол, по-слаба легитимност.",
  },
  "central-bank-authority": {
    title: "Централизирана банкова власт",
    description: "Защита на финансовата система чрез строги контроли и ограничения.",
  },
  "civic-autonomy-charter": {
    title: "Харта за гражданска автономия",
    description: "Споделяне на властта с регионите. По-нисък натиск, по-слаба команда.",
  },
};

const ACTION_BG: Record<string, { title: string; description: string }> = {
  "intel-sweep": {
    title: "Разузнавателно прочистване",
    description: "Разкрий заплахите и повиши надеждността на прогнозите.",
  },
  "emergency-subsidy": {
    title: "Спешна субсидия",
    description: "Бързо овладяване на напрежението с скъпа социална помощ.",
  },
  "reserve-mobilization": {
    title: "Мобилизация на резерва",
    description: "Повишена готовност и възпиране с риск от по-късна реакция.",
  },
  "media-briefing": {
    title: "Медиен брифинг блиц",
    description: "Бързо оформяне на публичния разказ преди кризата да ескалира.",
  },
};

interface OptionTranslation {
  title: string;
  description: string;
  factionReaction?: string;
  delayedLabels?: Record<string, string>;
}

interface ScenarioTranslation {
  title: string;
  description: string;
  options: Record<string, OptionTranslation>;
}

const SCENARIO_BG: Record<string, ScenarioTranslation> = {
  "port-strike": {
    title: "Стачка на пристанищните работници",
    description: "Товарният трафик е блокиран. Резервите от храна и гориво намаляват.",
    options: {
      "negotiate-terms": {
        title: "Договаряне на заплатите",
        description: "Скъп компромис за стабилизиране на веригите за доставки.",
        factionReaction: "Банки +, Общество +, Армия неутрално",
      },
      "security-crackdown": {
        title: "Силов контрол",
        description: "Бързо възстановяване, но силен удар по легитимността.",
        factionReaction: "Армия ++, Общество --, Медийно възмущение",
        delayedLabels: {
          "Underground labor network forms": "Формира се нелегална трудова мрежа",
        },
      },
      "import-contractors": {
        title: "Внос на външни изпълнители",
        description: "Частично възстановяване с дългосрочен координационен риск.",
        factionReaction: "Банки +, Медии -, Общество -",
      },
    },
  },
  "intel-breach": {
    title: "Пробив в разузнаването",
    description: "Оперативни планове са изтекли. Съперниците тестват реакцията ви.",
    options: {
      "counter-operation": {
        title: "Контраоперация",
        description: "Бърз ответен удар и възстановяване на възпирането.",
      },
      "public-inquiry": {
        title: "Публично разследване",
        description: "По-бавен прозрачен отговор с печалба в легитимност.",
      },
      "bury-the-story": {
        title: "Потискане на историята",
        description: "Краткосрочно спокойствие с риск от скрит обратен ефект.",
        delayedLabels: {
          "Secondary leak wave": "Втора вълна от течове",
        },
      },
    },
  },
  "bank-run": {
    title: "Регионална банкова паника",
    description: "Вложителите паникьосано теглят средства. Ликвидността е под натиск.",
    options: {
      "guarantee-deposits": {
        title: "Гарантиране на депозитите",
        description: "Стабилизиране на доверието на висока фискална цена.",
        delayedLabels: {
          "Inflation spike": "Инфлационен скок",
        },
      },
      "freeze-transfers": {
        title: "Замразяване на големи преводи",
        description: "Ограничаване на изтичането със силови мерки; гневът е вероятен.",
        delayedLabels: {
          "Black market expansion": "Разрастване на черния пазар",
        },
      },
      "force-mergers": {
        title: "Принудителни спешни сливания",
        description: "Технократско овладяване с елитен отпор.",
      },
    },
  },
  "border-raid": {
    title: "Сигнал за граничен рейд",
    description: "Враждебните действия ескалират по границата.",
    options: {
      "full-mobilization": {
        title: "Пълна мобилизация",
        description: "Максимална готовност срещу висока социална и бюджетна цена.",
      },
      "precision-response": {
        title: "Точен отговор",
        description: "Таргетирано възпиране с ограничен съпътстващ риск.",
      },
      "demand-talks": {
        title: "Искане за преговори",
        description: "Опит за деескалация, който може да се изтълкува като слабост.",
      },
    },
  },
  "cyber-blackout": {
    title: "Кибер срив на мрежата",
    description: "Платежната и енергийната инфраструктура е нестабилна.",
    options: {
      "offline-protocol": {
        title: "Активирай офлайн протокол",
        description: "Стабилизиране на основните услуги с по-нисък капацитет.",
      },
      "foreign-security-firm": {
        title: "Наемане на чужда фирма",
        description: "Бързо възстановяване с риск за суверенитета.",
      },
      "domestic-taskforce": {
        title: "Създаване на местен щаб",
        description: "По-бавна краткосрочна реакция, по-силен дългосрочен капацитет.",
      },
    },
  },
  "election-shock": {
    title: "Шок от предсрочни избори",
    description: "Правно решение ускорява изборите и разклаща коалицията.",
    options: {
      "campaign-mode": {
        title: "Премини в предизборен режим",
        description: "Консолидация на базата и отлагане на болезнени реформи.",
      },
      "hard-reforms": {
        title: "Наложи тежки реформи",
        description: "Подобрен фискален хоризонт срещу силен обществен натиск.",
        delayedLabels: {
          "Regional protest wave": "Вълна от регионални протести",
        },
      },
      "unity-cabinet": {
        title: "Формиране на кабинет на единството",
        description: "Намаляване на поляризацията с цената на по-слаб контрол.",
      },
    },
  },
};

export function getStatLabel(key: StatKey, language: AppLanguage) {
  return STAT_LABELS[language][key];
}

export function getResourceLabel(key: ResourceKey, language: AppLanguage) {
  return RESOURCE_LABELS[language][key];
}

export function getActorLabel(key: ActorKey, language: AppLanguage) {
  return ACTOR_LABELS[language][key];
}

export function getRegionLabel(key: RegionKey, language: AppLanguage) {
  return REGION_LABELS[language][key];
}

export function getRiskLabel(risk: RiskLevel, language: AppLanguage) {
  return RISK_LABELS[language][risk];
}

export function getConfidenceLabel(confidence: "High" | "Medium" | "Low", language: AppLanguage) {
  return CONFIDENCE_LABELS[language][confidence];
}

export function getTierLabel(label: string, language: AppLanguage) {
  return TIER_LABELS[language][label] ?? label;
}

export function getPressureLabel(label: string, language: AppLanguage) {
  return PRESSURE_LABELS[language][label] ?? label;
}

export function getDirectionLabel(direction: TrendDirection, language: AppLanguage) {
  return DIRECTION_LABELS[language][direction];
}

export function getMomentumLabel(momentum: TrendMomentum, language: AppLanguage) {
  if (!momentum) {
    return "";
  }
  if (language === "bg") {
    return "ускорява се";
  }
  return momentum;
}

export function getTurnStageLabel(stage: TurnStage, language: AppLanguage) {
  return TURN_STAGE_LABELS[language][stage];
}

export function localizeDemoSeed(seed: DemoSeed, language: AppLanguage): DemoSeed {
  if (language !== "bg" || !BUILT_IN_SEED_NAMES_BG[seed.id]) {
    return seed;
  }
  return { ...seed, name: BUILT_IN_SEED_NAMES_BG[seed.id] };
}

export function localizeDoctrine(doctrine: Doctrine, language: AppLanguage): Doctrine {
  if (language !== "bg") {
    return doctrine;
  }
  const translation = DOCTRINE_BG[doctrine.id];
  return translation ? { ...doctrine, ...translation } : doctrine;
}

export function localizePolicy(policy: PolicyCommitment, language: AppLanguage): PolicyCommitment {
  if (language !== "bg") {
    return policy;
  }
  const translation = POLICY_BG[policy.id];
  return translation ? { ...policy, ...translation } : policy;
}

export function localizeStrategicAction(
  action: StrategicAction,
  language: AppLanguage,
): StrategicAction {
  if (language !== "bg") {
    return action;
  }
  const translation = ACTION_BG[action.id];
  return translation ? { ...action, ...translation } : action;
}

function localizeDelayedLabel(
  label: string,
  optionTranslation: OptionTranslation | undefined,
  language: AppLanguage,
) {
  if (language !== "bg" || !optionTranslation?.delayedLabels) {
    return label;
  }
  return optionTranslation.delayedLabels[label] ?? label;
}

export function localizeScenario(scenario: Scenario, language: AppLanguage): Scenario {
  if (language !== "bg") {
    return scenario;
  }

  const translation = SCENARIO_BG[scenario.id];
  if (!translation) {
    return scenario;
  }

  return {
    ...scenario,
    title: translation.title,
    description: translation.description,
    options: scenario.options.map((option) => {
      const optionTranslation = translation.options[option.id];
      return {
        ...option,
        title: optionTranslation?.title ?? option.title,
        description: optionTranslation?.description ?? option.description,
        factionReaction: optionTranslation?.factionReaction ?? option.factionReaction,
        delayed: option.delayed?.map((entry) => ({
          ...entry,
          label: localizeDelayedLabel(entry.label, optionTranslation, language),
        })),
      };
    }),
  };
}
