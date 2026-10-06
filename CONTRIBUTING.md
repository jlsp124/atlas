# Contributing

Use Node 24.11+ and `npm ci`. Work in small coherent commits. Before publishing, run `npm run check` and `npm audit --omit=dev`.

Content changes must preserve stable IDs and source metadata. Read [content guidance](docs/CONTENT.md). Never add raw private vault notes, grades, contact information, teacher assessments, answer keys or unlicensed media. New topics need original explanations and reviewed practice. Record missing evidence rather than inventing it.

Use feature branches and pull requests for subsequent updates. Automated Pages deployment follows passing checks on `main`. Changes to secure auth, sync or content selection need focused regression tests. See implementation status before resuming unfinished work.
