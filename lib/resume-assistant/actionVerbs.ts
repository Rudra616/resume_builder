/**
 * Local action verb library. Suggestions are drawn from the category that best
 * matches what the user already wrote, so the advice stays contextual instead of
 * dumping a generic word list.
 */
export type VerbCategory =
  | "development"
  | "leadership"
  | "improvement"
  | "research"
  | "design"
  | "delivery"
  | "communication";

export const ACTION_VERBS: Record<VerbCategory, string[]> = {
  development: [
    "Developed",
    "Implemented",
    "Engineered",
    "Built",
    "Integrated",
    "Automated",
    "Optimized",
    "Refactored",
    "Migrated",
    "Deployed",
  ],
  leadership: [
    "Led",
    "Managed",
    "Coordinated",
    "Mentored",
    "Directed",
    "Owned",
    "Championed",
    "Supervised",
  ],
  improvement: [
    "Improved",
    "Enhanced",
    "Optimized",
    "Reduced",
    "Streamlined",
    "Simplified",
    "Consolidated",
    "Stabilised",
  ],
  research: [
    "Analyzed",
    "Investigated",
    "Evaluated",
    "Researched",
    "Benchmarked",
    "Diagnosed",
    "Audited",
  ],
  design: [
    "Designed",
    "Created",
    "Prototyped",
    "Architected",
    "Modelled",
    "Illustrated",
    "Storyboarded",
  ],
  delivery: [
    "Delivered",
    "Launched",
    "Shipped",
    "Released",
    "Rolled out",
    "Completed",
    "Executed",
  ],
  communication: [
    "Presented",
    "Documented",
    "Facilitated",
    "Trained",
    "Advised",
    "Negotiated",
    "Reported",
  ],
};

const CATEGORY_HINTS: Array<{ category: VerbCategory; test: RegExp }> = [
  {
    category: "development",
    test: /\b(code|coded|coding|app|application|api|feature|module|component|website|backend|frontend|database|script|pipeline|service|integration|bug|fix|library|framework|sdk)\b/i,
  },
  {
    category: "leadership",
    test: /\b(team|junior|intern|people|hiring|mentor|stakeholder|report|squad|onboard|delegat|manage)\b/i,
  },
  {
    category: "improvement",
    test: /\b(performance|speed|load|latency|cost|efficien|refactor|cleanup|technical debt|process|workflow|reduce|faster)\b/i,
  },
  {
    category: "research",
    test: /\b(research|study|analysis|analytics|data|metric|report|survey|investigat|root cause|experiment|a\/b)\b/i,
  },
  {
    category: "design",
    test: /\b(design|ui|ux|wireframe|mockup|prototype|brand|layout|figma|illustration|typography|visual)\b/i,
  },
  {
    category: "delivery",
    test: /\b(launch|release|ship|deadline|milestone|deliver|rollout|go.?live|store|production)\b/i,
  },
  {
    category: "communication",
    test: /\b(present|document|training|workshop|client|customer|meeting|communicat|proposal|demo)\b/i,
  },
];

/** Picks the verb category that best fits the content of a bullet. */
export function categoriseContext(text: string): VerbCategory {
  let best: { category: VerbCategory; score: number } = {
    category: "development",
    score: 0,
  };

  for (const hint of CATEGORY_HINTS) {
    const matches = text.match(new RegExp(hint.test.source, "gi"));
    const score = matches ? matches.length : 0;
    if (score > best.score) best = { category: hint.category, score };
  }

  return best.category;
}

export function suggestVerbs(text: string, count = 4): string[] {
  return ACTION_VERBS[categoriseContext(text)].slice(0, count);
}

/** Every verb in the library, lowercased, for "does this bullet start strong?". */
export const ALL_ACTION_VERBS = new Set(
  Object.values(ACTION_VERBS)
    .flat()
    .map((verb) => verb.toLowerCase()),
);

/** Additional strong verbs accepted as bullet openers. */
export const EXTRA_STRONG_VERBS = new Set([
  "achieved",
  "accelerated",
  "acquired",
  "adapted",
  "administered",
  "advocated",
  "aligned",
  "assembled",
  "authored",
  "balanced",
  "boosted",
  "briefed",
  "budgeted",
  "chaired",
  "clarified",
  "collaborated",
  "compiled",
  "composed",
  "conducted",
  "configured",
  "constructed",
  "converted",
  "cultivated",
  "customised",
  "customized",
  "debugged",
  "decreased",
  "defined",
  "delegated",
  "demonstrated",
  "devised",
  "distributed",
  "doubled",
  "drove",
  "eliminated",
  "enabled",
  "established",
  "exceeded",
  "expanded",
  "expedited",
  "extended",
  "forecast",
  "formalised",
  "formulated",
  "founded",
  "generated",
  "guided",
  "hosted",
  "identified",
  "increased",
  "influenced",
  "informed",
  "initiated",
  "innovated",
  "inspected",
  "installed",
  "instituted",
  "instructed",
  "introduced",
  "maintained",
  "mapped",
  "marketed",
  "maximised",
  "measured",
  "minimised",
  "modernised",
  "modernized",
  "monitored",
  "motivated",
  "navigated",
  "orchestrated",
  "organised",
  "organized",
  "overhauled",
  "oversaw",
  "partnered",
  "performed",
  "pioneered",
  "planned",
  "prepared",
  "prioritised",
  "prioritized",
  "produced",
  "programmed",
  "promoted",
  "proposed",
  "provisioned",
  "published",
  "recovered",
  "recruited",
  "redesigned",
  "reduced",
  "reengineered",
  "reinforced",
  "remodelled",
  "reorganised",
  "resolved",
  "restored",
  "restructured",
  "revamped",
  "reviewed",
  "revised",
  "scaled",
  "scoped",
  "secured",
  "selected",
  "separated",
  "served",
  "set up",
  "simplified",
  "solved",
  "sourced",
  "spearheaded",
  "specified",
  "standardised",
  "standardized",
  "steered",
  "strengthened",
  "structured",
  "succeeded",
  "surpassed",
  "surveyed",
  "sustained",
  "synthesised",
  "targeted",
  "taught",
  "tested",
  "tracked",
  "transformed",
  "translated",
  "tripled",
  "unified",
  "upgraded",
  "validated",
  "verified",
  "won",
  "wrote",
]);

export function startsWithStrongVerb(text: string): boolean {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (!first) return false;
  return ALL_ACTION_VERBS.has(first) || EXTRA_STRONG_VERBS.has(first);
}
