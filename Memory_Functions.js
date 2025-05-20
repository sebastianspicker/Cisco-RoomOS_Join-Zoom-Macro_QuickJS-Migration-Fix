/**
 * Author und Project-Lead:   Zacharie Gignac
 * Co-Author und Tester:      Robert McGonigle
 * Update 2025:				  Sebastian J. Spicker
 *
 * CIFSS – Université Laval
 * Harvard University IT
 * Cologne University of Music
 *
 * Released:  November 2020
 * Updated:   Mai 2025  (RoomOS 11.28-Fix)
 *
 * Beschreibung:
 *   Asynchrones Lesen/Schreiben permanenter Daten über das Macro-Subsystem
 *   Für Details siehe:
 *   https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage
 */

/* ------------------------------------------------------------------ */
/*  0)   BASIS-IMPORTS UND KONFIGURATION                               */
/* ------------------------------------------------------------------ */
import xapi from 'xapi';

const config = {
  storageMacro: 'Memory_Storage',     // Name des Storage-Macros
  autoImport: {
    mode: 'false',                    // true | false | "activeOnly" | "custom" | "customActive"
    customImport: []                  // nur bei "custom*" benutzt
  }
};

/* ------------------------------------------------------------------ */
/*  1)   MEM-OBJEKT INITIALISIEREN                                    */
/* ------------------------------------------------------------------ */
const mem = {};                 // **globale zentrale Ablage** für alle Funktionen

/* ------------------------------------------------------------------ */
/*  2)   PATCH: localScript-Namen FESTLEGEN (RoomOS ≥ 11.28)          */
/* ------------------------------------------------------------------ */
(function applyLocalScriptName () {

  /* QuickJS / ES-Module (RoomOS 11.28 ff.) */
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    mem.localScript = import.meta.url.split('/').pop().replace(/\.js$/i, '');
    return;
  }

  /* Ältere Firmware mit CommonJS-Shim */
  if (typeof module !== 'undefined' && module.name) {
    mem.localScript = module.name;
    return;
  }

  /* Fallback (sollte praktisch nie greifen) */
  mem.localScript = 'Memory_Functions';
})();

/* ------------------------------------------------------------------ */
/*  3)   INITIALISIERUNG DES STORAGE-MACROS                           */
/* ------------------------------------------------------------------ */
function memoryInit () {
  return new Promise((resolve) => {

    /*  Prüfen, ob das Storage-Macro bereits existiert  */
    xapi.Command.Macros.Macro.Get({ Name: config.storageMacro })
      .then(() => resolve())                   // vorhanden → fertig
      .catch(() => {                           // nicht vorhanden → anlegen
        console.warn(`No storage macro found, creating "${config.storageMacro}" ...`);

        const initialContent =
`var memory = {
    "./_$Info": {
        "Warning": "Do NOT modify this document, as other Scripts/Macros may rely on this information",
        "AvailableFunctions": {
            "local": [
                "mem.read('key')",
                "mem.write('key', 'value')",
                "mem.remove('key')",
                "mem.print()"
            ],
            "global": [
                "mem.read.global('key')",
                "mem.write.global('key', 'value')",
                "mem.remove.global('key')",
                "mem.print.global()"
            ]
        },
        "Guide": "https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage"
    },
    "ExampleKey": "Example Value"
}`;

        return xapi.Command.Macros.Macro.Save({ Name: config.storageMacro }, initialContent)
          .then(() => mem.print.global());
      })
      .finally(resolve);
  });
}

/* ------------------------------------------------------------------ */
/*  4)   AUTO-IMPORT-UNTERSTÜTZUNG                                    */
/* ------------------------------------------------------------------ */

/*  Template, das in andere Makros eingefügt wird, falls dort xapi/mem
    noch nicht importiert sind.  Die Zuweisung von localScript nutzt
    **bereits** den neuen ES-Modul-Ansatz und ist damit zukunftssicher.   */
const importTemplate =
`import xapi from 'xapi';
import { mem } from './Memory_Functions';

mem.localScript = (typeof import.meta !== 'undefined' && import.meta.url)
  ? import.meta.url.split('/').pop().replace(/\\.js$/i, '')
  : 'Unknown';

`;

