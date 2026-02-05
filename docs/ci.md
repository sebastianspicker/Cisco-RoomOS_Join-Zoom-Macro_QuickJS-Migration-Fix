# CI Overview

Workflows
- `CI` runs lint, unit tests, a basic secret scan, and `npm audit`. It also uploads CI artifacts.
- `CodeQL` runs static security analysis.

Triggers
- `CI`: `push` to `main`/`master` and all `pull_request` events.
- `CodeQL`: `push` to `main`/`master`, `pull_request` from the same repository, and a weekly schedule.

Local execution
- Full local CI:
  ```bash
  ./scripts/ci-local.sh
  ```
- Fast loop:
  ```bash
  npm run smoke
  ```

Artifacts
- CI uploads `artifacts/ci-smoke.log` and `artifacts/npm-audit.json` per Node version.
- Artifacts are not committed and are ignored via `.gitignore`.

Caching
- `actions/setup-node@v4` caches the npm cache keyed by `package-lock.json`.

Permissions and secrets
- `CI` uses `contents: read` only.
- `CodeQL` uses `security-events: write` and is skipped on fork PRs.
- No repository secrets are required.

Extending CI
- Add new jobs with explicit `permissions`, `timeout-minutes`, and `concurrency`.
- Prefer deterministic commands (`npm ci`, lockfiles) and fast checks on PRs.
- If a job needs secrets, restrict it to `push` on default branch or `workflow_dispatch`.

Optional local runner
- You can use `act` for a local run of GitHub Actions, but avoid secrets and document any differences.
