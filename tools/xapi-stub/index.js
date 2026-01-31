const macros = new Map();

function normalizeActive(value) {
  return value === 'False' || value === false ? 'False' : 'True';
}

function asMacroListResponse(list) {
  return {
    Macro: list.map((m) => ({
      Name: m.Name,
      Content: m.Content,
      Active: normalizeActive(m.Active)
    }))
  };
}

function macroGet(params = {}) {
  const name = params.Name;
  const wantContent = String(params.Content).toLowerCase() === 'true';

  if (name) {
    const existing = macros.get(name);
    if (!existing) return Promise.reject(new Error(`Macro not found: ${name}`));
    return Promise.resolve(asMacroListResponse([wantContent ? existing : { Name: existing.Name }]));
  }

  if (wantContent) {
    return Promise.resolve(asMacroListResponse(Array.from(macros.values())));
  }

  return Promise.resolve(asMacroListResponse(Array.from(macros.values()).map((m) => ({ Name: m.Name }))));
}

function macroSave(params = {}, content = '') {
  const name = params.Name;
  if (!name) return Promise.reject(new Error('Macro.Save requires params.Name'));

  macros.set(name, { Name: name, Content: String(content), Active: 'True' });
  return Promise.resolve();
}

const xapi = {
  Command: {
    Macros: {
      Macro: {
        Get: macroGet,
        Save: macroSave
      }
    }
  }
};

export default xapi;

