# Repo Hygiene

## Commits
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`.
- Keep commits atomic; one logical change per commit.
- Write imperative-mood summaries under 72 characters.

## Branch Naming
- Feature branches: `feat/<short-description>`.
- Bug fixes: `fix/<short-description>`.
- Chores and maintenance: `chore/<short-description>`.

## Secrets and Sensitive Data
- Never commit API keys, tokens, or credentials to the repository.
- Use environment variables loaded from `.env` files that are listed in `.gitignore`.
- If a secret is accidentally committed, rotate it immediately and scrub the history.

## Code Quality
- Run `eslint` and `prettier` on every commit via a pre-commit hook.
- Keep the CI pipeline green; do not merge PRs with failing checks.
