# Put this in Atlas

The canonical authority is `02 Projects/Atlas Intake.md` in the private
`jlsp124/obsidian-vaults` repository. That note contains the October 6 source
brief/intake contract and October 7's superseding Atlas V3 product contract.
The source workflow remains preserved; conflicting earlier UX instructions do
not restore a primary Learn/Classwork path. A chat must have access to that repository
or receive the note; writing a vault note cannot give unrelated chats automatic
access to private files.

## Intake

1. Preserve original order first. Record filenames, paths, hashes, EXIF/capture
   and filesystem timestamps, dimensions and sequence indexes in a private
   manifest before reorganizing anything.
2. Inspect the material and permitted school sources. Identify course, teacher,
   edition, unit, material set, document title, pages and question ranges. Strong
   Physics content overrides its position after Chemistry in a photo sequence.
3. Search the canonical registry, exact raw/text hashes, teacher URLs, titles,
   question overlap and vault transcriptions. Continuous pages belong to one
   document. Matching titles or URLs alone require review. A reviewed alternate
   capture uses `same_material_as`; a changed document has a distinct identity
   and `supersedes`. Keep both revisions and all original captures.
4. Transcribe privately, preserving numbering, tables, diagrams and uncertainty.
   Distinguish teacher-provided, user-supplied and Atlas-derived answers.
   A guessed answer or date is never evidence.
5. Create a reviewed private intake JSON. The CLI validates its fields, writes
   the manifest first, copies and verifies content-addressed raw files, then
   merges the registry. Inspect before applying:

```sh
npm run atlas:intake -- --spec /private/intake.json
npm run atlas:intake -- --spec /private/intake.json --apply
```

The JSON includes `identity`, `course`, `teacher`, `edition`, `unit`,
`material_set`, `title`, `kind`, `text`, `question_numbers`, `files`,
`publication`, `assistance`, `confidence`, `atlas_content_ids` and supported
dates/URL/relationships. Each file specifies `path`, `sequence_index` and
available capture timestamp, EXIF and `[width,height]`. The strict executable
schema is in `scripts/intake.ts`.

Raw files default to the operator's private `Documents/Atlas Sources` directory.
Set `ATLAS_SOURCE_ARCHIVE` to relocate it. The canonical `registry.json` links
all captures to stable source IDs and Atlas content IDs. Private `config.json`
may set `vaultPath`; `ATLAS_VAULT_PATH` overrides it.

## Update Atlas

```sh
npm run atlas:update
npm run atlas:update -- --apply
```

Inspection compares the reviewed inbox, permitted vault hashes, canonical
registry and approved derivative. It refreshes nine bounded Life Sciences 11
pages, the current-term ICS feed and six specific teacher Drive resources.
Full folded calendar descriptions and assessment scope are retained. Raw
HTML/ICS/PDF bytes stay private. PDFs have a 128 MiB streaming limit; pages have
a 5 MB limit. No unrelated Bio2, Anatomy or Life Sciences 12 course is crawled.
Unavailable files retain an explicit status without invented content.

The plan reports duplicate/revision relationships and affected companions.
Only semantically changed public objects are written. New/changed evidence
without an approved companion stays in `review-pending.json`; accepting a hash
baseline does not clear that queue. A reviewer checks the actual evidence,
edits `approved-companions.json`, updates concepts/definitions only when needed,
then applies. `--reviewed-evidence` acknowledges evidence reviewed in that run.
The CLI does not perform unattended OCR-to-public-content generation.

Keep question and concept IDs stable. Move replaced work through an explicit
revision relationship, retaining old progress mappings. Independent-only
Chemistry assignments have title/unit/date metadata, without questions, hints,
solutions, downloads or AI answer prompts.

After an authorized update, run `npm run check` and `npm audit --audit-level=high`,
review privacy and source rights, commit/push the affected files, verify the
exact Ubuntu CI SHA, and verify Pages and API deployment. Repeating an unchanged
update must produce zero changes. Credentials, raw paths and student work do
not enter public content or logs.
