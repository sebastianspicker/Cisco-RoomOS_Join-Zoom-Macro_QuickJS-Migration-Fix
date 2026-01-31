import test from 'node:test';
import assert from 'node:assert/strict';

import { mem, localScriptNameFrom } from '../Memory_Functions.js';

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

