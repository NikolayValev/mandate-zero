import type {
  ActorKey,
  DemoSeed,
  Doctrine,
  PolicyCommitment,
  RegionKey,
  ResourceKey,
  Scenario,
  StatKey,
  StrategicAction,
} from "./types";

export const DEFAULT_SEED = "demo-seed-001";
export const RUN_STORAGE_KEY = "mandate-zero-local-run-v2";
export const CUSTOM_SEEDS_STORAGE_KEY = "mandate-zero-local-seeds-v2";

export const STAT_META: Array<{ key: StatKey; label: string }> = [
  { key: "stability", label: "Stability" },
  { key: "treasury", label: "Treasury" },
  { key: "influence", label: "Influence" },
  { key: "security", label: "Security" },
  { key: "trust", label: "Public Trust" },
];

export const RESOURCE_META: Array<{ key: ResourceKey; label: string }> = [
  { key: "intel", label: "Intel" },
  { key: "supplies", label: "Supplies" },
  { key: "capital", label: "Political Capital" },
];

export const ACTOR_META: Array<{ key: ActorKey; label: string }> = [
  { key: "banks", label: "Banks" },
  { key: "military", label: "Military" },
  { key: "media", label: "Media" },
  { key: "public", label: "Public Factions" },
];

export const REGION_META: Array<{ key: RegionKey; label: string }> = [
  { key: "north", label: "North" },
  { key: "south", label: "South" },
  { key: "capital", label: "Capital" },
  { key: "industry", label: "Industry Belt" },
  { key: "border", label: "Borderline" },
  { key: "coast", label: "Coast" },
];

export const BUILT_IN_DEMO_SEEDS: DemoSeed[] = [
  { id: "baseline", name: "Baseline Mandate", value: DEFAULT_SEED },
  { id: "fragile", name: "Fragile Coalition", value: "fragile-coalition-204" },
  { id: "security", name: "Security Spiral", value: "security-spiral-77" },
  { id: "banking", name: "Bank Panic", value: "bank-panic-612" },
];

export const DOCTRINES: Doctrine[] = [
  {
    id: "technocrat",
    title: "Technocrat",
    description: "Higher planning accuracy, weaker grassroots legitimacy.",
    uncertaintyShift: -1,
    securityTrustPenalty: 2,
    startEffects: {
      statEffects: { treasury: 6, influence: 3, trust: -5 },
      resourceEffects: { intel: 4, capital: 2 },
      actorEffects: {
        banks: { loyalty: 5, pressure: -2 },
        public: { loyalty: -3, pressure: 4 },
      },
    },
  },
  {
    id: "populist",
    title: "Populist",
    description: "Public momentum and volatility, weaker fiscal discipline.",
    uncertaintyShift: 1,
    securityTrustPenalty: 3,
    startEffects: {
      statEffects: { trust: 8, stability: 3, treasury: -6 },
      resourceEffects: { capital: 3 },
      actorEffects: {
        public: { loyalty: 8, pressure: -4 },
        media: { pressure: 3 },
      },
    },
  },
  {
    id: "militarist",
    title: "Militarist",
    description: "Strong security posture, rising civil resentment.",
    uncertaintyShift: 0,
    securityTrustPenalty: 1,
    startEffects: {
      statEffects: { security: 9, influence: 2, trust: -6 },
      resourceEffects: { supplies: 3, intel: 1 },
      actorEffects: {
        military: { loyalty: 10, pressure: -3 },
        public: { pressure: 5 },
      },
    },
  },
];

export const POLICIES: PolicyCommitment[] = [
  {
    id: "emergency-powers-act",
    title: "Emergency Powers Act",
    description: "Centralize authority. Stronger control, weaker legitimacy.",
    apCost: 1,
    capitalCost: 2,
    maxActionPointBonus: 1,
    immediate: {
      statEffects: { security: 5, trust: -5 },
      actorEffects: {
        military: { loyalty: 4 },
        public: { pressure: 5 },
        media: { pressure: 3 },
      },
      coupRisk: 5,
    },
    passive: {
      statEffects: { security: 1, trust: -1 },
      actorEffects: { military: { loyalty: 1 }, public: { pressure: 1 } },
    },
  },
  {
    id: "central-bank-authority",
    title: "Central Banking Authority",
    description: "Protect financial system with strict controls and austerity.",
    apCost: 1,
    capitalCost: 2,
    immediate: {
      statEffects: { treasury: 6, trust: -2 },
      actorEffects: {
        banks: { loyalty: 7, pressure: -4 },
        public: { pressure: 3 },
      },
    },
    passive: {
      statEffects: { treasury: 1, stability: -1 },
      actorEffects: { banks: { loyalty: 1 }, public: { pressure: 1 } },
    },
  },
  {
    id: "civic-autonomy-charter",
    title: "Civic Autonomy Charter",
    description: "Share power with regions. Lower pressure, weaker command.",
    apCost: 1,
    capitalCost: 2,
    immediate: {
      statEffects: { trust: 6, stability: 3, security: -3 },
      actorEffects: {
        public: { loyalty: 5, pressure: -4 },
        media: { loyalty: 2 },
      },
    },
    passive: {
      statEffects: { trust: 1, security: -1 },
      actorEffects: { public: { pressure: -1 }, media: { loyalty: 1 } },
    },
  },
];

