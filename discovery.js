// Reveal rules and notebook metadata. Navigation remains available on every pass.
const Discovery = (() => {
  const storageKey = 'concrete-memories.discovery.v1';
  const evidence = {
    power: { pass: 1, group: 'power', title: 'Power box', description: 'The power box outside the flat.', location: 'Stop 5 · Outside the unit' },
    powerClose: { pass: 1, group: 'power', title: 'Meter number', description: 'A closer view of the meter display and serial number.', location: 'Stop 5 · Outside the unit' },
    flyer: { pass: 2, group: 'flyer', title: 'Nearby listing', description: 'A three-room flat advertised for $688,000.', location: 'Stop 2 · On the door' },
    filmRequest: { pass: 3, group: 'filmRequest', title: 'Filming request', description: 'A letter seeking a home to use as a filming location.', location: 'Stop 5 · Flat entrance' },
  };
  const hotspotRules = {
    'view-shoe-cabinet': 1, 'view-stop-two-plants': 1, 'view-wheelchair': 1,
    'view-wooden-blocks': 2, 'view-trolley': 2,
    'view-door-sign': 3, 'view-hanging-clothes': 3,
    'view-listing-flyer': 'flyer', 'view-power-box': 'power', 'view-film-request': 'filmRequest',
  };
  let state = { pass: 1, direction: 1, collected: [], unread: [], snapshot: null, hintSeen: false };
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && [1, 2, 3].includes(saved.pass) && saved.direction === (saved.pass === 2 ? -1 : 1)) {
      const collected = Array.isArray(saved.collected) ? [...new Set(saved.collected)].filter(id => evidence[id] && evidence[id].pass <= saved.pass) : [];
      state = { ...state, pass: saved.pass, direction: saved.direction, collected, unread: (Array.isArray(saved.unread) ? saved.unread : []).filter(id => collected.includes(id)), snapshot: saved.snapshot, hintSeen: saved.hintSeen === true || saved.pass > 1 };
    }
  } catch { /* Storage can be unavailable; the current run still works. */ }
  const button = document.getElementById('notebook-button');
  const dialog = document.getElementById('notebook');
  const list = document.getElementById('notebook-list');
  const detail = document.getElementById('notebook-detail');
  const prompt = document.getElementById('journey-prompt');
  const toast = document.getElementById('discovery-toast');
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
    const rule = hotspotRules[id] ?? id;
    return state.pass >= (typeof rule === 'number' ? rule : evidence[rule]?.pass ?? 1);
  }
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
  }
  function updateBadge() {
    document.getElementById('notebook-badge').textContent = String(state.unread.length);
    document.getElementById('notebook-badge').hidden = !state.unread.length;
    button.setAttribute('aria-label', `Notebook${state.unread.length ? `, ${state.unread.length} new discoveries` : ''}`);
  }
  function record(id) {
    if (!evidence[id] || !available(id) || state.collected.includes(id)) return;
    state.collected.push(id);
    state.unread.push(id);
    persist();
    updateBadge();
    notify(id === 'powerClose' ? 'Notebook updated · Meter number' : `Added to notebook · ${evidence[id].title}`);
  }
  function move(from, to) {
    if (state.pass === 1 && from === 4 && to === 3) {
      state.pass = 2; state.direction = -1;
    } else if (state.pass === 2 && from === 0 && to === 1) {
      state.pass = 3; state.direction = 1;
    }
  }
  function render({ introActive, busy, artifact, position, doorPromptOpen }) {
    button.disabled = busy;
    const canShowHint = !introActive && !busy && !artifact && !doorPromptOpen && position === 4 && state.pass === 1;
    if (canShowHint && !state.hintSeen) {
      hintVisible = true;
      state.hintSeen = true;
      persist();
    }
    if (!canShowHint) hintVisible = false;
    prompt.hidden = !hintVisible;
    updateBadge();
  }
  function renderNotebook() {
    const groups = [...new Set(state.collected.map(id => evidence[id].group))];
    document.getElementById('notebook-title').textContent = 'Your notebook';
    document.getElementById('notebook-summary').textContent = `${groups.length} ${groups.length === 1 ? 'artifact' : 'artifacts'} recorded`;
    list.replaceChildren();
    document.getElementById('notebook-empty').hidden = groups.length > 0;
    for (const group of groups) {
      const ids = state.collected.filter(id => evidence[id].group === group);
      const first = ids[0];
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'notebook-entry'; card.dataset.entry = group;
      const thumb = document.createElement('img'); thumb.src = api.artifacts[first].image; thumb.alt = ''; thumb.loading = 'lazy';
      const copy = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = evidence[group].title;
      const location = document.createElement('small'); location.textContent = evidence[first].location;
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
    document.getElementById('notebook-caption').textContent = evidence[id].description;
    photo.classList.remove('is-enlarged');
    document.getElementById('notebook-zoom').textContent = 'Enlarge image';
    const variants = document.getElementById('notebook-variants'); variants.replaceChildren();
    for (const variant of state.collected.filter(key => evidence[key].group === evidence[id].group)) {
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
    if (button.disabled || dialog.open) return;
    returnFocus = document.activeElement;
    selected = null; detail.hidden = true; list.hidden = false;
    renderNotebook(); dialog.showModal();
    state.unread = []; persist(); updateBadge();
    document.getElementById('notebook-close').focus();
  }
  dialog.addEventListener('cancel', event => {
    if (selected) { event.preventDefault(); showList(); }
  });
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected && !returnFocus.hidden) returnFocus.focus(); });
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
    state = { pass: 1, direction: 1, collected: [], unread: [], snapshot: null, hintSeen: false };
    persist(); window.location.reload();
  });
  return { available, record, move, render, save, open, isOpen: () => dialog.open,
    init(config) { api = config; updateBadge(); return state.snapshot; } };
})();
