# Contributing to Venture Forest

Thank you for your interest in contributing. This guide covers everything you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+
- [Python](https://www.python.org/) 3.11+ (for the data pipeline)
- A [Neon](https://neon.tech/) PostgreSQL database (or compatible Postgres instance)

## Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/venture-forest.git
   cd venture-forest
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

4. Set up the Python data pipeline (if working on that part):

   ```bash
   cd data
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. Start the dev server:

   ```bash
   pnpm dev
   ```

## Development Workflow

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes and verify they pass all checks:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

3. Commit using [Conventional Commits](#commit-conventions) and push your branch.

4. Open a pull request against `main`.

## Code Style

- TypeScript and JavaScript use [Prettier](https://prettier.io/) for formatting and [ESLint](https://eslint.org/) for linting.
- Python code follows [Ruff](https://docs.astral.sh/ruff/) for linting and formatting.
- Run `pnpm format` to auto-format the codebase.
- Run `pnpm lint` to check for issues.

## Commit Conventions

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `style:` formatting, no code change
- `refactor:` code change that neither fixes a bug nor adds a feature
- `perf:` performance improvement
- `test:` adding or updating tests
- `chore:` build process, tooling, or dependency updates

Example: `feat: add tree growth animation to forest scene`

## Pull Request Process

1. Fill out the PR template completely.
2. Ensure CI passes (lint, typecheck, tests).
3. Request a review from at least one maintainer.
4. Address review feedback promptly.
5. Squash and merge once approved.

## Reporting Issues

Use the GitHub issue templates for [bug reports](.github/ISSUE_TEMPLATE/bug_report.md) and [feature requests](.github/ISSUE_TEMPLATE/feature_request.md). Provide as much context as possible.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
