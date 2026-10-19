# atlas

Atlas is a course companion I built for my own classes. It keeps assignments, notes, review material, search, progress, and study tools in one place instead of spreading everything across random files and tabs.

[Open Atlas](https://jlsp124.github.io/atlas/)

## Courses

- Physics 11
- Life Sciences 11
- Introductory Japanese 11
- Chemistry 11

Each course is organized around the actual material I get in class. Assignments stay connected to the unit and concepts they belong to, and the guided help is meant to get me unstuck without just replacing the work.

Japanese also has a review mode for vocabulary and typing practice.

## How it works

The public app is mostly static and works without an account. It includes:

- course and unit pages
- assignment breakdowns
- notes and search
- progress tracking
- calendar information
- Japanese review
- mobile-friendly study views

There is also an optional Node/SQLite backend for synced accounts and a few private features. The public study tools do not depend on it.

## Development

Requires Node 24+ and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/atlas/`.

Run the project checks with:

```sh
npm run check
```

That covers formatting, linting, types, content checks, tests, the production build, and browser/accessibility tests.

## Docs

The project grew enough that I keep the detailed stuff separate from the README:

- [Architecture](docs/ARCHITECTURE.md)
- [Content updates](docs/CONTENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)
- [QA](docs/QA.md)
- [Contributing](CONTRIBUTING.md)

Student-made and unofficial. Important deadlines should still be checked against the teacher's actual instructions.

Original Atlas code and content are MIT licensed. Linked teacher and external material keeps its own rights; see [NOTICE](NOTICE.md).
