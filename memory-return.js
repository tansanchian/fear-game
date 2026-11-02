// A guided retreat using the real corridor views, without spending more inspections.
const ReturnWalk = (() => {
  const storageKey = 'concrete-memories.return.v1';
  const url = new URL(location.href);
  const entry = url.searchParams.get('start');
  const validPosition = value => Number.isInteger(value) && value >= 0 && value <= 4;
  if (!MemoryJourney.persistent() && entry !== null && validPosition(Number(entry))) {
    for (const phase of ['preview', 'post', 'retreat']) MemoryJourney.advance(phase);
  }
  if (MemoryJourney.phase() !== 'retreat') {
    location.replace(['walk', 'ending', 'complete'].includes(MemoryJourney.phase()) ? 'hallucination.html' : 'visit.html');
    return;
  }
  let origin = 0;
  try {
    const snapshot = JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1'))?.snapshot;
    if (validPosition(snapshot?.position)) origin = snapshot.position;
  } catch {}
  let state = { origin, position: origin, stage: 'corridor' };
  if (entry !== null && validPosition(Number(entry))) {
    state = { origin: Number(entry), position: Number(entry), stage: 'corridor' };
    if (MemoryJourney.persistent()) { url.searchParams.delete('start'); history.replaceState(null, '', url); }
  } else {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (saved && validPosition(saved.origin) && validPosition(saved.position) && saved.position <= saved.origin
        && ['corridor', 'lobby', 'lift'].includes(saved.stage) && (saved.stage === 'corridor' || saved.position === 0)) {
        state = { origin: saved.origin, position: saved.position, stage: saved.stage };
      }
    } catch {}
  }
  const root = document.getElementById('return-walk');
  const view = document.getElementById('return-view');
  const photo = document.getElementById('return-photo');
  const backdrop = document.getElementById('return-backdrop');
  const glimpse = document.getElementById('return-glimpse');
  const button = document.getElementById('return-step');
  const error = document.getElementById('return-error');
  const announcement = document.getElementById('return-announcement');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = true;
  let initialLoaded = false;
  const animations = new Set();
  const source = target => target.stage === 'corridor'
    ? `assets/stop-${String(target.position + 1).padStart(2, '0')}.jpg`
    : target.stage === 'lobby' ? 'assets/lift-lobby.jpg' : 'assets/lift-inside.jpg';
  const imaginedSource = target => target.stage === 'corridor'
    ? `assets/hallucination-stop-${String(target.position + 1).padStart(2, '0')}.jpg`
    : target.stage === 'lobby' ? 'assets/hallucination-lobby.jpg' : null;
  function save() { try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch {} }
  function render() {
    root.dataset.stage = state.stage; root.dataset.position = String(state.position);
    button.disabled = busy;
    const steps = state.origin - state.position;
    let title = 'You put your phone away';
    let copy = 'The comments leave you picturing the flat as it used to be. Then the thought spreads to the rest of the block: shut doors, an empty corridor. You decide to head back to the lift and clear your head.';
    if (state.stage === 'lobby') {
      title = 'The lift is just ahead';
      copy = 'For a moment, the familiar doors seem older than you remember. You tell yourself it is only the story playing on your mind, and step towards them.';
    } else if (state.stage === 'lift') {
      title = 'Inside the lift';
      copy = 'You step inside and let the doors close. You try to leave the images behind, but you keep picturing an empty landing on the other side.';
    } else if (steps > 0) {
      title = state.position === 0 ? 'Almost back at the lift' : 'The corridor feels quieter';
      copy = steps === 1
        ? 'You tell yourself these are only stories. Yet, as you walk back, you keep imagining the same corridor without the people who call it home.'
        : steps === 2
          ? 'For an instant, the walkway seems empty of plants and belongings. You blink, and the familiar details are there again.'
          : 'You know you are walking through an occupied block. Still, the empty version of it is becoming easier to picture. The lift is close now.';
    }
    document.getElementById('return-label').textContent = state.stage === 'lift' ? 'Between floors' : 'The story stays with you';
    document.getElementById('return-title').textContent = title;
    document.getElementById('return-copy').textContent = copy;
    button.textContent = !initialLoaded && !busy ? 'Try loading this view again'
      : state.stage === 'lift' ? 'Wait for the doors to open'
      : state.stage === 'lobby' ? 'Enter the lift'
      : state.position === 0 ? '← Back to the lift lobby' : '← Back towards the lift';
    document.getElementById('return-key-hint').hidden = state.stage === 'lift';
  }
  async function animate(element, frames, options) {
    const animation = element.animate(frames, options); animations.add(animation);
    await animation.finished.catch(() => {});
    animation.cancel(); animations.delete(animation);
  }
  function stopAnimations() {
    for (const animation of animations) animation.cancel();
    animations.clear();
  }
  async function stepBack() {
    if (busy) return;
    if (!initialLoaded) { void start(); return; }
    if (state.stage === 'lift') {
      if (!MemoryJourney.advance('walk')) return;
      busy = true; render();
      await animate(root, [{ opacity: 1 }, { opacity: 0 }], { duration: motionPreference.matches ? 1 : 450 });
      location.replace('hallucination.html?start=1');
      return;
    }
    busy = true; error.hidden = true; render();
    const next = { ...state };
    if (state.stage === 'lobby') next.stage = 'lift';
    else if (state.position === 0) next.stage = 'lobby';
    else next.position -= 1;
    const incoming = new Image(); incoming.src = source(next);
    const imagined = new Image(); const imaginedPath = imaginedSource(next);
    if (imaginedPath) imagined.src = imaginedPath;
    // A missing imagined overlay must not prevent reaching the lift.
    const [realResult, imaginedResult] = await Promise.allSettled([
      incoming.decode(), imaginedPath ? imagined.decode() : Promise.resolve(),
    ]);
    if (realResult.status === 'rejected') { busy = false; error.hidden = false; render(); return; }
    const duration = motionPreference.matches ? 1 : 240;
    await animate(view, [{ opacity: 1, transform: 'scale(1)' }, { opacity: .1, transform: 'scale(.96)' }], { duration, easing: 'ease-in' });
    photo.src = incoming.src; backdrop.src = incoming.src;
    photo.alt = next.stage === 'corridor' ? `Walking back through the familiar corridor, stop ${next.position + 1}` : next.stage === 'lobby' ? 'The familiar lift lobby' : 'Back inside the lift';
    await animate(view, [{ opacity: .1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration, easing: 'ease-out' });
    if (imaginedPath && imaginedResult.status === 'fulfilled' && !motionPreference.matches && !document.hidden) {
      glimpse.src = imagined.src;
      const strength = Math.min(.72, .28 + (state.origin - next.position + (next.stage === 'lobby' ? 2 : 0)) * .1);
      // One brief glimpse per step, without rapid strobing or repeated flashing.
      await animate(glimpse, [{ opacity: 0 }, { opacity: strength, offset: .36 }, { opacity: strength, offset: .55 }, { opacity: 0 }], { duration: 1100, easing: 'ease-in-out' });
    }
    state = next; save(); busy = false; render();
    announcement.textContent = document.getElementById('return-copy').textContent;
    button.focus({ preventScroll: true });
  }
  async function start() {
    busy = true; error.hidden = true; render();
    photo.src = source(state); backdrop.src = photo.src;
    photo.alt = state.stage === 'corridor' ? `The familiar corridor, stop ${state.position + 1}` : state.stage === 'lobby' ? 'The familiar lift lobby' : 'Back inside the lift';
    try { await photo.decode(); initialLoaded = true; }
    catch { error.hidden = false; }
    busy = false; save(); render();
  }
  button.addEventListener('click', () => { void stepBack(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault(); if (!event.repeat) void stepBack();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAnimations(); });
  motionPreference.addEventListener('change', () => { if (motionPreference.matches) stopAnimations(); });
  window.addEventListener('pagehide', () => { stopAnimations(); save(); });
  void start();
})();
