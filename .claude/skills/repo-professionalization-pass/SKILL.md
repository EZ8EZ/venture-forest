# Skill: Repo Professionalization Pass

## Purpose
Elevate the repository to a professional, open-source-ready standard covering code quality, documentation, and configuration.

## When to Use
- Preparing for an open-source release or public demo.
- After a major development sprint that may have accumulated rough edges.

## Steps
1. Verify `.gitignore` covers: `node_modules`, `.env*`, `dist`, `.vercel`, `.DS_Store`.
2. Confirm ESLint and Prettier configs exist and run without errors: `pnpm lint`.
3. Check that all `package.json` files have correct `name`, `version`, `description`, and `license` fields.
4. Verify TypeScript strict mode is enabled in all `tsconfig.json` files.
5. Ensure CI workflow (GitHub Actions) runs lint, type-check, unit tests, and build.
6. Confirm no secrets, API keys, or credentials are committed (search for common patterns).
7. Verify conventional commit messages in recent history.
8. Check that all documentation files are current, accurate, and free of em dashes.
9. Add a `LICENSE` file if missing (MIT recommended).
10. Add a `CONTRIBUTING.md` if targeting external contributors.

## Key Files
- `.gitignore`, `.eslintrc.*`, `.prettierrc`, `tsconfig.json` - repo config.
- `.claude/rules/repo-hygiene.md` - hygiene standards.
- `.claude/rules/docs-style.md` - documentation style guide.
