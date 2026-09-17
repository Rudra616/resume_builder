import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FIXTURES, parseFixture } from "./helpers";
import { matchHeading } from "@/lib/resume-parser/detectSections";
import { classifyUrl, normalizeUrl } from "@/lib/resume-parser/parseLinks";
import {
  dehyphenate,
  isBulletLine,
  normalizeText,
  stripBullet,
} from "@/lib/resume-parser/normalizeText";

describe("normalizeText", () => {
  it("normalises ligatures, smart quotes and non-breaking spaces", () => {
    const output = normalizeText("The oﬃce’s “ﬁnal” report\u00a0was sent");
    assert.equal(output, `The office's "final" report was sent`);
  });

  it("recognises the bullet characters resumes actually use", () => {
    for (const line of ["• Built it", "- Built it", "▪ Built it", "‣ Built it"]) {
      assert.equal(isBulletLine(line), true, line);
      assert.equal(stripBullet(line), "Built it");
    }
    assert.equal(isBulletLine("Built it"), false);
  });

  it("rejoins words split across a line break by hyphenation", () => {
    assert.deepEqual(dehyphenate(["cross-plat-", "form apps"]), ["cross-platform apps"]);
  });
});

describe("heading detection", () => {
  it("maps common heading variations to canonical sections", () => {
    const cases: [string, string][] = [
      ["Professional Summary", "summary"],
      ["About Me", "summary"],
      ["Objective", "summary"],
      ["Employment History", "experience"],
      ["Work Experience", "experience"],
      ["Where I've Worked", "experience"],
      ["Academic Background", "education"],
      ["Qualifications", "education"],
      ["Technical Skills", "skills"],
      ["Competencies", "skills"],
      ["What I Know", "skills"],
      ["Personal Projects", "projects"],
      ["Licenses", "certifications"],
      ["Language Skills", "languages"],
    ];

    for (const [heading, expected] of cases) {
      assert.equal(matchHeading(heading), expected, heading);
    }
  });

  it("does not treat ordinary sentences as headings", () => {
    assert.equal(matchHeading("Rebuilt the order tracking screen for Android"), null);
    assert.equal(matchHeading("Northwind Labs, Ahmedabad"), null);
  });
});

describe("link handling", () => {
  it("normalises bare domains to absolute https URLs", () => {
    assert.equal(normalizeUrl("github.com/priyanair"), "https://github.com/priyanair");
    assert.equal(
      normalizeUrl("https://www.linkedin.com/in/priyanair/"),
      "https://www.linkedin.com/in/priyanair/",
    );
  });

  it("classifies the link types resumes carry", () => {
    assert.equal(classifyUrl("https://linkedin.com/in/x").kind, "linkedin");
    assert.equal(classifyUrl("https://github.com/x").kind, "github");
    assert.equal(classifyUrl("https://behance.net/x").kind, "behance");
    assert.equal(classifyUrl("https://dribbble.com/x").kind, "dribbble");
    assert.equal(classifyUrl("https://someone.dev").kind, "portfolio");
  });
});

