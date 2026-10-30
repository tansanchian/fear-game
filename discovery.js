// Reveal rules and notebook metadata. Navigation remains available on every pass.
const Discovery = (() => {
  const storageKey = 'concrete-memories.discovery.v1';
  const evidence = Object.fromEntries(Object.entries(DAY_CONTENT).flatMap(([day, content]) =>
    Object.entries(content.evidence).map(([id, entry]) => [id, { ...entry, day: Number(day) }])));
  const hotspotIds = new Set(Object.values(DAY_CONTENT).flatMap(content => Object.keys(content.hotspots)));
  const freshState = () => ({ day: 1, phase: 'exploring', pass: 1, direction: 1, collected: [], unread: [], inspected: [], soundEnabled: true, warningSeen: false, snapshot: null, hintSeen: false });
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
        unread: (Array.isArray(saved.unread) ? saved.unread : []).filter(id => collected.includes(id)),
        snapshot: saved.snapshot, hintSeen: saved.hintSeen === true || saved.pass > 1, warningSeen: saved.warningSeen === true };

    }
  } catch { /* Storage can be unavailable; the current run still works. */ }
  const button = document.getElementById('notebook-button');
  const dialog = document.getElementById('notebook');
  const list = document.getElementById('notebook-list');
  const detail = document.getElementById('notebook-detail');
  const prompt = document.getElementById('journey-prompt');
  const toast = document.getElementById('discovery-toast');
  const dayDialog = document.getElementById('day-transition');
  let api;
  let toastTimer;
  let selected = null;
  let hintVisible = false;
  let returnFocus;
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
      notify('It’s getting late. You have time to look at a couple more things before heading home.', 7500);
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
    if (state.pass === 1 && from === 4 && to === 3) {
      state.pass = 2; state.direction = -1;
    } else if (state.pass === 2 && from === 0 && to === 1) {
      state.pass = 3; state.direction = 1;
    }
  }
  function render({ introActive, busy, artifact, position, doorPromptOpen, inspecting }) {
    button.disabled = busy;
    document.getElementById('memory-prompt').hidden = state.day !== 2 || state.pass < 3 || state.phase !== 'exploring' || introActive || busy || Boolean(artifact) || doorPromptOpen || inspecting || position !== 4;
    const canShowHint = state.day === 1 && state.phase === 'exploring' && !exhausted() && !introActive && !busy && !artifact && !doorPromptOpen && position === 4 && state.pass === 1;
    if (canShowHint && !state.hintSeen) {
      hintVisible = true;
      state.hintSeen = true;
      persist();
    }
    if (!canShowHint) hintVisible = false;
    prompt.hidden = !hintVisible;
    updateBadge();
    if (state.phase === 'exploring' && exhausted() && !introActive && !busy && (!artifact || artifact === 'flat' || artifact === 'map') && !inspecting && !dialog.open) {
      state.phase = 'reflection';
      persist();
    }
    if (state.phase !== 'exploring' && !busy) showDayTransition();
  }
  function renderNotebook() {
    const groups = [...new Set(state.collected.map(id => `${evidence[id].day}:${evidence[id].group}`))];
    document.getElementById('notebook-title').textContent = 'Your notebook';
    document.getElementById('notebook-summary').textContent = `${groups.length} ${groups.length === 1 ? 'artifact' : 'artifacts'} recorded`;
    list.replaceChildren();
    document.getElementById('notebook-empty').hidden = groups.length > 0;
    for (const group of groups) {
      const ids = state.collected.filter(id => `${evidence[id].day}:${evidence[id].group}` === group);
      const first = ids[0];
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'notebook-entry'; card.dataset.entry = group;
      const thumb = document.createElement('img'); thumb.src = api.artifacts[first].image; thumb.alt = ''; thumb.loading = 'lazy';
      const copy = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = evidence[evidence[first].group]?.title ?? evidence[first].title;
      const location = document.createElement('small'); location.textContent = `Day ${evidence[first].day} · ${evidence[first].location}`;
      const count = document.createElement('small'); count.textContent = `${ids.length} ${ids.length === 1 ? 'image' : 'images'}`;
      copy.append(title, location, count); card.append(thumb, copy);
      card.addEventListener('click', () => showEntry(first)); list.append(card);
    }
  }
  function showEntry(id) {
    if (!state.collected.includes(id)) return;
    selected = id;
    list.hidden = true;
    document.getElementById('notebook-empty').hidden = true;
    detail.hidden = false;
    const photo = document.getElementById('notebook-photo');
    photo.src = api.artifacts[id].image; photo.alt = api.artifacts[id].alt;
    document.getElementById('notebook-caption').textContent = `Day ${evidence[id].day} · ${evidence[id].description}`;
    photo.classList.remove('is-enlarged');
    document.getElementById('notebook-zoom').textContent = 'Enlarge image';
    const variants = document.getElementById('notebook-variants'); variants.replaceChildren();
    for (const variant of state.collected.filter(key => evidence[key].day === evidence[id].day && evidence[key].group === evidence[id].group)) {
      const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = evidence[variant].title;
      tab.setAttribute('aria-pressed', String(variant === id)); tab.addEventListener('click', () => showEntry(variant)); variants.append(tab);
    }
    document.getElementById('notebook-to-list').focus();
  }
  function showList() {
    selected = null; detail.hidden = true; list.hidden = false; renderNotebook();
    document.getElementById('notebook-close').focus();
  }
  function open() {
    if (resetting || button.disabled || dialog.open) return;
    returnFocus = document.activeElement;
    selected = null; detail.hidden = true; list.hidden = false;
    renderNotebook(); dialog.showModal();
    state.unread = []; persist(); updateBadge();
    document.getElementById('notebook-close').focus();
    api.refresh();
  }
  dialog.addEventListener('cancel', event => {
    if (selected) { event.preventDefault(); showList(); }
  });
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected && !returnFocus.hidden) returnFocus.focus(); api.refresh(); });
  button.addEventListener('click', () => open());
  document.getElementById('notebook-close').addEventListener('click', () => dialog.close());
  document.getElementById('notebook-to-list').addEventListener('click', showList);
  document.getElementById('notebook-zoom').addEventListener('click', event => {
    const enlarged = document.getElementById('notebook-photo').classList.toggle('is-enlarged');
    event.currentTarget.textContent = enlarged ? 'Fit image' : 'Enlarge image';
  });
  document.getElementById('journey-action').addEventListener('click', () => {
    hintVisible = false;
    prompt.hidden = true;
    document.getElementById('back-button').focus();
  });
  document.getElementById('new-game').addEventListener('click', () => {
    resetting = true;
    state = freshState();
    try { sessionStorage.removeItem('concrete-memories.imagined.v1'); } catch {}
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
    soundEnabled: () => state.soundEnabled,
    setSoundEnabled(enabled) { state.soundEnabled = Boolean(enabled); persist(); },
    day: () => state.day, isOpen: () => dialog.open || dayDialog.open || state.phase !== 'exploring',

    init(config) { api = config; updateBadge(); return state.snapshot; } };
})();
