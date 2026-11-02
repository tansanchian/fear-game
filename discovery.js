// Reveal rules and notebook metadata. Navigation remains available on every pass.
const Discovery = (() => {
  const storageKey = 'concrete-memories.discovery.v1';
  const evidence = Object.fromEntries(Object.entries(DAY_CONTENT).flatMap(([day, content]) =>
    Object.entries(content.evidence).map(([id, entry]) => [id, { ...entry, day: Number(day) }])));
  const hotspotIds = new Set(Object.values(DAY_CONTENT).flatMap(content => Object.keys(content.hotspots)));
  const effectIds = new Set(['power-dim', 'filming-voices', 'children-laughter', 'electrical-buzz']);
  const freshState = () => ({ day: 1, phase: 'exploring', pass: 1, direction: 1, collected: [], unread: [], inspected: [], effectsSeen: [], day2Steps: 0, soundEnabled: true, warningSeen: false, snapshot: null });
  let state = freshState();
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && [1, 2, 3].includes(saved.pass) && saved.direction === (saved.pass === 2 ? -1 : 1)) {
      const day = Object.hasOwn(DAY_CONTENT, saved.day) ? saved.day : 1;
      const collected = Array.isArray(saved.collected) ? [...new Set(saved.collected)].filter(id => evidence[id] && evidence[id].day <= day) : [];
      const inspected = (Array.isArray(saved.inspected) ? saved.inspected : collected).filter(id =>
        Object.hasOwn(DAY_CONTENT[day].hotspots, id) || evidence[id]?.day === day);
      state = { ...freshState(), day, phase: day === 1 && ['reflection', 'home'].includes(saved.phase) ? saved.phase : 'exploring',
        pass: saved.pass, direction: saved.direction, collected, inspected: [...new Set(inspected)],
        soundEnabled: saved.soundEnabled !== false,
        effectsSeen: day === 2 && Array.isArray(saved.effectsSeen) ? [...new Set(saved.effectsSeen.filter(id => effectIds.has(id)))] : [],
        day2Steps: day === 2 && Number.isInteger(saved.day2Steps) ? Math.max(0, Math.min(8, saved.day2Steps)) : 0,
        unread: (Array.isArray(saved.unread) ? saved.unread : []).filter(id => collected.includes(id)),
        snapshot: saved.snapshot, warningSeen: saved.warningSeen === true };

    }
  } catch { /* Storage can be unavailable; the current run still works. */ }
  const button = document.getElementById('notebook-button');
  const dialog = document.getElementById('notebook');
  const prompt = document.getElementById('journey-prompt');
  const toast = document.getElementById('discovery-toast');
  const dayDialog = document.getElementById('day-transition');
  const conversationDialog = document.getElementById('neighbour-conversation');
  const doorDialog = document.getElementById('door-encounter');
  let api;
  let toastTimer;
  let notebook;
  let resetting = false;

  function persist() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* In-memory fallback. */ }
  }
  function save(snapshot) { if (resetting) return; state.snapshot = snapshot; persist(); }
  function available(id) {
    if (evidence[id]) return evidence[id].day === state.day && state.pass >= evidence[id].pass;
    if (hotspotIds.has(id)) {
      const rule = DAY_CONTENT[state.day].hotspots[id];
      return typeof rule === 'number' ? state.pass >= rule : typeof rule === 'string' && available(rule);
    }
    return ['map', 'flat', 'view-flat-door'].includes(id);
  }
  function inspectionId(id) {
    const rule = DAY_CONTENT[state.day].hotspots[id];
    if (typeof rule === 'string') return rule;
    return typeof rule === 'number' || evidence[id]?.day === state.day ? id : null;
  }
  function exhausted() {
    const limit = DAY_CONTENT[state.day].inspectionLimit;
    return Number.isInteger(limit) && state.inspected.length >= limit;
  }
  function canInspect(id) {
    const key = inspectionId(id);
    return state.phase === 'exploring' && available(id) && (!key || !exhausted() || state.inspected.includes(key));
  }
  function inspect(id) {
    const key = inspectionId(id);
    if (!key || !canInspect(id) || state.inspected.includes(key)) return;
    state.inspected.push(key);
    const limit = DAY_CONTENT[state.day].inspectionLimit;
    if (Number.isInteger(limit) && limit - state.inspected.length <= 2 && !state.warningSeen) {
      state.warningSeen = true;
      notify(state.day === 1
        ? 'It’s getting late. You have time to look at a couple more things before heading home.'
        : 'Something about this block stays on your mind. You wonder what you might find online.', 7500);
    }
    persist();
  }
  function notify(message, duration = 3600) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
  }
  function updateBadge() {
    document.getElementById('notebook-badge').textContent = String(state.unread.length);
    document.getElementById('notebook-badge').hidden = !state.unread.length;
    button.setAttribute('aria-label', `Notebook${state.unread.length ? `, ${state.unread.length} new discoveries` : ''}`);
  }
  function record(id) {
    if (!evidence[id] || !canInspect(id)) return;
    if (state.collected.includes(id)) { inspect(id); return; }
    state.collected.push(id);
    state.unread.push(id);
    persist();
    updateBadge();
    notify(id === 'powerClose' ? 'Notebook updated · Meter number' : `Added to notebook · ${evidence[id].title}`);
    inspect(id);
  }
  function move(from, to) {
    if (state.day === 2 && from !== to) state.day2Steps = Math.min(8, state.day2Steps + 1);
    if (state.pass === 1 && from === 4 && to === 3) {
      state.pass = 2; state.direction = -1;
    } else if (state.pass === 2 && from === 0 && to === 1) {
      state.pass = 3; state.direction = 1;
    }
  }
  function render({ introActive, busy, artifact, position, doorPromptOpen, inspecting }) {
    button.disabled = busy;
    // Return on every visit to the end on either day, including restored saves.
    // Reading and story transitions take precedence over the navigation reminder.
    prompt.hidden = state.phase !== 'exploring' || exhausted() || MemoryJourney.active() || introActive || busy || Boolean(artifact) || doorPromptOpen || inspecting || position !== 4 || dialog.open || conversationDialog.open || doorDialog.open;
    updateBadge();
    if (state.phase === 'exploring' && exhausted() && !introActive && !busy && (!artifact || artifact === 'flat' || artifact === 'map') && !inspecting && !dialog.open && !conversationDialog.open && !doorDialog.open) {
      if (state.day === 1) { state.phase = 'reflection'; persist(); }
      else if (MemoryJourney.phase() === 'idle') MemoryJourney.advance('preview');
    }
    if (state.phase !== 'exploring' && !busy) showDayTransition();
    if (state.day === 2 && MemoryJourney.active() && !busy) {
      clearTimeout(toastTimer); toast.hidden = true;
      MemoryTransition.sync({ position });
    }
  }
  function open() {
    if (resetting || button.disabled || dialog.open || conversationDialog.open || doorDialog.open || MemoryJourney.active()) return;
    notebook.open();
    state.unread = []; persist(); updateBadge();
    api.refresh();
  }
  button.addEventListener('click', open);
  document.getElementById('journey-action').addEventListener('click', () => {
    if (!prompt.hidden) void api.walkBack();
  });
  document.getElementById('new-game').addEventListener('click', () => {
    resetting = true;
    state = freshState();
    MemoryJourney.reset();
    persist(); window.location.reload();
  });
  function showDayTransition() {
    prompt.hidden = true;
    clearTimeout(toastTimer);
    toast.hidden = true;
    document.getElementById('day-transition-label').textContent = state.phase === 'reflection' ? 'DAY 1 · EVENING' : 'LATER THAT EVENING';
    document.getElementById('day-transition-title').textContent = state.phase === 'reflection' ? 'Time to head home' : 'An evening at home';
    document.getElementById('day-transition-copy').textContent = state.phase === 'reflection'
      ? 'After a day looking around, you know a little more about the block. But the details have left you with more questions, and a growing sense of unease. You decide to head home and talk it through with your wife.'
      : 'At home, you talk to your wife about the visit. There is still more you want to understand. The next morning, you decide to return to the block for another look.';
    document.getElementById('day-transition-next').textContent = state.phase === 'reflection' ? 'Head home' : 'Return the next morning';
    const notes = document.getElementById('day-transition-notes');
    notes.replaceChildren();
    const today = [...new Set(state.collected.filter(id => evidence[id].day === state.day).map(id => evidence[id].group))];
    document.getElementById('day-notes-heading').hidden = state.phase !== 'home' || !today.length;
    notes.hidden = state.phase !== 'home';
    for (const group of today) {
      const item = document.createElement('li'); item.textContent = evidence[group].description; notes.append(item);
    }
    if (!dayDialog.open) { dayDialog.showModal(); document.getElementById('day-transition-next').focus(); }
  }
  dayDialog.addEventListener('cancel', event => event.preventDefault());
  document.getElementById('day-transition-notebook').addEventListener('click', open);
  document.getElementById('day-transition-next').addEventListener('click', async () => {
    if (state.phase === 'reflection') {
      state.phase = 'home'; persist(); showDayTransition();
    } else if (state.phase === 'home' && !resetting) {
      resetting = true;
      const nextButton = document.getElementById('day-transition-next');
      nextButton.disabled = true;
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 350;
      await dayDialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration }).finished.catch(() => {});
      dayDialog.close();
      state = { ...freshState(), day: 2, collected: state.collected, unread: state.unread, soundEnabled: state.soundEnabled };
      persist();
      resetting = false;
      nextButton.disabled = false;
      api.restartDay();
    }
  });
  return { available, canInspect, inspect, record, move, render, save, open,
    hasCollected: id => state.collected.includes(id),
    hasEffect: id => state.effectsSeen.includes(id),
    rememberEffect(id) { if (effectIds.has(id) && !state.effectsSeen.includes(id)) { state.effectsSeen.push(id); persist(); } },
    atmosphereLevel() {
      if (state.day !== 2) return 0;
      // The meter close-up is part of the power-box clue, not a second clue.
      const clues = new Set(state.collected.map(id => `${evidence[id].day}:${evidence[id].group}`)).size;
      return Math.min(1, Math.max(0, clues - 1) / 3) * state.day2Steps / 8;
    },
    soundEnabled: () => state.soundEnabled,
    setSoundEnabled(enabled) { state.soundEnabled = Boolean(enabled); persist(); },
    day: () => state.day, isOpen: () => dialog.open || dayDialog.open || conversationDialog.open || doorDialog.open || MemoryJourney.active() || state.phase !== 'exploring',

    init(config) {
      api = config;
      notebook = createNotebookView({ dialog, evidence, artifacts: api.artifacts,
        getCollected: () => state.collected, onClose: () => api.refresh() });
      updateBadge(); return state.snapshot;
    } };
})();
