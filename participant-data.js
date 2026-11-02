// Browser-local JSON response store. This works on static hosting such as GitHub Pages.
// Export the dashboard data to combine responses collected on different devices.
const ParticipantData = (() => {
  const databaseKey = 'concrete-memories.responses.v1';
  const runKey = 'concrete-memories.current-response.v1';

  const emptyDatabase = () => ({ version: 1, updatedAt: null, responses: [] });
  const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const now = () => new Date().toISOString();
  const makeId = () => globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function readDatabase() {
    try {
      const value = JSON.parse(localStorage.getItem(databaseKey));
      return value && value.version === 1 && Array.isArray(value.responses) ? value : emptyDatabase();
    } catch { return emptyDatabase(); }
  }

  function writeDatabase(database) {
    database.updatedAt = now();
    localStorage.setItem(databaseKey, JSON.stringify(database));
    return database;
  }

  function currentId() {
    try { return sessionStorage.getItem(runKey) || ''; }
    catch { return ''; }
  }

  function current() {
    const id = currentId();
    return id ? readDatabase().responses.find(response => response.id === id) || null : null;
  }

  function start(name) {
    const participantName = cleanName(name);
    if (!participantName) throw new Error('Please enter a name.');
    const startedAt = now();
    const response = {
      id: makeId(), participantName, startedAt, updatedAt: startedAt, completedAt: null,
      status: 'in-progress', currentPage: 'index.html', day: 1,
      notebook: [], imaginedNotebook: [], inspected: [], effectsSeen: [],
      ending: { choice: '', comment: '' },
      activity: [{ at: startedAt, type: 'game_started', detail: {} }],
    };
    const database = readDatabase();
    database.responses.push(response);
    writeDatabase(database);
    sessionStorage.setItem(runKey, response.id);
    return response;
  }

  function update(changes = {}) {
    const id = currentId();
    if (!id) return null;
    const database = readDatabase();
    const index = database.responses.findIndex(response => response.id === id);
    if (index < 0) return null;
    const previous = database.responses[index];
    database.responses[index] = { ...previous, ...changes, id, updatedAt: now() };
    writeDatabase(database);
    return database.responses[index];
  }

  function track(type, detail = {}) {
    const response = current();
    if (!response) return null;
    const activity = Array.isArray(response.activity) ? response.activity.slice(-249) : [];
    const previous = activity.at(-1);
    const entry = { at: now(), type: String(type).slice(0, 60), detail };
    if (previous?.type === entry.type && JSON.stringify(previous.detail) === JSON.stringify(entry.detail)) return response;
    activity.push(entry);
    return update({ activity });
  }

  function page(name) {
    update({ currentPage: name });
    track('page_viewed', { page: name });
  }

  function finish(choice, comment) {
    const completedAt = now();
    const response = update({
      status: 'complete', completedAt,
      ending: { choice: choice === 'buy' ? 'buy' : 'pass', comment: String(comment || '').slice(0, 1200) },
    });
    track('game_completed', { choice: response?.ending.choice || choice });
    return response;
  }

  function endRun() {
    try { sessionStorage.removeItem(runKey); } catch {}
  }

  function importDatabase(value) {
    const incoming = value?.version === 1 && Array.isArray(value.responses) ? value.responses : Array.isArray(value) ? value : null;
    if (!incoming) throw new Error('This is not a Concrete Memories response file.');
    const database = readDatabase();
    const byId = new Map(database.responses.map(response => [response.id, response]));
    for (const response of incoming) {
      if (!response || typeof response.id !== 'string' || typeof response.participantName !== 'string') continue;
      const existing = byId.get(response.id);
      if (!existing || String(response.updatedAt || '') > String(existing.updatedAt || '')) byId.set(response.id, response);
    }
    database.responses = [...byId.values()];
    return writeDatabase(database);
  }

  return { readDatabase, current, start, update, track, page, finish, endRun, importDatabase };
})();
