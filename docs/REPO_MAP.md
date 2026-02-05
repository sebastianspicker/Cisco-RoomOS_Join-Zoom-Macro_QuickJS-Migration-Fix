# Repo Map

## Top Level
- `JoinZoom_Main_4-1-1.js`: Primary macro entry point for Join Zoom UI + call handling. Depends on configuration, UI text, and memory utilities.
- `Memory_Functions.js`: Macro memory utility. Provides `mem` API (global + scoped) and auto-import patching for other macros. Handles QuickJS vs Duktape local script naming.
- `README.md`: Usage and migration guidance for QuickJS `module.name` removal.
- `eslint.config.js`: ESLint configuration for Node + browser globals.
- `package.json`: Scripts (`lint`, `test`, `smoke`) and dev dependencies.
- `test/`: Node tests for `Memory_Functions` behavior.
- `tools/xapi-stub/`: Local stub for Cisco `xapi` used by tests.

## Key Modules
- `Memory_Functions.js`
  - `localScriptNameFrom()`: Derives a script name from `import.meta.url` or legacy `module.name`.
  - `mem.*`: Read/write/remove/print helpers (global + scoped) over `xapi.Command.Macros.Macro` storage.
  - `memoryInit()`: Ensures the storage macro exists.
  - `importMem()`: Auto-import helper for patching other macros.

- `JoinZoom_Main_4-1-1.js`
  - Initializes UI state, call detection, and Zoom-specific tooling.
  - Uses scoped memory (`mem.for(localScriptName)`) to avoid cross-macro collisions.

## Tests
- `test/memory-functions.test.js`: Validates `localScriptNameFrom`, scoped memory isolation, and global read/write.

## External/Expected Dependencies
- `JoinZoom_Config_4-1-1` and `JoinZoom_JoinText_4-1-1` are imported by `JoinZoom_Main_4-1-1.js` but not present in this repository.
- `xapi` is stubbed locally for tests via `tools/xapi-stub`.

## Hot Spots / Risk Areas
- `Memory_Functions.js`: Parsing and persistence of the macro storage document; errors here affect all macros using shared storage.
- `JoinZoom_Main_4-1-1.js`: Runtime behavior depends on missing config/text macros; integration risks if versions drift.
