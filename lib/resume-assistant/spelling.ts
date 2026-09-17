import { TECHNOLOGY_CANONICAL } from "@/lib/resume-assistant/technologyNormalization";

/**
 * Spell checking runs entirely in the browser against a curated dictionary of
 * misspellings that actually show up on resumes. Nothing is sent to a spelling
 * service, so no architecture documentation about third-party data flow is
 * needed — there is no third party.
 *
 * A full dictionary-based checker would need a multi-megabyte word list and
 * would flag every proper noun and acronym on a technical resume. Targeting
 * known errors keeps the signal high and the false-positive rate near zero.
 */
const MISSPELLINGS: Record<string, string> = {
  // Verb forms seen constantly in experience bullets
  developt: "developed",
  develeped: "developed",
  devloped: "developed",
  devoloped: "developed",
  develped: "developed",
  developped: "developed",
  develop: "develop",
  implmented: "implemented",
  implemeted: "implemented",
  impelmented: "implemented",
  implimented: "implemented",
  mantained: "maintained",
  maintaned: "maintained",
  maintianed: "maintained",
  mainained: "maintained",
  colaborated: "collaborated",
  collaberated: "collaborated",
  collabrated: "collaborated",
  cordinated: "coordinated",
  coordniated: "coordinated",
  manged: "managed",
  managd: "managed",
  desgined: "designed",
  desinged: "designed",
  desiged: "designed",
  optimzed: "optimized",
  optmized: "optimized",
  optimised: "optimised",
  intergrated: "integrated",
  integated: "integrated",
  deployd: "deployed",
  deploied: "deployed",
  acheived: "achieved",
  achived: "achieved",
  acheive: "achieve",
  recieved: "received",
  recieve: "receive",
  delivred: "delivered",
  deliverd: "delivered",
  buit: "built",
  bulit: "built",
  writen: "written",
  wroted: "wrote",
  lead: "led",
  learnt: "learned",
  analyed: "analysed",
  analyzd: "analyzed",
  analysing: "analysing",
  trainned: "trained",
  troubleshooted: "troubleshot",
  refactered: "refactored",
  refacored: "refactored",
  migated: "migrated",
  migrted: "migrated",
  automted: "automated",
  automatd: "automated",
  suported: "supported",
  supportted: "supported",
  presnted: "presented",
  reveiwed: "reviewed",
  reviwed: "reviewed",
  tesed: "tested",
  documeted: "documented",
  documnted: "documented",

  // Nouns and adjectives
  responsibile: "responsible",
  responsable: "responsible",
  responsiblity: "responsibility",
  responsibilty: "responsibility",
  responsibilites: "responsibilities",
  responsiblities: "responsibilities",
  experiance: "experience",
  experence: "experience",
  expirience: "experience",
  experianced: "experienced",
  knowlege: "knowledge",
  knowldge: "knowledge",
  knowledgable: "knowledgeable",
  managment: "management",
  managament: "management",
  enviroment: "environment",
  envirnment: "environment",
  environnement: "environment",
  developement: "development",
  devlopment: "development",
  developmemt: "development",
  requirment: "requirement",
  requirements: "requirements",
  requirments: "requirements",
  perfomance: "performance",
  performace: "performance",
  performence: "performance",
  efficency: "efficiency",
  efficiancy: "efficiency",
  productivty: "productivity",
  comunication: "communication",
  communiction: "communication",
  comunicate: "communicate",
  collaberation: "collaboration",
  colaboration: "collaboration",
  proffesional: "professional",
  professionnal: "professional",
  profesional: "professional",
  aplication: "application",
  applicaton: "application",
  aplications: "applications",
  applicatons: "applications",
  architechture: "architecture",
  architecure: "architecture",
  buisness: "business",
  bussiness: "business",
  ocurred: "occurred",
  occured: "occurred",
  seperate: "separate",
  seperated: "separated",
  seperately: "separately",
  definately: "definitely",
  succesful: "successful",
  successfull: "successful",
  succesfully: "successfully",
  sucessfully: "successfully",
  acomplished: "accomplished",
  accomplishd: "accomplished",
  achievment: "achievement",
  achievements: "achievements",
  achievemnts: "achievements",
  independant: "independent",
  independantly: "independently",
  liason: "liaison",
  reccommend: "recommend",
  recomend: "recommend",
  recomended: "recommended",
  reccomended: "recommended",
  relevent: "relevant",
  goverment: "government",
  ammount: "amount",
  begining: "beginning",
  calender: "calendar",
  catagory: "category",
  cheif: "chief",
  commited: "committed",
  commitee: "committee",
  compatable: "compatible",
  competetive: "competitive",
  concious: "conscious",
  consistant: "consistent",
  costumer: "customer",
  criticial: "critical",
  decison: "decision",
  dependancy: "dependency",
  dependant: "dependent",
  detials: "details",
  diffrent: "different",
  dilemna: "dilemma",
  embeded: "embedded",
  excelent: "excellent",
  exellent: "excellent",
  existance: "existence",
  familar: "familiar",
  finaly: "finally",
  flexable: "flexible",
  fulfil: "fulfil",
  garantee: "guarantee",
  gaurantee: "guarantee",
  hierachy: "hierarchy",
  hierarcy: "hierarchy",
  immediatly: "immediately",
  improvment: "improvement",
  inital: "initial",
  initate: "initiate",
  intergration: "integration",
  intrest: "interest",
  labratory: "laboratory",
  langauge: "language",
  languague: "language",
  lenght: "length",
  liscense: "license",
  maintainance: "maintenance",
  maintenence: "maintenance",
  mantainance: "maintenance",
  mispell: "misspell",
  neccessary: "necessary",
  necesary: "necessary",
  noticable: "noticeable",
  ocassion: "occasion",
  oppurtunity: "opportunity",
  opportunty: "opportunity",
  paticular: "particular",
  persue: "pursue",
  posession: "possession",
  possiblity: "possibility",
  practicle: "practical",
  preformed: "performed",
  privelege: "privilege",
  probaly: "probably",
  proceedure: "procedure",
  proffesion: "profession",
  quailty: "quality",
  qualtiy: "quality",
  recepient: "recipient",
  refering: "referring",
  reguarding: "regarding",
  remeber: "remember",
  reserch: "research",
  rythm: "rhythm",
  scedule: "schedule",
  sceduling: "scheduling",
  sicnerely: "sincerely",
  simular: "similar",
  strategys: "strategies",
  stategy: "strategy",
  suprised: "surprised",
  techinical: "technical",
  techncial: "technical",
  tecnical: "technical",
  temperature: "temperature",
  thier: "their",
  threshhold: "threshold",
  throughly: "thoroughly",
  tommorow: "tomorrow",
  truely: "truly",
  unfortunatly: "unfortunately",
  untill: "until",
  usualy: "usually",
  vaild: "valid",
  varius: "various",
  verison: "version",
  visable: "visible",
  wich: "which",
  wierd: "weird",
  writting: "writing",
  wrting: "writing",
  yeild: "yield",

  // Technology names misspelled rather than just miscased
  javasript: "JavaScript",
  javascrip: "JavaScript",
  javscript: "JavaScript",
  typscript: "TypeScript",
  typescrip: "TypeScript",
  pyhton: "Python",
  pyton: "Python",
  reactjs: "React",
  reacts: "React",
  angulr: "Angular",
  postgres: "PostgreSQL",
  postgersql: "PostgreSQL",
  mongodb: "MongoDB",
  mysqul: "MySQL",
  kubernets: "Kubernetes",
  kubernetes: "Kubernetes",
  docekr: "Docker",
  jenkis: "Jenkins",
  githib: "GitHub",
  gitub: "GitHub",
  linkdin: "LinkedIn",
  linkedln: "LinkedIn",
  linkedin: "LinkedIn",
  tailwing: "Tailwind CSS",
  bootstarp: "Bootstrap",
  firebse: "Firebase",
  gaphql: "GraphQL",
  grapql: "GraphQL",
};

