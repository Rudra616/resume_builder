# Import fixtures

Sample resumes used to exercise the import pipeline during development. They
cover the shapes real resumes actually arrive in — unusual headings, missing
sections, two-column layouts, very long histories — so parser changes can be
checked against something other than a single tidy example.

## Layout

- `text/*.txt` — plain-text sources. Also used directly as TXT import fixtures.
- `generated/` — PDF and DOCX files built from the text sources.

## Regenerating the binary fixtures

```bash
npm run fixtures
```

`scripts/build-fixtures.mjs` writes the PDF and DOCX files. Both writers are
small and dependency-free: the PDF writer emits Helvetica text runs (real text,
never an image, so extraction behaves like a normal exported resume) and the
DOCX writer zips a minimal WordprocessingML document with headings, bullet
lists and hyperlink relationships.

## What each fixture is for

| File | Scenario |
| --- | --- |
| `simple-one-page.txt` | Ordinary one-page resume, conventional headings |
| `two-page-long-experience.txt` | Long employment history that spills onto a second page |
| `unusual-headings.txt` | "Where I've Worked", "What I Know" and similar headings |
| `missing-sections.txt` | No summary, no education, no dates |
| `links-heavy.txt` | LinkedIn, GitHub, portfolio, Behance, bare domains |
| `two-column.txt` | Sidebar-and-main layout that extracts as interleaved lines |
| `text-only.txt` | No headings at all — everything lands in review as unclassified |
| `messy-writing.txt` | Misspellings, weak phrases, duplicated bullets, mixed dates |

## Manual import checks

Files that cannot be represented as text fixtures still need covering by hand:

- **Password-protected PDF** — expect "This PDF is password protected."
- **Scanned PDF** — expect the "may contain scanned pages" message with the
  option to continue manually.
- **Corrupt PDF** — truncate a valid PDF and confirm the error is explained.
- **Empty file** — a 0-byte upload is rejected before parsing.
- **Oversized file** — anything above 10 MB is rejected before parsing.
