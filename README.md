# Join-Zoom Macro · QuickJS Migration Fix  
**Resolve the `ReferenceError: 'module' is not defined` error on Cisco RoomOS 11.28 +**

## Background

| RoomOS build | Macro engine | Module system | CommonJS globals (`module`, `require`, …) |
|--------------|--------------|---------------|-------------------------------------------|
| **≤ 11.27**  | Duktape      | CommonJS-shim | *Available* (in every script)             |
| **≥ 11.28**  | QuickJS      | **Native ES Modules** | **Removed**                               |

Beginning with **RoomOS 11.28** Cisco replaced the legacy Duktape runtime with QuickJS to provide full ES-module support.  
All Node/CommonJS compatibility shims (`module`, `exports`, `require`, `__filename`, …) were dropped.

The original *[*Join-Zoom 4-1-1*](https://github.com/CiscoDevNet/roomdevices-macros-samples/tree/master/Join%20Zoom%20with%20DTMF%20Zoom%20Tools)
 macro suite (and many other community macros) still contain lines such as:

```js
mem.localScript = module.name;
````

QuickJS does not recognise `module`, so the macro fails to compile and RoomOS logs:

```
ReferenceError: 'module' is not defined
```

## Symptoms

* **Macros stop at start-up** – the console shows the error above.
* No *Join Zoom* button, *Zoom Tools* panel or Zoom dial-strings are available.
* Older codecs (≤ RoomOS 11.27) still work – the issue appears only after the firmware upgrade.

## Root Cause

`module.name` was a Duktape convenience that returned the current file name.
In proper ES Modules the equivalent information lives in **`import.meta.url`**.
Failing to migrate that single call breaks every macro that touches it.

## The Fix

### Universal replacement snippet

```js
/* Sets mem.localScript in every firmware version */
mem.localScript = (typeof import.meta !== 'undefined' && import.meta.url)
  ? import.meta.url.split('/').pop().replace(/\.js$/i, '')      // QuickJS / ES Modules
  : (typeof module !== 'undefined' && module.name)              // legacy Duktape
  || 'UnknownScript';                                           // final fallback
```

### Files you must patch

| File                     | Lines to change                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Memory_Functions.js`    | remove the old assignment, insert the snippet                                                                                                    |
| `JoinZoom_Main_4-1-1.js` | 1. replace the combined `import { mem } … module.name` line<br>2. change `mem.remove.global(module.name)` → `mem.remove.global(mem.localScript)` |
| Any other custom macro   | Search for **`module.name`** and replace it exactly the same way                                                                                 |

### Step-by-step

1. **Macro Editor → Memory\_Functions.js**

   * Delete `mem.localScript = module.name;`
   * Paste the replacement snippet shown above.

2. **Macro Editor → JoinZoom\_Main\_4-1-1.js**

   * Split the import line and insert the snippet.
   * Update the single `mem.remove.global(module.name)` call.

3. **Search the rest of your macros** (`Ctrl/⌘ + F → module.name`).
   Apply the same change wherever it appears.

4. **Save all files** → *Macros › Restart all*.

5. **Verify** – the console should no longer display the ReferenceError and the Join-Zoom UI should load.

## Compatibility Matrix

| Firmware                         | Patched macros | Result                                               |
| -------------------------------- | -------------- | ---------------------------------------------------- |
| RoomOS ≤ 11.27 (Duktape)         | ✅              | Works – falls back to `module.name`                  |
| RoomOS 11.28 … current (QuickJS) | ✅              | Works – uses `import.meta.url`                       |
| Any firmware                     | ❌ (old code)   | Fails with `ReferenceError: 'module' is not defined` |

## Optional – Let *Memory\_Functions* patch imports automatically

If you enable

```js
const config = {
  autoImport: { mode: true }   // or "activeOnly" / "custom" / "customActive"
}
```

`Memory_Functions.js` will automatically inject

```js
import { mem } from './Memory_Functions';
mem.localScript = …   // ES-module version
```

into every macro that still lacks it.
You still need to **manually delete any hard-coded `module.name`** inside those files – the auto-import only adds, it does not rewrite existing lines.

## FAQ

### “Couldn’t we just re-enable the old engine?”

RoomOS offers the setting

```
xConfiguration Macros QuickJSEngine Off
```

to fall back to Duktape. Cisco marks this switch as **deprecated** and it will disappear in a future release. Migrating now is safer and future-proof.

### “Will this break older codecs?”

No. The snippet keeps the legacy path (`module.name`) for devices that still run the old firmware.

## Credits

* **Robert McGonigle Jr** — original Join-Zoom macros
* **Zacharie Gignac** — Memory Functions utility
* Migration patch & README by  **Sebastian J. Spicker** (May 2025)

## 9 · License

This documentation follows the same license as the original project.
See [LICENSE](./LICENSE) for details.
