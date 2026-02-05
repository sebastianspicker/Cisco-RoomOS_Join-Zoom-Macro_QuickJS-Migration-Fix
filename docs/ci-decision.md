# CI Decision

Date: 2026-02-05

Decision: FULL CI

Why this repo should have CI
- It contains executable JavaScript macro code plus unit tests and linting.
- Checks are deterministic and fast on GitHub-hosted runners.
- No production secrets or live infrastructure access are required.

What runs where
- Pull requests: `CI` workflow (lint, tests, basic secret scan, npm audit). `CodeQL` runs only for same-repo PRs, not fork PRs.
- Push to `main`/`master`: `CI` workflow plus `CodeQL`.
- Schedule: weekly `CodeQL` scan.

Threat model for CI
- Untrusted fork PRs get read-only permissions and do not receive secrets.
- No `pull_request_target` usage to avoid token exposure.
- `CodeQL` is skipped on fork PRs because it needs `security-events: write`.
- All actions are pinned to stable major versions and run with least privilege.

If we later want expanded CI
- Add integration tests against real RoomOS hardware or a simulator.
- Provide a self-hosted runner in the same network as devices.
- Add secrets for device access in `workflow_dispatch` or `push`-only jobs.
- Document new trust boundaries and update permissions.
