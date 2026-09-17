import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { linesFromDocxHtml } from "@/lib/resume-parser/docxHtml";
import { extractDocx } from "@/lib/resume-parser/extractDocx";
import { extractTxt } from "@/lib/resume-parser/extractTxt";
import {
  buildResumeFromExtraction,
  detectFileKind,
  MAX_FILE_BYTES,
  validateFile,
} from "@/lib/resume-parser/resumeParser";
import { ResumeParseError } from "@/types/parser";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function generatedFile(name: string): File {
  const buffer = readFileSync(join(root, "fixtures", "generated", name));
  return new File([new Uint8Array(buffer)], name);
}

function textFile(name: string, contents: string): File {
  return new File([contents], name, { type: "text/plain" });
}

async function expectParseError(
  run: () => Promise<unknown>,
): Promise<ResumeParseError> {
  try {
    await run();
  } catch (error) {
    assert.ok(error instanceof ResumeParseError, `unexpected error: ${String(error)}`);
    return error;
  }
  throw new Error("expected the import to fail");
}

describe("file validation", () => {
  it("recognises the three supported formats by name and MIME type", () => {
    assert.equal(detectFileKind(new File(["x"], "resume.PDF")), "pdf");
    assert.equal(detectFileKind(new File(["x"], "resume.docx")), "docx");
    assert.equal(detectFileKind(new File(["x"], "resume.txt")), "txt");
    assert.equal(
      detectFileKind(new File(["x"], "resume", { type: "application/pdf" })),
      "pdf",
    );
    assert.equal(detectFileKind(new File(["x"], "resume.pages")), null);
  });

  it("explains why a file is rejected instead of throwing something opaque", () => {
    const cases: [File, string][] = [
      [new File([], "empty.pdf"), "empty-file"],
      [new File(["x".repeat(MAX_FILE_BYTES + 1)], "big.pdf"), "too-large"],
      [new File(["x"], "resume.doc"), "unsupported-type"],
    ];

    for (const [file, code] of cases) {
      assert.throws(
        () => validateFile(file),
        (error: unknown) => {
          assert.ok(error instanceof ResumeParseError);
          assert.equal(error.code, code);
          assert.ok(error.message.length > 0);
          return true;
        },
      );
    }
  });
});

describe("DOCX import", () => {
  it("reads a real DOCX end to end", async () => {
    const extraction = await extractDocx(generatedFile("simple-one-page.docx"));
    assert.equal(extraction.source, "docx");
    assert.ok(extraction.lines.length > 10);

    const { resume, report } = buildResumeFromExtraction(extraction);
    assert.equal(resume.personalInfo.fullName, "Rudra Panchal");
    assert.equal(resume.personalInfo.email, "rudra.panchal@example.com");
    assert.ok(resume.experience.length >= 2);
    assert.ok(resume.skills.length > 0);
    assert.equal(resume.metadata.source, "docx");
    assert.equal(resume.metadata.importedFileName, "simple-one-page.docx");
    assert.ok(report.detectedSections.some((section) => section.canonical === "experience"));
  });

  it("keeps DOCX hyperlinks, normalised and classified", async () => {
    const extraction = await extractDocx(generatedFile("links-heavy.docx"));
    assert.ok(extraction.links.length >= 4);

    const { resume } = buildResumeFromExtraction(extraction);
    const kinds = resume.links.map((link) => link.kind);
    assert.ok(kinds.includes("linkedin"));
    assert.ok(kinds.includes("github"));
    for (const link of resume.links) {
      assert.match(link.url, /^https:\/\//, `${link.url} should be absolute`);
    }
  });

  it("preserves bullet lists as separate achievements", async () => {
    const extraction = await extractDocx(generatedFile("simple-one-page.docx"));
    const { resume } = buildResumeFromExtraction(extraction);
    const bullets = resume.experience.flatMap((entry) => entry.achievements);
    assert.ok(bullets.length >= 4);
    for (const bullet of bullets) {
      assert.ok(!/^[•·\-*]/.test(bullet), `bullet marker left in: ${bullet}`);
    }
  });

  it("rejects a file that is not really a DOCX", async () => {
    const fake = new File(["this is plain text pretending to be Word"], "resume.docx");
    const error = await expectParseError(() => extractDocx(fake));
    assert.ok(["unsupported-type", "corrupt"].includes(error.code));
    assert.ok(error.hint);
  });
});

describe("DOCX html shaping", () => {
  it("maps headings, lists, tables and links to lines", () => {
    const { lines, links } = linesFromDocxHtml(
      [
        "<h1>Rudra Panchal</h1>",
        "<p><strong>EXPERIENCE</strong></p>",
        "<p>React Native Developer &amp; Team Lead</p>",
        "<ul><li>Built the checkout flow</li><li>Shipped offline sync</li></ul>",
        "<table><tr><td>Skills</td><td>React, TypeScript</td></tr></table>",
        '<p><a href="https://github.com/rudra">github.com/rudra</a></p>',
        '<p><a href="#bookmark">internal</a></p>',
      ].join(""),
    );

    assert.equal(lines[0].text, "Rudra Panchal");
    assert.equal(lines[0].heading, true);
    assert.equal(lines[1].heading, true, "a fully bold short paragraph is a heading");
    assert.equal(lines[2].text, "React Native Developer & Team Lead");
    assert.deepEqual(
      lines.filter((line) => line.bullet).map((line) => line.text),
      ["Built the checkout flow", "Shipped offline sync"],
    );
    assert.ok(lines.some((line) => line.text === "Skills | React, TypeScript"));

    assert.deepEqual(links, [
      { url: "https://github.com/rudra", text: "github.com/rudra", page: 1 },
    ]);
  });

  it("does not treat a long bold paragraph as a heading", () => {
    const { lines } = linesFromDocxHtml(
      "<p><strong>Delivered the payments migration across three teams and two release trains</strong></p>",
    );
    assert.equal(lines[0].heading, false);
    assert.equal(lines[0].bold, true);
  });
});

describe("TXT import", () => {
  it("reads a plain text resume", async () => {
    const contents = readFileSync(join(root, "fixtures", "text", "text-only.txt"), "utf8");
    const extraction = await extractTxt(textFile("text-only.txt", contents));
    assert.equal(extraction.source, "txt");
    const { resume } = buildResumeFromExtraction(extraction);
    assert.ok(resume.personalInfo.fullName.length > 0);
  });

  it("tells the user when a text file has no resume in it", async () => {
    const error = await expectParseError(() =>
      extractTxt(textFile("empty.txt", "   \n\n  ")),
    );
    assert.equal(error.code, "no-text");
  });
});
