import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FIXTURES, parseFixture } from "./helpers";
import { analyzeBullet, analyzeBulletSet } from "@/lib/resume-assistant/bulletRules";
import { findFillerWords, findWeakPhrases } from "@/lib/resume-assistant/contentRules";
import {
  findDuplicates,
  findSkillDuplicates,
} from "@/lib/resume-assistant/duplicateDetection";
import {
  checkGrammar,
  firstPersonFinding,
} from "@/lib/resume-assistant/grammarRules";
import { calculateResumeHealth } from "@/lib/resume-assistant/resumeHealth";
import {
  applySpellingFix,
  checkSpelling,
} from "@/lib/resume-assistant/spelling";
import { analyzeSummaryText } from "@/lib/resume-assistant/summaryRules";
import {
  createSuggestionProvider,
} from "@/lib/resume-assistant/suggestionProvider";
import { safeFixes } from "@/lib/resume-assistant/suggestions";
import {
  findTechnologyIssues,
  normalizeTechnology,
} from "@/lib/resume-assistant/technologyNormalization";
import { createEmptyResume } from "@/lib/resume-defaults";
import { getByPath, setByPath } from "@/lib/utils";

describe("spelling", () => {
  it("catches common resume misspellings and proposes the correction", () => {
    const issues = checkSpelling("Developt application using React");
    assert.equal(issues.length, 1);
    assert.equal(issues[0].original, "Developt");
    assert.equal(issues[0].suggestion, "Developed");
    assert.equal(
      applySpellingFix("Developt application using React", issues[0]),
      "Developed application using React",
    );
  });

  it("preserves the original capitalisation of the word it replaces", () => {
    const [issue] = checkSpelling("Recieved feedback");
    assert.equal(applySpellingFix("Recieved feedback", issue), "Received feedback");
  });

  it("respects the ignore list", () => {
    assert.equal(checkSpelling("Developt features", ["Developt"]).length, 0);
  });

  it("does not flag correctly spelled text", () => {
    assert.deepEqual(
      checkSpelling("Developed and maintained a React Native application"),
      [],
    );
  });
});

describe("weak phrases", () => {
  it("flags the usual suspects and offers a stronger opener", () => {
    const [finding] = findWeakPhrases("Responsible for developing applications");
    assert.match(finding.phrase.toLowerCase(), /responsible for/);
    assert.ok(finding.rewrite);
    assert.ok(!/\d/.test(finding.rewrite), "a rewrite must not invent a metric");
  });

  it("never fabricates numbers or technologies", () => {
    for (const text of ["Worked on mobile applications", "Helped with testing"]) {
      const [finding] = findWeakPhrases(text);
      assert.ok(finding);
      if (!finding.rewrite) continue;
      const originalWords = new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);
      const addedTech = (finding.rewrite.toLowerCase().match(/[a-z]+/g) ?? []).filter(
        (word) => !originalWords.has(word),
      );
      // Replacement wording may add verbs, but never digits.
      assert.ok(!/\d/.test(finding.rewrite));
      assert.ok(addedTech.every((word) => !/^(react|node|aws|python)$/.test(word)));
    }
  });

  it("spots filler words", () => {
    const fillers = findFillerWords(
      "Basically I was very responsible for a variety of things",
    );
    assert.ok(fillers.length > 0);
  });
});

describe("grammar rules", () => {
  it("capitalises a lone lower-case I", () => {
    const { findings } = checkGrammar("i worked on the payments team");
    const pronoun = findings.find((finding) => /capitali[sz]e/i.test(finding.message));
    assert.ok(pronoun);
    assert.equal(pronoun.replacement, "I worked on the payments team");
  });

  it("surfaces technology casing alongside grammar", () => {
    const { technology } = checkGrammar("i worked on react native application");
    assert.ok(technology.some((finding) => finding.suggestion === "React Native"));
  });

  it("flags first-person pronouns in resume prose", () => {
    assert.ok(firstPersonFinding("I led the migration and my team shipped it"));
    assert.equal(firstPersonFinding("Led the migration with the platform team"), null);
  });
});

