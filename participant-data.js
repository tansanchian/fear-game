// One active playthrough is kept temporarily in this tab, then submitted to Supabase.
const ParticipantData = (() => {
  const runKey = 'concrete-memories.current-response.v2';
  const cleanName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const now = () => new Date().toISOString();
  const makeId = () => globalThis.crypto?.randomUUID?.() || `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  function current() {
    try {
      const value = JSON.parse(sessionStorage.getItem(runKey));
      return value && typeof value.id === 'string' ? value : null;
    } catch { return null; }
  }

  function write(response) {
    try { sessionStorage.setItem(runKey, JSON.stringify(response)); }
    catch { /* The story remains playable if session storage is unavailable. */ }
    return response;
  }

  function start(name) {
    const participantName = cleanName(name);
    if (!participantName) throw new Error('Please enter a name.');
    const startedAt = now();
    return write({
      id: makeId(), participantName, startedAt, updatedAt: startedAt, completedAt: null,
      status: 'in-progress', currentPage: 'index.html', day: 1,
      notebook: [], imaginedNotebook: [], inspected: [], effectsSeen: [],
      ending: { choice: '', comment: '' },
      activity: [{ at: startedAt, type: 'game_started', detail: {} }],
    });
  }

  function update(changes = {}) {
    const previous = current();
    return previous ? write({ ...previous, ...changes, id: previous.id, updatedAt: now() }) : null;
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

  function configuration() {
    const config = window.SUPABASE_CONFIG || {};
    const url = String(config.url || '').replace(/\/$/, '');
    const publishableKey = String(config.publishableKey || '');
    return { url, publishableKey, ready: /^https:\/\/.+\.supabase\.co$/.test(url) && publishableKey.length > 20 };
  }

  async function finish(choice, comment) {
    const completedAt = now();
    const response = update({
      status: 'complete', completedAt, remoteStatus: 'submitting',
      ending: { choice: choice === 'buy' ? 'buy' : 'pass', comment: String(comment || '').slice(0, 1200) },
    });
    track('game_completed', { choice: response?.ending.choice || choice });
    return submit();
  }

  async function submit() {
    const config = configuration();
    const response = current();
    if (!config.ready) return { ok: false, reason: 'not-configured' };
    if (!response || response.status !== 'complete') return { ok: false, reason: 'not-ready' };
    if (response.remoteStatus === 'submitted') return { ok: true, reason: 'already-submitted' };
    update({ remoteStatus: 'submitting', remoteError: '' });
    try {
      const latest = current();
      const result = await fetch(`${config.url}/rest/v1/game_responses`, {
        method: 'POST', keepalive: true,
        headers: {
          apikey: config.publishableKey,
          Authorization: `Bearer ${config.publishableKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: latest.id,
          participant_name: latest.participantName,
          started_at: latest.startedAt,
          completed_at: latest.completedAt,
          ending_choice: latest.ending.choice,
          response: latest,
        }),
      });
      if (!result.ok && result.status !== 409) throw new Error(`Submission failed (${result.status})`);
      update({ remoteStatus: 'submitted', remoteSubmittedAt: now(), remoteError: '' });
      return { ok: true };
    } catch (error) {
      update({ remoteStatus: 'failed', remoteError: String(error.message || error) });
      return { ok: false, reason: 'network', error };
    }
  }

  function endRun() {
    try { sessionStorage.removeItem(runKey); } catch {}
  }

  return { current, start, update, track, page, finish, endRun, configuration, submit };
})();
