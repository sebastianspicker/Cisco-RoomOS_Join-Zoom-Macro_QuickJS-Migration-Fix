# Contributing

Thanks for taking the time to contribute.

## Scope and environment

This repo contains Cisco RoomOS macros intended to run on RoomOS (QuickJS / ES Modules).
The `package.json` tooling is only for offline linting and smoke tests (it uses a local `xapi` stub).

## Development

- Install: `npm ci`
- Lint: `npm run lint`
- Tests: `npm test`
- All gates: `npm run smoke`

## Pull requests

- Keep changes small and focused (macro code is deployed onto devices).
- Avoid introducing TypeScript.
- Prefer backwards compatibility with RoomOS ≤ 11.27 where feasible.
- If you change behavior, update `README.md` accordingly.