describe("technology normalisation", () => {
  it("knows the canonical spelling of common technologies", () => {
    const cases: [string, string][] = [
      ["react native", "React Native"],
      ["node js", "Node.js"],
      ["next js", "Next.js"],
      ["javascript", "JavaScript"],
      ["typescript", "TypeScript"],
      ["postgresql", "PostgreSQL"],
      ["mysql", "MySQL"],
      ["github", "GitHub"],
      ["linkedin", "LinkedIn"],
      ["html", "HTML"],
      ["css", "CSS"],
    ];

    for (const [input, expected] of cases) {
      assert.equal(normalizeTechnology(input), expected, input);
    }
  });

  it("finds casing problems inside a sentence", () => {
    const findings = findTechnologyIssues("Built apps with react native and node js");
    const replacements = findings.map((finding) => finding.suggestion);
    assert.ok(replacements.includes("React Native"));
    assert.ok(replacements.includes("Node.js"));
  });

  it("leaves already-correct names alone", () => {
    assert.deepEqual(findTechnologyIssues("Built apps with React Native and Node.js"), []);
  });
});

describe("bullet analysis", () => {
  it("warns about a very long bullet", () => {
    const bullet =
      "Worked on the payment screen and helped with bug fixes and also worked on the " +
      "settings screen and the profile screen and the onboarding screen which took a " +
      "long time because the designs kept changing throughout the entire project and " +
      "the team had to rework several of the earlier screens more than once";
    const issues = analyzeBullet(bullet);
    const tooLong = issues.find((issue) => issue.kind === "too-long");
    assert.ok(tooLong);
    assert.match(tooLong.message, /\d+ words/);
    assert.equal(tooLong.severity, "warning");
  });

  it("warns about a bullet that is barely there", () => {
    assert.ok(analyzeBullet("Did documentation").some((i) => i.kind === "too-short"));
  });

  it("notices weak language and offers a rewrite built from the user's words", () => {
    const [issue] = analyzeBullet("Responsible for developing mobile applications");
    assert.equal(issue.kind, "weak-verb");
    assert.equal(issue.rewrite, "Developed mobile applications");
    assert.ok((issue.ideas ?? []).length > 0);
  });

  it("reports repeated openers and inconsistent endings across a set", () => {
    const issues = analyzeBulletSet([
      "Worked on the login screen",
      "Worked on the settings screen",
      "Worked on the profile screen.",
    ]);
    const kinds = issues.map((issue) => issue.kind);
    assert.ok(kinds.includes("repetitive-opener"));
    assert.ok(kinds.includes("ends-inconsistently"));
  });
});

describe("summary rules", () => {
  it("flags first-person and generic openers", () => {
    const issues = analyzeSummaryText(
      "I am a hard working and very good developer who is a team player and is passionate about technology.",
      true,
    );
    const kinds = issues.map((issue) => issue.kind);
    assert.ok(kinds.some((kind) => kind.includes("first-person")));
  });

  it("flags a summary that runs on", () => {
    const long = "Experienced developer building things. ".repeat(12);
    const kinds = analyzeSummaryText(long, true).map((issue) => issue.kind);
    assert.ok(kinds.includes("too-long") || kinds.includes("too-many-sentences"));
  });

  it("stays quiet on a well-sized summary", () => {
    const good =
      "React Native developer with four years building cross-platform apps for retail teams. " +
      "Owns features from design review through store release.";
    assert.deepEqual(
      analyzeSummaryText(good, true).filter((issue) => issue.severity === "warning"),
      [],
    );
  });
});

describe("duplicate detection", () => {
  const parsed = parseFixture(FIXTURES.messy);

  it("spots the same sentence reused in another section", () => {
    const duplicates = findDuplicates(parsed.resume);
    assert.ok(duplicates.length > 0);
    assert.ok(
      duplicates.some((duplicate) =>
        /responsible for developing mobile applications/i.test(duplicate.a.text),
      ),
    );
    // The pair must point at two different places so the user can fix one.
    for (const duplicate of duplicates) {
      assert.notEqual(duplicate.a.fieldPath, duplicate.b.fieldPath);
    }
  });

  it("spots duplicated skills across groups, including near matches", () => {
    const resume = createEmptyResume();
    resume.skills = [
      { id: "a", category: "Frontend", items: ["React", "TypeScript"] },
      { id: "b", category: "Mobile", items: ["react", "React Native"] },
    ];

    const duplicates = findSkillDuplicates(resume);
    assert.equal(duplicates.length, 1);
    assert.equal(duplicates[0].duplicate, "react");
    assert.equal(duplicates[0].kept, "React");
    assert.deepEqual(duplicates[0].groupIndexes, [0, 1]);
  });

  it("leaves the imported skill list alone — the parser already de-duplicates it", () => {
    assert.deepEqual(findSkillDuplicates(parsed.resume), []);
  });

  it("does not flag distinct content as duplicated", () => {
    const clean = parseFixture(FIXTURES.simple);
    assert.deepEqual(findDuplicates(clean.resume), []);
  });
});