function importMem () {
  return new Promise((resolve) => {

    xapi.Command.Macros.Macro.Get({ Content: 'True' })
      .then((macroList) => {

        /* Regex erkennt bereits vorhandene Imports bzw. localScript-Setzung */
        const importRegex =
          /(\s*import\s+xapi\s+from\s+'xapi'(?:;|\s*)(?:\n|\r)*)?(\s*import\s+{\s*mem\s*}\s+from\s+'.\/Memory_Functions'(?:;|\s*)(?:\n|\r)*)?(\s*mem\.localScript\s*=.*(?:;|\s*))?/;

        macroList.Macro.forEach((m) => {

          const hasXapi   = /\s*import\s+xapi\s+from\s+'xapi'/.test(m.Content);
          const hasMemImp = /import\s+{\s*mem\s*}\s+from\s+'.\/Memory_Functions'/.test(m.Content);
          const hasLocal  = /mem\.localScript\s*=/.test(m.Content);

          const needsPatch = !(hasXapi && hasMemImp && hasLocal);

          /*   Das eigene Storage-/Utility-Macro NIE patchen,
               sonst droht Rekursion.                                */
          if (!needsPatch ||
              m.Name === 'Memory_Functions' ||
              m.Name === config.storageMacro) {
            return;
          }

          /*  Entscheidung nach autoImport-Modus  */
          const doPatch = (() => {
            switch (config.autoImport.mode) {
              case true:
              case 'true':
                return true;                                         // immer
              case false:
              case 'false':
                return false;                                        // nie
              case 'activeOnly':
                return m.Active === 'True';
              case 'custom':
                return config.autoImport.customImport.includes(m.Name);
              case 'customActive':
                return m.Active === 'True' &&
                       config.autoImport.customImport.includes(m.Name);
              default:
                console.error(`Configuration Error: autoImport.mode "${config.autoImport.mode}" unknown – defaulting to "false".`);
                return false;
            }
          })();

          if (!doPatch) { return; }

          /*  Patch einfügen  */
          const newContent = m.Content.replace(importRegex, importTemplate);
          console.log(`Added mem-import to macro "${m.Name}".`);
          xapi.Command.Macros.Macro.Save({ Name: m.Name }, newContent);
        });
      })
      .finally(resolve);
  });
}

/* ------------------------------------------------------------------ */
/*  5)   HILFS-FUNKTIONEN (READ / WRITE / REMOVE / PRINT)             */
/* ------------------------------------------------------------------ */

mem.read = (key) => new Promise((resolve, reject) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const raw   = e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{');
      const store = JSON.parse(raw);
      const scope = store[mem.localScript] || {};

      if (key in scope) {
        resolve(scope[key]);
      } else {
        reject(new Error(`Local Read Error – key "${key}" not found in "${mem.localScript}".`));
      }
    });
});

mem.read.global = (key) => new Promise((resolve, reject) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const raw   = e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{');
      const store = JSON.parse(raw);

      if (key in store) {
        resolve(store[key]);
      } else {
        reject(new Error(`Global Read Error – key "${key}" not found.`));
      }
    });
});

mem.write = (key, value) => new Promise((resolve) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const store = JSON.parse(e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{'));
      const scope = store[mem.localScript] || {};
      scope[key]  = value;
      store[mem.localScript] = scope;

      return xapi.Command.Macros.Macro.Save(
        { Name: config.storageMacro },
        `var memory = ${JSON.stringify(store, null, 4)}`
      );
    })
    .then(() => {
      console.debug(`Local Write: [${mem.localScript}] ${key} = ${value}`);
      resolve(value);
    });
});

mem.write.global = (key, value) => new Promise((resolve) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const store = JSON.parse(e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{'));
      store[key]  = value;

      return xapi.Command.Macros.Macro.Save(
        { Name: config.storageMacro },
        `var memory = ${JSON.stringify(store, null, 4)}`
      );
    })
    .then(() => {
      console.debug(`Global Write: ${key} = ${value}`);
      resolve(value);
    });
});

mem.remove = (key) => new Promise((resolve, reject) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const store = JSON.parse(e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{'));
      const scope = store[mem.localScript] || {};

      if (!(key in scope)) {
        reject(new Error(`Local Delete Error – key "${key}" not found.`));
        return;
      }

      const oldVal = scope[key];
      delete scope[key];
      store[mem.localScript] = scope;

      xapi.Command.Macros.Macro.Save(
        { Name: config.storageMacro },
        `var memory = ${JSON.stringify(store)}`
      ).then(() => {
        console.warn(`Local key "${key}" (${oldVal}) deleted from ${mem.localScript}.`);
        resolve(key);
      });
    });
});

mem.remove.global = (key) => new Promise((resolve, reject) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const store = JSON.parse(e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{'));

      if (!(key in store)) {
        reject(new Error(`Global Delete Error – key "${key}" not found.`));
        return;
      }

      const oldVal = store[key];
      delete store[key];

      xapi.Command.Macros.Macro.Save(
        { Name: config.storageMacro },
        `var memory = ${JSON.stringify(store, null, 4)}`
      ).then(() => {
        console.warn(`Global key "${key}" (${oldVal}) deleted.`);
        resolve(key);
      });
    });
});

mem.print = () => new Promise((resolve, reject) => {
  mem.read.global(mem.localScript)
    .then((data) => { console.log(data); resolve(data); })
    .catch(reject);
});

mem.print.global = () => new Promise((resolve) => {
  xapi.Command.Macros.Macro.Get({ Content: 'True', Name: config.storageMacro })
    .then((e) => {
      const store = JSON.parse(e.Macro[0].Content.replace(/var.*memory.*=\s*{/, '{'));
      console.log(store);
      resolve(store);
    });
});

mem.info = () => {
  mem.read.global('./_$Info').then(console.log);
};

/* ------------------------------------------------------------------ */
/*  6)   INITIAL STARTUP SEQUENCE                                     */
/* ------------------------------------------------------------------ */
memoryInit()
  .then(importMem)
  .catch((e) => console.error(e));

/* ------------------------------------------------------------------ */
/*  7)   EXPORT                                                       */
/* ------------------------------------------------------------------ */
export { mem };
