#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run smoke
npm audit --audit-level=high