describe("resume health", () => {
  it("scores a well-formed resume higher than a messy one", () => {
    const good = calculateResumeHealth(parseFixture(FIXTURES.simple).resume);
    const messy = calculateResumeHealth(parseFixture(FIXTURES.messy).resume);
    assert.ok(good.score > messy.score, `${good.score} should beat ${messy.score}`);
    assert.ok(good.score <= 100 && messy.score >= 0);
  });

  it("explains itself with categories and reasons", () => {
    const health = calculateResumeHealth(parseFixture(FIXTURES.missing).resume);
    assert.ok(health.categories.length >= 6);
    assert.ok(health.needsAttention.length > 0);
    assert.ok(["Excellent", "Strong", "Fair", "Needs work"].includes(health.grade));
    for (const category of health.categories) {
      assert.ok(category.score <= category.max, `${category.key} exceeds its maximum`);
      assert.ok(category.label.length > 0);
      // Every category has to justify itself one way or the other.
      assert.ok(category.positives.length + category.negatives.length > 0, category.key);
    }
  });

  it("penalises a resume with no contact details", () => {
    const { resume } = parseFixture(FIXTURES.simple);
    const stripped = {
      ...resume,
      personalInfo: { ...resume.personalInfo, email: "", phone: "" },
    };
    assert.ok(calculateResumeHealth(stripped).score < calculateResumeHealth(resume).score);
  });
});

describe("suggestion provider", () => {
  const provider = createSuggestionProvider();
  const { resume } = parseFixture(FIXTURES.messy);

  it("produces suggestions with stable dedupe keys", () => {
    const first = provider.analyzeAll(resume).suggestions;
    const second = provider.analyzeAll(resume).suggestions;
    assert.deepEqual(
      first.map((item) => item.dedupeKey),
      second.map((item) => item.dedupeKey),
    );
    assert.equal(new Set(first.map((item) => item.dedupeKey)).size, first.length);
  });

  it("marks only mechanical corrections as safe to batch-apply", () => {
    const { suggestions } = provider.analyzeAll(resume);
    const safe = safeFixes(suggestions);
    assert.ok(safe.length > 0);
    for (const suggestion of safe) {
      assert.ok(suggestion.fix?.safe);
      assert.ok(
        ["spelling", "consistency", "formatting", "grammar", "links"].includes(
          suggestion.category,
        ),
        `unexpected safe category: ${suggestion.category}`,
      );
    }
  });

  it("applies a fix to the exact field path it points at", () => {
    const { suggestions } = provider.analyzeAll(resume);
    const fixable = suggestions.find((item) => item.fix && item.fieldPath);
    assert.ok(fixable, "expected at least one applicable fix");

    const updated = setByPath(resume, fixable.fieldPath!, fixable.fix!.replacement);
    assert.equal(getByPath(updated, fixable.fieldPath!), fixable.fix!.replacement);
    // Applying a fix must not disturb anything else.
    assert.equal(updated.experience.length, resume.experience.length);
    assert.equal(updated.design.templateId, resume.design.templateId);
  });

  it("only suggests skills the resume already mentions", () => {
    const skills = provider.suggestSkills(resume);
    const corpus = JSON.stringify(resume).toLowerCase();
    for (const skill of skills) {
      const stem = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
      assert.ok(
        corpus.replace(/[^a-z0-9]/g, "").includes(stem),
        `${skill} is not mentioned anywhere in the resume`,
      );
    }
  });

  it("rewrites a bullet without inventing facts", () => {
    const fixes = provider.rewriteBullet("Responsible for developing mobile applications");
    assert.ok(fixes.length > 0);
    for (const fix of fixes) {
      assert.ok(!/\d/.test(fix.replacement));
    }
  });

  it("reports the local rules honestly — no AI labelling", () => {
    assert.equal(provider.remote, false);
    assert.ok(!/\bAI\b/i.test(provider.label));
  });
});
