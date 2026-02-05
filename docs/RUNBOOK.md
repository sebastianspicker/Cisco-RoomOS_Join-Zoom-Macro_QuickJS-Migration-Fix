# Runbook

## Prerequisites
- Node.js 18+ (for `node --test`)
- npm (comes with Node)

## Setup
- Install dependencies:
  ```bash
  npm ci
  ```

## Fast Loop
- Lint + tests:
  ```bash
  npm run smoke
  ```

## Lint
```bash
npm run lint
```

## Tests
```bash
npm test
```

## Build
- Not applicable (this repo ships macro source files only).

## Typecheck / Static Checks
- No TypeScript or separate typecheck configured.

## Security
- Secret scan (basic pattern search):
  ```bash
  if git ls-files -z | xargs -0 grep -IlE --exclude=.github/workflows/ci.yml --exclude=docs/RUNBOOK.md -- '-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----|-----BEGIN PRIVATE KEY-----|AKIA[0-9A-Z]{16}|xox[baprs]-'; then
    echo "Potential secret patterns detected. Remove and rotate any exposed keys."
    exit 1
  fi
  ```
- Dependency audit (SCA):
  ```bash
  npm audit --audit-level=high
  ```
- SAST: not configured.
- SAST (CI): CodeQL runs in GitHub Actions on push/PR.

## Troubleshooting
- If `node --test` fails to resolve `xapi`, confirm `npm ci` completed and the local `file:./tools/xapi-stub` dependency is installed.
- If ESLint fails on globals, re-check `eslint.config.js` and the `globals` package version.