/** Words that look wrong to a naive checker but are correct on resumes. */
const ALLOWED = new Set<string>([
  ...Object.values(TECHNOLOGY_CANONICAL).map((value) => value.toLowerCase()),
  "apis",
  "backend",
  "frontend",
  "fullstack",
  "onboarding",
  "offboarding",
  "roadmap",
  "stakeholder",
  "stakeholders",
  "upskilling",
  "reskilling",
  "microservice",
  "microservices",
  "serverless",
  "scalable",
  "scalability",
  "observability",
  "async",
  "cross-functional",
  "end-to-end",
  "go-to-market",
]);

export type SpellingIssueKind = "misspelling" | "repeated-word" | "spacing";

export interface SpellingIssue {
  kind: SpellingIssueKind;
  original: string;
  suggestion: string;
  index: number;
  length: number;
  message: string;
}

const WORD_PATTERN = /[A-Za-z][A-Za-z'-]*/g;

/** Preserves the original capitalisation pattern when applying a correction. */
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase();
  }
  if (/^[A-Z]/.test(original)) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function checkSpelling(text: string, ignored: string[] = []): SpellingIssue[] {
  if (!text.trim()) return [];

  const ignoredSet = new Set(ignored.map((word) => word.toLowerCase()));
  const issues: SpellingIssue[] = [];

  let match: RegExpExecArray | null;
  WORD_PATTERN.lastIndex = 0;
  while ((match = WORD_PATTERN.exec(text)) !== null) {
    const word = match[0];
    const lower = word.toLowerCase();
    if (ignoredSet.has(lower) || ALLOWED.has(lower)) continue;

    const correction = MISSPELLINGS[lower];
    if (!correction) continue;
    // Some dictionary keys map to themselves so that correct spellings are
    // explicitly allowed rather than flagged by a later rule.
    if (correction.toLowerCase() === lower) continue;

    issues.push({
      kind: "misspelling",
      original: word,
      suggestion: matchCase(word, correction),
      index: match.index,
      length: word.length,
      message: `"${word}" looks like a misspelling of "${correction}".`,
    });
  }

  // Accidentally repeated words: "the the", "and and".
  const repeated = /\b([A-Za-z]{2,})\s+\1\b/gi;
  while ((match = repeated.exec(text)) !== null) {
    issues.push({
      kind: "repeated-word",
      original: match[0],
      suggestion: match[1],
      index: match.index,
      length: match[0].length,
      message: `"${match[1]}" is repeated.`,
    });
  }

  // Missing space after sentence punctuation: "React.Built an app".
  const spacing = /([a-z]{2,}[.,;])([A-Z][a-z]{2,})/g;
  while ((match = spacing.exec(text)) !== null) {
    issues.push({
      kind: "spacing",
      original: match[0],
      suggestion: `${match[1]} ${match[2]}`,
      index: match.index,
      length: match[0].length,
      message: "A space is missing after the punctuation.",
    });
  }

  return issues.sort((a, b) => a.index - b.index);
}

/** Applies one spelling correction, leaving the rest of the text untouched. */
export function applySpellingFix(text: string, issue: SpellingIssue): string {
  return (
    text.slice(0, issue.index) + issue.suggestion + text.slice(issue.index + issue.length)
  );
}

/** Applies every correction in one pass, working right to left. */
export function applyAllSpellingFixes(text: string, issues: SpellingIssue[]): string {
  return [...issues]
    .sort((a, b) => b.index - a.index)
    .reduce((acc, issue) => applySpellingFix(acc, issue), text);
}

export const KNOWN_MISSPELLINGS = MISSPELLINGS;
