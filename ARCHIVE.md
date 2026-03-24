# Repository archive notice

This repository is **archived** as of **May 2025**. It is read-only and no longer actively maintained.

**Reason:** Cisco now provides native Zoom integration (OBTP via Hybrid Calendar, Zoom Rooms Connector) that supersedes community macros. This repository is preserved for reference and for existing deployments that still rely on the QuickJS migration fix.

---

## Keep / Remove / Move list (with rationale)

### Keep

| Item | Rationale |
|------|------------|
| `JoinZoom_Main_4-1-1.js` | Runnable macro; core deliverable. |
| `Memory_Functions.js` | Runnable macro; core deliverable. |
| `test/memory-functions.test.js` | Runnable tests; required for validation. |
| `tools/xapi-stub/` | Dev dependency for local lint/test; required for `npm test` and `npm run lint`. |
| `package.json`, `package-lock.json` | Dependency and script definitions; required for install/lint/test. |
| `eslint.config.js` | Lint configuration; required for `npm run lint`. |
| `README.md` | Primary user-facing documentation; minimal and final. |
| `LICENSE` | Legal terms. |
| `SECURITY.md` | Security policy and reporting; minimal and final. |
| `CONTRIBUTING.md` | Contribution guidelines; minimal and final for archive. |
| `.github/` (workflows, ISSUE_TEMPLATE, dependabot, pull_request_template) | CI and community templates; standard for GitHub. |
| `.editorconfig`, `.gitignore` | Editor and Git configuration; standard. |

### Remove (WIP / process artifacts)

| Item | Rationale |
|------|------------|
| Former audit material (progress, instructions, runner, PRD) | Transient and process artifacts; not part of final deliverable. |

---

## Final folder structure

```
.
├── .editorconfig
├── .gitignore
├── .github/
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       └── codeql.yml
├── ARCHIVE.md          (this file)
├── CONTRIBUTING.md
├── eslint.config.js
├── JoinZoom_Main_4-1-1.js
├── LICENSE
├── Memory_Functions.js
├── package.json
├── package-lock.json
├── README.md
├── SECURITY.md
├── test/
│   └── memory-functions.test.js
└── tools/
    └── xapi-stub/
        ├── index.js
        └── package.json
```

---

## Validation commands (build / run / test)

All commands assume Node.js 18+ and are run from the repository root.

| Command | Purpose |
|---------|---------|
| `npm ci` | Install dependencies (including local `xapi` stub). |
| `npm run lint` | Run ESLint (no build step; macros are interpreted on device). |
| `npm test` | Run Node.js test runner for `test/memory-functions.test.js`. |
| `npm run smoke` | Run `npm run lint` and `npm test` (full local gate). |

Quick validation (single line):

```bash
npm ci && npm run smoke
```

There is no separate “build” step; the macro files are deployed as-is to RoomOS devices.
