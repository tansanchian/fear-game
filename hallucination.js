// A separate imagined sequence: it never records evidence or spends day inspections.
const MemoryWalk = (() => {
  const storageKey = 'concrete-memories.imagined.v1';
  const root = document.getElementById('memory');
  const view = document.getElementById('view');
  const photo = document.getElementById('view-photo');
  const backdrop = document.getElementById('backdrop');
  const arrival = document.getElementById('arrival-video');
  const prompt = document.getElementById('scene-prompt');
  const nextButton = document.getElementById('scene-next');
  const back = document.getElementById('memory-back');
  const forward = document.getElementById('memory-forward');
  const dialog = document.getElementById('memory-detail');
  const detailVideo = document.getElementById('detail-video');
  const detailImage = document.getElementById('detail-image');
  const error = document.getElementById('load-error');
  const announcement = document.getElementById('memory-announcement');
  const details = {
    display: { type: 'video', source: 'assets/hallucination_lift_close.mp4', poster: 'assets/hallucination-display-poster.jpg', title: 'The floor display', alt: 'Close-up of the unfamiliar lift display' },
    chair: { type: 'video', source: 'assets/hallucination_chair.mp4', poster: 'assets/hallucination-chair-poster.jpg', title: 'The courtyard seat', alt: 'A courtyard seat overgrown with plants' },
    deck: { type: 'image', source: 'assets/hallucination_void_deck.jpg', title: 'The void deck', alt: 'An empty seating area with fallen leaves and debris' },
    gate: { type: 'image', source: 'assets/hallucination_gate.jpg', title: 'The closed gate', alt: 'A metal gate with a yellow no-entry sign' },
  };
  const hotspots = [
    { id: 'display-hotspot', scene: -1, detail: 'display', bounds: [555, 46, 82, 40] },
    { id: 'chair-hotspot', scene: 0, detail: 'chair', bounds: [670, 220, 95, 100] },
    { id: 'deck-hotspot', scene: 2, detail: 'deck', bounds: [735, 205, 80, 100] },
    { id: 'gate-hotspot', scene: 4, detail: 'gate', bounds: [218, 85, 80, 280] },
  ];
  let scene = -2;
  let busy = false;
  let ready = false;
  let detailOpener = null;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const source = index => index === -1 ? 'assets/hallucination-lobby.jpg' : `assets/hallucination-stop-${String(index + 1).padStart(2, '0')}.jpg`;
  function save() { try { sessionStorage.setItem(storageKey, JSON.stringify({ scene })); } catch {} }
  const url = new URL(window.location.href);
  if (url.searchParams.has('start')) {
    try { sessionStorage.removeItem(storageKey); } catch {}
    url.searchParams.delete('start'); history.replaceState(null, '', url);
  } else {
    try { const saved = JSON.parse(sessionStorage.getItem(storageKey)); if (Number.isInteger(saved?.scene) && saved.scene >= -2 && saved.scene <= 4) scene = saved.scene; } catch {}
  }
  function layout() {
    if (scene === -2) return;
    const width = view.clientWidth, height = view.clientHeight;
    const scale = Math.min(width / 848, height / 464);
    const ox = (width - 848 * scale) / 2, oy = (height - 464 * scale) / 2;
    for (const item of hotspots) {
      const button = document.getElementById(item.id);
      const [x, y, w, h] = item.bounds;
      const bw = Math.max(44, w * scale), bh = Math.max(44, h * scale);
      button.style.left = `${ox + (x + w / 2) * scale - bw / 2}px`;
      button.style.top = `${oy + (y + h / 2) * scale - bh / 2}px`;
      button.style.width = `${bw}px`; button.style.height = `${bh}px`;
    }
    forward.style.top = `${oy + 464 * scale * .72}px`;
    forward.style.bottom = 'auto';
  }
  function render() {
    root.dataset.scene = scene === 4 ? 'end' : scene === -2 ? 'arrival' : scene === -1 ? 'lobby' : 'corridor';
    arrival.hidden = scene !== -2; photo.hidden = scene === -2;
    prompt.hidden = busy || (scene >= 0 && scene < 4);
    nextButton.hidden = scene === 4;
    document.getElementById('scene-exit').hidden = scene !== 4;
    nextButton.disabled = busy || (scene === -2 && !ready);
    back.hidden = scene < 0; back.disabled = busy;
    forward.hidden = scene < 0 || scene === 4; forward.disabled = busy;
    document.getElementById('walk-hint').hidden = scene < 0 || scene === 4 || busy;
    for (const item of hotspots) document.getElementById(item.id).hidden = busy || item.scene !== scene;
    document.getElementById('scene-label').textContent = scene === -2 ? 'AN IMAGINED MEMORY' : scene === -1 ? 'THE LIFT LOBBY' : 'A FADING IMPRESSION';
    document.getElementById('scene-title').textContent = scene === -2 ? ready ? 'The doors are open' : 'The doors are opening' : scene === -1 ? 'The lift looks different' : 'The image begins to fade';
    document.getElementById('scene-copy').textContent = scene === -2 ? 'In your mind, the block becomes a place everyone has left behind.' : scene === -1 ? 'The familiar doors give way to an older lift. Its floor display catches your eye.' : 'You have been picturing a place emptied of its residents. Take another look, or return to the corridor.';
    nextButton.textContent = scene === -2 ? 'Step out of the lift' : 'Walk into the corridor';
    layout();
  }
  async function playArrival() {
    ready = reduced(); render();
    if (ready) return;
    try { await arrival.play(); }
    catch { ready = true; render(); announcement.textContent = 'The lift video is paused. You can step out to continue.'; }
  }
  async function go(next) {
    if (busy || dialog.open || !Number.isInteger(next) || next < -1 || next > 4 || next === scene || (scene === -2 && !ready)) return;
    busy = true; error.hidden = true; render();
    const preload = new Image(); preload.src = source(next);
    try { await preload.decode(); }
    catch { busy = false; error.hidden = false; render(); return; }
    const duration = reduced() ? 1 : 260;
    const old = scene;
    const out = view.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: next > old ? 'scale(1.055)' : 'scale(.96)' }], { duration, fill: 'forwards', easing: 'ease-in' });
    await out.finished.catch(() => {});
    arrival.pause();
    scene = next; photo.src = source(scene); backdrop.src = photo.src;
    photo.alt = scene === -1 ? 'An older lift in an unfamiliar lobby' : `View ${scene + 1} along the empty corridor`;
    render();
    const incoming = view.animate([{ opacity: 0, transform: next > old ? 'scale(.97)' : 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration, fill: 'forwards', easing: 'ease-out' });
    out.cancel(); await incoming.finished.catch(() => {}); incoming.cancel();
    busy = false; render(); save();
    announcement.textContent = scene === -1 ? 'The lift looks different. Inspect its display or enter the corridor.' : `Along the imagined corridor. View ${scene + 1}.`;
    (scene === -1 ? nextButton : scene === 4 ? document.getElementById('scene-exit') : forward).focus({ preventScroll: true });
  }
  function openDetail(item) {
    if (busy || dialog.open || item.scene !== scene) return;
    const target = details[item.detail];
    detailOpener = document.getElementById(item.id);
    document.getElementById('detail-title').textContent = target.title;
    document.getElementById('detail-error').hidden = true;
    detailImage.hidden = target.type !== 'image'; detailVideo.hidden = target.type !== 'video';
    if (target.type === 'video') {
      detailVideo.poster = target.poster; detailVideo.src = target.source;
      detailVideo.setAttribute('aria-label', target.alt); detailVideo.load();
    } else { detailImage.alt = target.alt; detailImage.src = target.source; }
    dialog.showModal(); document.getElementById('detail-back').focus();
    if (target.type === 'video' && !reduced()) void detailVideo.play().catch(() => { announcement.textContent = 'Use the video controls to play this scene.'; });
  }
  dialog.addEventListener('close', () => {
    detailVideo.pause(); detailVideo.removeAttribute('src'); detailVideo.load();
    if (detailOpener && !detailOpener.hidden) detailOpener.focus({ preventScroll: true });
  });
  document.getElementById('detail-back').addEventListener('click', () => dialog.close());
  detailVideo.addEventListener('error', () => { if (dialog.open && !detailVideo.hidden && detailVideo.hasAttribute('src')) document.getElementById('detail-error').hidden = false; });
  detailImage.addEventListener('error', () => { if (dialog.open && !detailImage.hidden) document.getElementById('detail-error').hidden = false; });
  arrival.addEventListener('ended', () => { ready = true; arrival.pause(); render(); });
  arrival.addEventListener('error', () => { ready = true; render(); announcement.textContent = 'The opening video could not load. You can still step out of the lift.'; });
  nextButton.addEventListener('click', () => { void go(scene + 1); });
  back.addEventListener('click', () => { void go(scene - 1); });
  forward.addEventListener('click', () => { void go(scene + 1); });
  for (const item of hotspots) document.getElementById(item.id).addEventListener('click', () => openDetail(item));
  window.addEventListener('resize', layout);
  document.addEventListener('keydown', event => {
    if (dialog.open || busy || event.target.closest('a')) return;
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); void go(scene + 1); }
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); void go(scene - 1); }
  });
  window.addEventListener('pagehide', () => { arrival.pause(); detailVideo.pause(); save(); });
  async function start() {
    if (scene === -2) { backdrop.src = 'assets/lift-inside.jpg'; await playArrival(); }
    else {
      photo.src = source(scene); backdrop.src = photo.src;
      photo.alt = scene === -1 ? 'An older lift in an unfamiliar lobby' : `View ${scene + 1} along the empty corridor`;
      try { await photo.decode(); } catch { error.hidden = false; }
      render();
    }
  }
  void start();
})();
