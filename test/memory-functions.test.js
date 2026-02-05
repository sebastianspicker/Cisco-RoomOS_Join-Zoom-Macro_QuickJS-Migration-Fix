import test from 'node:test';
import assert from 'node:assert/strict';

import { mem, localScriptNameFrom, importMem, config } from '../Memory_Functions.js';
import xapi from 'xapi';

test('localScriptNameFrom derives name from url', () => {
  assert.equal(
    localScriptNameFrom({ importMetaUrl: 'file:///a/b/JoinZoom_Main_4-1-1.js' }),
    'JoinZoom_Main_4-1-1'
  );
});

test('mem.for() isolates local scopes without touching mem.localScript', async () => {
  const a = mem.for('ScriptA');
  const b = mem.for('ScriptB');

  await a.write('k', 'va');
  await b.write('k', 'vb');

  assert.equal(await a.read('k'), 'va');
  assert.equal(await b.read('k'), 'vb');
});

test('global read/write works', async () => {
  await mem.write.global('GlobalKey', 'GlobalVal');
  assert.equal(await mem.read.global('GlobalKey'), 'GlobalVal');
});

test('importMem awaits macro save operations', async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));

  const originalSave = xapi.Command.Macros.Macro.Save;
  const originalMode = config.autoImport.mode;

  let resolveSave;
  const savePromise = new Promise((resolve) => { resolveSave = resolve; });
  let saveCalls = 0;

  try {
    await originalSave({ Name: 'TestMacro' }, "const a = 1;");

    xapi.Command.Macros.Macro.Save = (params, content) => {
      saveCalls += 1;
      return savePromise.then(() => originalSave(params, content));
    };

    config.autoImport.mode = true;

    const importPromise = importMem();
    let settled = false;
    importPromise.then(() => { settled = true; });

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(settled, false);

    resolveSave();
    await importPromise;

    assert.equal(settled, true);
    assert.ok(saveCalls >= 1);
  } finally {
    xapi.Command.Macros.Macro.Save = originalSave;
    config.autoImport.mode = originalMode;
  }
});