export const STRATEGIC_ACTIONS: StrategicAction[] = [
  {
    id: "intel-sweep",
    title: "Intel Sweep",
    description: "Reveal threats and increase confidence in projections.",
    apCost: 1,
    cooldown: 2,
    risk: "Low",
    resourceCost: { supplies: 1 },
    effects: {
      statEffects: { security: 2, influence: 1 },
      resourceEffects: { intel: 5 },
      actorEffects: { media: { pressure: -2 } },
    },
  },
  {
    id: "emergency-subsidy",
    title: "Emergency Subsidy",
    description: "Buffer unrest quickly with expensive social relief.",
    apCost: 1,
    cooldown: 2,
    risk: "Medium",
    resourceCost: { capital: 3 },
    effects: {
      statEffects: { trust: 7, stability: 4, treasury: -7 },
      actorEffects: {
        public: { loyalty: 4, pressure: -3 },
        banks: { pressure: 2 },
      },
    },
  },
  {
    id: "reserve-mobilization",
    title: "Reserve Mobilization",
    description: "Boost readiness and deterrence with long-term backlash.",
    apCost: 1,
    cooldown: 3,
    risk: "High",
    resourceCost: { supplies: 2 },
    effects: {
      statEffects: { security: 8, trust: -4, stability: 1 },
      actorEffects: {
        military: { loyalty: 5 },
        public: { pressure: 4 },
      },
    },
  },
  {
    id: "media-briefing",
    title: "Media Briefing Blitz",
    description: "Shape narrative quickly before the crisis spiral.",
    apCost: 1,
    cooldown: 2,
    risk: "Medium",
    resourceCost: { capital: 1 },
    effects: {
      statEffects: { influence: 4, trust: 2 },
      actorEffects: { media: { loyalty: 5, pressure: -3 } },
    },
  },
];
export const SCENARIOS: Scenario[] = [
  {
    id: "port-strike",
    title: "Port Worker Strike",
    description:
      "Cargo traffic is blocked. Food and fuel buffers are thinning in two regions.",
    severity: 3,
    regionTargets: ["coast", "industry"],
    options: [
      {
        id: "negotiate-terms",
        title: "Negotiate Wage Settlement",
        description: "Costly compromise to stabilize supply chains.",
        risk: "Medium",
        factionReaction: "Banks +, Public +, Military neutral",
        spread: 1,
        statEffects: { stability: 5, trust: 7, treasury: -7 },
        actorEffects: {
          banks: { pressure: 2 },
          public: { loyalty: 3, pressure: -3 },
        },
      },
      {
        id: "security-crackdown",
        title: "Security Crackdown",
        description: "Immediate throughput recovery, sharp legitimacy hit.",
        risk: "High",
        factionReaction: "Military ++, Public --, Media outrage",
        spread: 2,
        statEffects: { security: 8, stability: 2, trust: -10, influence: -2 },
        actorEffects: {
          military: { loyalty: 4 },
          media: { pressure: 5 },
          public: { pressure: 6 },
        },
        delayed: [
          {
            label: "Underground labor network forms",
            chance: 0.45,
            delayMin: 2,
            delayMax: 3,
            effects: {
              statEffects: { stability: -4, trust: -3 },
              actorEffects: { public: { pressure: 4 } },
            },
          },
        ],
      },
      {
        id: "import-contractors",
        title: "Import External Contractors",
        description: "Partial recovery with long-term coordination risk.",
        risk: "Medium",
        factionReaction: "Banks +, Media -, Public -",
        spread: 2,
        statEffects: { treasury: -5, stability: 2, influence: 3, trust: -4 },
        actorEffects: {
          banks: { loyalty: 2 },
          media: { pressure: 2 },
        },
      },
    ],
  },
  {
    id: "intel-breach",
    title: "Intelligence Breach",
    description:
      "Operational plans leaked overnight. Rival blocs are testing your response speed.",
    severity: 4,
    regionTargets: ["capital", "border"],
    options: [
      {
        id: "counter-operation",
        title: "Counter-Operation",
        description: "Retaliate fast and rebuild deterrence.",
        risk: "High",
        factionReaction: "Military +, Media -, Public uncertain",
        spread: 2,
        statEffects: { security: 9, influence: 4, treasury: -5, trust: -4 },
        actorEffects: {
          military: { loyalty: 3 },
          media: { pressure: 3 },
        },
      },
      {
        id: "public-inquiry",
        title: "Public Inquiry",
        description: "Slow transparent response with legitimacy upside.",
        risk: "Low",
        factionReaction: "Public ++, Banks neutral, Military -",
        spread: 1,
        statEffects: { trust: 8, stability: 4, influence: -3 },
        actorEffects: {
          public: { loyalty: 4, pressure: -2 },
          military: { pressure: 2 },
        },
      },
      {
        id: "bury-the-story",
        title: "Suppress the Story",
        description: "Short-term calm with hidden blowback risk.",
        risk: "High",
        factionReaction: "Media --, Public --, Banks neutral",
        spread: 2,
        statEffects: { stability: 5, influence: 2, trust: -8 },
        actorEffects: { media: { pressure: 6 }, public: { pressure: 3 } },
        delayed: [
          {
            label: "Secondary leak wave",
            chance: 0.5,
            delayMin: 2,
            delayMax: 2,
            effects: {
              statEffects: { trust: -5, influence: -3 },
              actorEffects: { media: { pressure: 4 } },
              coupRisk: 4,
            },
          },
        ],
      },
    ],
  },
  {
    id: "bank-run",
    title: "Regional Bank Run",
    description:
      "Depositors are panicking. Liquidity lines are close to seizure in urban corridors.",
    severity: 5,
    regionTargets: ["capital", "coast", "industry"],
    options: [
      {
        id: "guarantee-deposits",
        title: "Guarantee Deposits",
        description: "Stabilize confidence at major fiscal cost.",
        risk: "Medium",
        factionReaction: "Public +, Banks +, Inflation risk rises",
        spread: 1,
        statEffects: { trust: 8, stability: 6, treasury: -11 },
        actorEffects: {
          banks: { loyalty: 5, pressure: -4 },
          public: { pressure: -2 },
        },
        delayed: [
          {
            label: "Inflation spike",
            chance: 0.55,
            delayMin: 2,
            delayMax: 3,
            effects: {
              statEffects: { trust: -6, stability: -4, treasury: -2 },
              actorEffects: { public: { pressure: 5 } },
            },
          },
        ],
      },
      {
        id: "freeze-transfers",
        title: "Freeze Large Transfers",
        description: "Contain outflows by force; public anger is likely.",
        risk: "High",
        factionReaction: "Banks +, Public --, Media --",
        spread: 3,
        statEffects: { treasury: 5, security: 3, trust: -10, influence: -3 },
        actorEffects: {
          banks: { loyalty: 4 },
          public: { pressure: 7 },
          media: { pressure: 4 },
        },
        delayed: [
          {
            label: "Black market expansion",
            chance: 0.6,
            delayMin: 2,
            delayMax: 4,
            effects: {
              statEffects: { security: -4, treasury: -3, trust: -3 },
              coupRisk: 5,
            },
          },
        ],
      },
      {
        id: "force-mergers",
        title: "Force Emergency Mergers",
        description: "Technocratic containment with elite backlash.",
        risk: "Medium",
        factionReaction: "Banks -, Media -, Public neutral",
        spread: 2,
        statEffects: { stability: 6, treasury: -3, influence: 4, trust: -2 },
        actorEffects: {
          banks: { pressure: 4 },
          media: { pressure: 2 },
        },
      },
    ],
  },
  {
    id: "border-raid",
    title: "Border Raid Alert",
    description:
      "Hostile probes are escalating at the frontier. Local command requests authority.",
    severity: 4,
    regionTargets: ["border", "north"],
    options: [
      {
        id: "full-mobilization",
        title: "Full Mobilization",
        description: "Max readiness at high social and fiscal cost.",
        risk: "High",
        factionReaction: "Military ++, Public -, Banks -",
        spread: 1,
        statEffects: { security: 11, stability: 3, treasury: -8, trust: -4 },
        actorEffects: {
          military: { loyalty: 6 },
          public: { pressure: 4 },
        },
      },
      {
        id: "precision-response",
        title: "Precision Response",
        description: "Targeted deterrence with controlled collateral risk.",
        risk: "Medium",
        factionReaction: "Military +, Media neutral, Public -",
        spread: 2,
        statEffects: { security: 7, influence: 4, treasury: -4, trust: -2 },
        actorEffects: { military: { loyalty: 3 }, public: { pressure: 2 } },
      },
      {
        id: "demand-talks",
        title: "Demand Talks",
        description: "De-escalation attempt that may be read as weakness.",
        risk: "Medium",
        factionReaction: "Public +, Military -, Media split",
        spread: 3,
        statEffects: { trust: 4, treasury: -2, stability: -3, security: -4 },
        actorEffects: {
          military: { pressure: 4 },
          public: { loyalty: 2 },
        },
      },
    ],
  },
  {
    id: "cyber-blackout",
    title: "Cyber Grid Blackout",
    description:
      "Payment rails and utilities are unstable across multiple districts.",
    severity: 4,
    regionTargets: ["capital", "industry", "south"],
    options: [
      {
        id: "offline-protocol",
        title: "Activate Offline Protocol",
        description: "Stabilize essentials while sacrificing throughput.",
        risk: "Low",
        factionReaction: "Public +, Banks -, Media neutral",
        spread: 2,
        statEffects: { stability: 5, trust: 3, treasury: -4 },
        actorEffects: { public: { pressure: -2 }, banks: { pressure: 2 } },
      },
      {
        id: "foreign-security-firm",
        title: "Hire Foreign Security Firm",
        description: "Fast patching with sovereignty backlash risk.",
        risk: "High",
        factionReaction: "Banks +, Public -, Media -",
        spread: 1,
        statEffects: { security: 8, influence: -4, trust: -3, treasury: -6 },
        actorEffects: {
          banks: { loyalty: 2 },
          public: { pressure: 3 },
          media: { pressure: 3 },
        },
      },
      {
        id: "domestic-taskforce",
        title: "Build Domestic Taskforce",
        description: "Slower short-term response, stronger long-term capacity.",
        risk: "Medium",
        factionReaction: "Public +, Military +, Banks neutral",
        spread: 2,
        statEffects: { security: 5, influence: 5, stability: 2, treasury: -2 },
        resourceEffects: { intel: 3 },
        actorEffects: { military: { loyalty: 2 }, public: { loyalty: 2 } },
      },
    ],
  },
  {
    id: "election-shock",
    title: "Snap Election Shock",
    description:
      "A legal ruling accelerates elections and fractures coalition discipline.",
    severity: 3,
    regionTargets: ["capital", "south"],
    options: [
      {
        id: "campaign-mode",
        title: "Switch to Campaign Mode",
        description: "Consolidate base support and defer painful reforms.",
        risk: "Medium",
        factionReaction: "Public +, Media +, Banks -",
        spread: 2,
        statEffects: { trust: 7, influence: 6, treasury: -4, stability: -2 },
        actorEffects: {
          public: { loyalty: 3 },
          media: { loyalty: 2 },
          banks: { pressure: 2 },
        },
      },
      {
        id: "hard-reforms",
        title: "Force Hard Reforms",
        description: "Improve fiscal runway while inflaming social pressure.",
        risk: "High",
        factionReaction: "Banks +, Public --, Media -",
        spread: 3,
        statEffects: { treasury: 7, stability: 3, trust: -8, influence: -2 },
        actorEffects: {
          banks: { loyalty: 3 },
          public: { pressure: 6 },
        },
        delayed: [
          {
            label: "Regional protest wave",
            chance: 0.5,
            delayMin: 2,
            delayMax: 3,
            effects: {
              statEffects: { stability: -5, trust: -4 },
              actorEffects: { public: { pressure: 5 } },
              coupRisk: 4,
            },
          },
        ],
      },
      {
        id: "unity-cabinet",
        title: "Form Unity Cabinet",
        description: "Reduce polarization while sacrificing agenda control.",
        risk: "Low",
        factionReaction: "Public +, Media neutral, Military -",
        spread: 1,
        statEffects: { stability: 8, trust: 5, influence: -7 },
        actorEffects: {
          public: { loyalty: 3, pressure: -2 },
          military: { pressure: 2 },
        },
      },
    ],
  },
];