describe("simple one-page resume", () => {
  const parsed = parseFixture(FIXTURES.simple);

  it("extracts contact details", () => {
    const { personalInfo } = parsed.resume;
    assert.equal(personalInfo.fullName, "Rudra Panchal");
    assert.equal(personalInfo.jobTitle, "React Native Developer");
    assert.equal(personalInfo.email, "rudra.panchal@example.com");
    assert.match(personalInfo.phone, /98765/);
    assert.equal(personalInfo.city, "Ahmedabad");
  });

  it("keeps LinkedIn and GitHub as clickable normalised links", () => {
    const kinds = parsed.resume.links.map((link) => link.kind);
    assert.ok(kinds.includes("linkedin"));
    assert.ok(kinds.includes("github"));
    for (const link of parsed.resume.links) {
      assert.match(link.url, /^https:\/\//);
    }
  });

  it("splits experience into entries with dates and bullet achievements", () => {
    const { experience } = parsed.resume;
    assert.equal(experience.length, 2);

    const [current] = experience;
    assert.match(current.role, /React Native Developer/);
    assert.match(current.company, /Northwind Labs/);
    assert.equal(current.current, true);
    assert.equal(current.achievements.length, 3);
    assert.ok(current.achievements.every((bullet) => !bullet.startsWith("•")));
  });

  it("groups skills under their headings without duplicates", () => {
    const groups = parsed.resume.skills;
    assert.ok(groups.length >= 3);
    const mobile = groups.find((group) => /mobile/i.test(group.category));
    assert.ok(mobile);
    assert.ok(mobile.items.includes("React Native"));

    const all = groups.flatMap((group) => group.items.map((item) => item.toLowerCase()));
    assert.equal(new Set(all).size, all.length);
  });

  it("records education and projects", () => {
    assert.equal(parsed.resume.education.length, 1);
    assert.match(parsed.resume.education[0].institution, /Gujarat Technological/);
    assert.ok(parsed.resume.projects.length >= 1);
    assert.equal(parsed.resume.projects[0].name, "Trailhead");
  });

  it("reports which sections it found", () => {
    const found = parsed.report.detectedSections.map((section) => section.canonical);
    for (const section of ["summary", "experience", "education", "skills"]) {
      assert.ok(found.includes(section), `expected ${section}`);
    }
  });
});

describe("long two-page resume", () => {
  const parsed = parseFixture(FIXTURES.twoPage);

  it("keeps every role rather than truncating the history", () => {
    assert.equal(parsed.resume.experience.length, 6);
  });

  it("parses both degrees, certifications and languages", () => {
    assert.equal(parsed.resume.education.length, 2);
    assert.equal(parsed.resume.certifications.length, 2);
    assert.equal(parsed.resume.languages.length, 3);
    assert.equal(parsed.resume.languages[0].level, "Native");
  });
});

describe("unusual headings", () => {
  const parsed = parseFixture(FIXTURES.unusual);

  it("still finds experience, education and skills", () => {
    assert.ok(parsed.resume.experience.length >= 2);
    assert.ok(parsed.resume.education.length >= 1);
    assert.ok(parsed.resume.skills.length >= 1);
    assert.ok(parsed.resume.summary.length > 0);
  });

  it("understands slash-formatted dates", () => {
    const entry = parsed.resume.experience[0];
    assert.ok(entry.startDate.length > 0);
    assert.equal(entry.current, true);
  });
});

describe("resume missing several sections", () => {
  const parsed = parseFixture(FIXTURES.missing);

  it("leaves absent sections empty instead of inventing content", () => {
    assert.equal(parsed.resume.summary, "");
    assert.equal(parsed.resume.education.length, 0);
    assert.equal(parsed.resume.projects.length, 0);
  });

  it("marks undated roles as low confidence for review", () => {
    assert.ok(parsed.resume.experience.length >= 1);
    assert.ok(
      parsed.report.lowConfidenceFields.length > 0,
      "expected at least one field flagged for review",
    );
  });
});

describe("link-heavy resume", () => {
  const parsed = parseFixture(FIXTURES.links);

  it("collects every distinct profile without duplicates", () => {
    const kinds = parsed.resume.links.map((link) => link.kind);
    for (const kind of ["linkedin", "github", "behance", "dribbble"] as const) {
      assert.ok(kinds.includes(kind), `expected ${kind}`);
    }
    const urls = parsed.resume.links.map((link) =>
      link.url.toLowerCase().replace(/\/$/, ""),
    );
    assert.equal(new Set(urls).size, urls.length);
  });

  it("does not mistake an email domain for a website", () => {
    assert.ok(!parsed.resume.links.some((link) => link.url.includes("example.com")));
  });
});

describe("two-column extraction", () => {
  const parsed = parseFixture(FIXTURES.twoColumn);

  it("recovers the name, contact details and both roles", () => {
    assert.equal(parsed.resume.personalInfo.fullName, "Aiden Brooks");
    assert.equal(parsed.resume.personalInfo.email, "aiden.brooks@example.com");
    assert.ok(parsed.resume.experience.length >= 2);
  });
});

describe("resume with no headings at all", () => {
  const parsed = parseFixture(FIXTURES.textOnly);

  it("keeps the contact details it can prove", () => {
    assert.equal(parsed.resume.personalInfo.fullName, "Lena Fischer");
    assert.equal(parsed.resume.personalInfo.email, "lena.fischer@example.com");
  });

  it("preserves uncategorised prose instead of discarding it", () => {
    const kept =
      parsed.resume.unclassifiedContent.flatMap((block) => block.lines).join(" ") +
      parsed.resume.summary;
    assert.match(kept, /technical writer/);
  });
});
