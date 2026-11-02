// Imagined discoveries are saved separately and never spend either day's inspections.
const MemoryWalk = (() => {
  const storageKey = 'concrete-memories.imagined.v1';
  const url = new URL(window.location.href);
  if (!MemoryJourney.persistent() && url.searchParams.has('start')) {
    for (const phase of ['preview', 'post', 'retreat', 'walk']) MemoryJourney.advance(phase);
  }
  if (!['walk', 'ending', 'complete'].includes(MemoryJourney.phase())) { location.replace('visit.html'); return; }
  const visited = new Set();
  const collected = new Set();
  const effectsSeen = new Set();
  const explored = () => [0, 1, 2, 3, 4].every(stop => visited.has(stop));
  const root = document.getElementById('memory');
  const view = document.getElementById('view');
  const photo = document.getElementById('view-photo');
  const backdrop = document.getElementById('backdrop');
  const arrival = document.getElementById('arrival-video');
  const prompt = document.getElementById('scene-prompt');
  const nextButton = document.getElementById('scene-next');
  const back = document.getElementById('memory-back');
  const forward = document.getElementById('memory-forward');
  const sideView = document.getElementById('side-view-button');
  const dialog = document.getElementById('memory-detail');
  const detailVideo = document.getElementById('detail-video');
  const detailImage = document.getElementById('detail-image');
  const imageScroll = document.getElementById('detail-image-scroll');
  const detailTools = document.getElementById('detail-tools');
  const cropButton = document.getElementById('detail-crop');
  const zoomButton = document.getElementById('detail-zoom');
  const detailLoading = document.getElementById('detail-loading');
  const detailNote = document.getElementById('detail-note');
  const notebookDialog = document.getElementById('notebook');
  const error = document.getElementById('load-error');
  const announcement = document.getElementById('memory-announcement');
  const details = {
    display: { type: 'video', source: 'assets/hallucination_lift_close.mp4', poster: 'assets/hallucination-display-poster.jpg', title: 'The floor display', alt: 'Close-up of the unfamiliar lift display' },
    chair: { type: 'image', source: 'assets/hallucination-chair-poster.jpg', title: 'The courtyard seat', alt: 'A courtyard seat overgrown with plants' },
    deck: { type: 'image', source: 'assets/hallucination_void_deck.jpg', title: 'The void deck', alt: 'An empty seating area with fallen leaves and debris' },
    gate: { type: 'image', source: 'assets/hallucination_gate.jpg', title: 'The closed gate', alt: 'A metal gate with a yellow no-entry sign' },
    article1: { type: 'image', artifact: 'memoryArticle1' },
    article2: { type: 'image', artifact: 'memoryArticle2' },
  };
  const hotspots = [
    { id: 'display-hotspot', scene: -1, detail: 'display', bounds: [555, 46, 82, 40] },
    { id: 'chair-hotspot', scene: 0, detail: 'chair', bounds: [670, 220, 95, 100] },
    { id: 'deck-hotspot', scene: 2, detail: 'deck', bounds: [735, 205, 80, 100] },
    // Inspect the gate before the final stop triggers the wife's phone call.
    { id: 'gate-hotspot', scene: 3, detail: 'gate', bounds: [280, 40, 58, 355] },
    { id: 'article-one-hotspot', scene: 1, detail: 'article1', bounds: [348, 370, 74, 52] },
    { id: 'article-two-hotspot', scene: 4, detail: 'article2', bounds: [376, 360, 60, 55] },
  ];
  let scene = -2;
  let busy = false;
  let ready = false;
  let detailOpener = null;
  let currentDetail = null;
  let currentArtifact = null;
  let imageRequest = 0;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const source = index => index === -1 ? 'assets/hallucination-lobby.jpg' : `assets/hallucination-stop-${String(index + 1).padStart(2, '0')}.jpg`;
  function save() {
    if (MemoryJourney.phase() === 'idle') return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ scene, visited: [...visited], collected: [...collected], effectsSeen: [...effectsSeen] })); } catch {}
    if (typeof ParticipantData !== 'undefined') ParticipantData.update({
      imaginedNotebook: [...collected],
      imaginedCorridor: { scene, visited: [...visited], effectsSeen: [...effectsSeen] },
    });
  }
  if (url.searchParams.has('start') && MemoryJourney.phase() === 'walk') {
    try { sessionStorage.removeItem(storageKey); } catch {}
    if (MemoryJourney.persistent()) { url.searchParams.delete('start'); history.replaceState(null, '', url); }
  } else {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (Number.isInteger(saved?.scene) && saved.scene >= -2 && saved.scene <= 4) {
        scene = saved.scene;
        for (const stop of Array.isArray(saved.visited) ? saved.visited : []) {
          if (Number.isInteger(stop) && stop >= 0 && stop <= 4) visited.add(stop);
        }
        for (const id of Array.isArray(saved.collected) ? saved.collected : []) if (Object.hasOwn(IMAGINED_EVIDENCE, id)) collected.add(id);
        for (const id of Array.isArray(saved.effectsSeen) ? saved.effectsSeen : []) if (MemoryAtmosphere.validEffect(id)) effectsSeen.add(id);
      }
    } catch {}
  }
  if (GameEnding.active()) scene = 4;
  function layout() {
    if (scene === -2) return;
    const width = view.clientWidth, height = view.clientHeight;
    const scale = Math.min(width / 848, height / 464);
    const ox = (width - 848 * scale) / 2, oy = (height - 464 * scale) / 2;
    for (const item of hotspots) {
      const button = document.getElementById(item.id);
      const [x, y, w, h] = item.bounds;
      const bw = Math.max(48, w * scale), bh = Math.max(48, h * scale);
      button.style.left = `${ox + (x + w / 2) * scale - bw / 2}px`;
      button.style.top = `${oy + (y + h / 2) * scale - bh / 2}px`;
      button.style.width = `${bw}px`; button.style.height = `${bh}px`;
      button.style.setProperty('--paper-width', `${w * scale}px`);
      button.style.setProperty('--paper-height', `${h * scale}px`);
    }
    const dim = document.getElementById('memory-dim');
    Object.assign(dim.style, { left: `${ox}px`, top: `${oy}px`, width: `${848 * scale}px`, height: `${464 * scale}px` });
    // On tall screens, use the space below the photograph so the arrow cannot
    // cover small floor objects when the whole corridor is fitted into view.
    const photoBottom = oy + 464 * scale;
    forward.style.top = `${height - photoBottom > 110 ? photoBottom + 18 : oy + 464 * scale * .72}px`;
    forward.style.bottom = 'auto';
  }
  function render() {
    root.dataset.scene = scene === 4 ? 'end' : scene === -2 ? 'arrival' : scene === -1 ? 'lobby' : 'corridor';
    root.dataset.stop = String(scene);
    arrival.hidden = scene !== -2; photo.hidden = scene === -2;
    prompt.hidden = busy || (scene >= 0 && scene < 4);
    nextButton.hidden = scene === 4 && !explored();
    nextButton.disabled = busy || (scene === -2 && !ready) || (scene === 4 && !explored());
    back.hidden = scene < 0; back.disabled = busy;
    forward.hidden = scene < 0 || scene === 4; forward.disabled = busy;
    document.getElementById('walk-hint').hidden = scene < 0 || scene === 4 || busy;
    document.getElementById('memory-tools').hidden = scene < 0;
    document.getElementById('memory-notebook').disabled = busy;
    for (const item of hotspots) document.getElementById(item.id).hidden = busy || item.scene !== scene;
    const side = hotspots.find(item => item.scene === scene);
    sideView.hidden = busy || !side || scene === -1;
    sideView.disabled = busy;
    if (side) sideView.textContent = `↗ ${document.getElementById(side.id).getAttribute('aria-label')}`;
    const sceneLabel = document.getElementById('scene-label');
    sceneLabel.hidden = scene === -1;
    sceneLabel.textContent = scene === -2 ? 'The doors open' : 'Further along';
    document.getElementById('scene-title').textContent = scene === -2 ? ready ? 'The doors are open' : 'The doors are opening' : scene === -1 ? 'This landing feels unfamiliar' : 'The corridor falls quiet';
    document.getElementById('scene-copy').textContent = scene === -2 ? 'You expect the familiar landing, but the images from the post are still with you.' : scene === -1 ? 'You entered this lift only a moment ago. Now its doors and floor display look older. You step closer to make sense of them.' : explored() ? 'A newspaper lies near your feet. Look around a little longer, or continue towards the end of the corridor.' : 'There is more of this place to explore. Walk back through the corridor and take another look.';
    nextButton.textContent = scene === -2 ? 'Step out of the lift' : scene === 4 ? 'Continue to the end' : 'Walk into the corridor';
    MemoryAtmosphere.grade(Number(collected.has('memoryArticle1')) + Number(collected.has('memoryArticle2')));
    layout();
  }
  async function playArrival() {
    ready = reduced(); render();
    if (ready) return;
    try { await arrival.play(); }
    catch { ready = true; render(); announcement.textContent = 'The lift video is paused. You can step out to continue.'; }
  }
  async function go(next) {
    if (GameEnding.active() || busy || dialog.open || notebookDialog.open || !Number.isInteger(next) || next < -1 || next > 4 || Math.abs(next - scene) !== 1 || (scene === -2 && !ready)) return;
    MemoryAtmosphere.moving();
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
    if (scene >= 0) visited.add(scene);
    if (typeof ParticipantData !== 'undefined') ParticipantData.track('imagined_corridor_moved', { from: old, to: scene });
    busy = false; render(); save();
    announcement.textContent = scene === -1 ? 'The lift looks different. Inspect its display or enter the corridor.' : `Along the imagined corridor. View ${scene + 1}.`;
    for (const [id, stop, cue] of [['memoryArticle1', 1, 'past-article1'], ['memoryArticle2', 4, 'past-article2']]) {
      if (collected.has(id) && (old === stop || scene === stop)) {
        MemoryAtmosphere.dip(`dim-${id}`);
        if (MemoryAtmosphere.trigger(cue)) break;
      }
    }
    (scene === -1 || scene === 4 ? nextButton : forward).focus({ preventScroll: true });
  }
  function finishWalk() {
    if (scene !== 4 || !explored() || busy || dialog.open || notebookDialog.open || GameEnding.active()) return;
    MemoryAtmosphere.stop();
    GameEnding.begin();
  }
  async function loadDetailImage(id = currentArtifact) {
    const request = ++imageRequest;
    currentArtifact = id;
    const target = id ? ARTIFACT_CONTENT[id] : details[currentDetail.detail];
    document.getElementById('detail-title').textContent = target.title;
    document.getElementById('detail-error').hidden = true;
    detailLoading.hidden = false; detailImage.hidden = true; detailNote.hidden = true;
    imageScroll.classList.remove('is-enlarged'); imageScroll.scrollTo(0, 0);
    zoomButton.textContent = 'Enlarge image'; zoomButton.setAttribute('aria-pressed', 'false');
    zoomButton.disabled = true; cropButton.disabled = true;
    cropButton.hidden = id !== 'memoryArticle2';
    cropButton.textContent = id === 'memoryArticle2Close' ? 'Back to full page' : 'View article close-up';
    document.getElementById('detail-back').textContent = id === 'memoryArticle2Close' ? '← Full page' : '← Back';
    const preload = new Image(); preload.src = target.image || target.source;
    try { await preload.decode(); }
    catch {
      if (request === imageRequest && dialog.open) { detailLoading.hidden = true; document.getElementById('detail-error').hidden = false; }
      return;
    }
    if (request !== imageRequest || !dialog.open) return;
    detailImage.src = preload.src; detailImage.alt = target.alt; detailImage.hidden = false;
    detailLoading.hidden = true; zoomButton.disabled = false; cropButton.disabled = false;
    if (id) {
      const fresh = !collected.has(id);
      collected.add(id); save(); render();
      if (fresh && typeof ParticipantData !== 'undefined') ParticipantData.track('imagined_notebook_item_added', { id });
      detailNote.textContent = `${fresh ? 'Added to notebook' : 'In your notebook'} · Imagined corridor`;
      detailNote.hidden = false;
      if (fresh && id !== 'memoryArticle2Close') MemoryAtmosphere.trigger(id === 'memoryArticle1' ? 'read-article1' : 'read-article2');
    }
  }
  function openDetail(item) {
    if (GameEnding.active() || busy || dialog.open || notebookDialog.open || item.scene !== scene) return;
    MemoryAtmosphere.stop();
    const target = details[item.detail];
    currentDetail = item; currentArtifact = target.artifact || null;
    detailOpener = document.getElementById(item.id);
    document.getElementById('detail-title').textContent = target.title;
    document.getElementById('detail-error').hidden = true;
    detailImage.hidden = true; detailVideo.hidden = target.type !== 'video';
    imageScroll.hidden = target.type !== 'image';
    detailTools.hidden = !target.artifact; detailNote.hidden = true; detailLoading.hidden = true;
    document.getElementById('detail-back').textContent = '← Back';
    if (target.type === 'video') {
      detailVideo.poster = target.poster; detailVideo.src = target.source;
      detailVideo.setAttribute('aria-label', target.alt); detailVideo.load();
    }
    dialog.showModal(); document.getElementById('detail-back').focus();
    if (target.type === 'image') void loadDetailImage();
    if (target.type === 'video' && !reduced()) void detailVideo.play().catch(() => { announcement.textContent = 'Use the video controls to play this scene.'; });
  }
  dialog.addEventListener('close', () => {
    imageRequest += 1; currentDetail = null; currentArtifact = null;
    MemoryAtmosphere.stop();
    detailVideo.pause(); detailVideo.removeAttribute('src'); detailVideo.load();
    if (detailOpener && !detailOpener.hidden) detailOpener.focus({ preventScroll: true });
  });
  function backFromDetail() {
    if (currentArtifact === 'memoryArticle2Close') { MemoryAtmosphere.stop(); void loadDetailImage('memoryArticle2'); }
    else dialog.close();
  }
  document.getElementById('detail-back').addEventListener('click', backFromDetail);
  cropButton.addEventListener('click', () => { MemoryAtmosphere.stop(); void loadDetailImage(currentArtifact === 'memoryArticle2Close' ? 'memoryArticle2' : 'memoryArticle2Close'); });
  zoomButton.addEventListener('click', () => {
    const enlarged = imageScroll.classList.toggle('is-enlarged');
    zoomButton.textContent = enlarged ? 'Fit image' : 'Enlarge image'; zoomButton.setAttribute('aria-pressed', String(enlarged));
  });
  document.getElementById('detail-retry').addEventListener('click', () => {
    if (currentDetail && details[currentDetail.detail].type === 'image') void loadDetailImage();
    else { document.getElementById('detail-error').hidden = true; detailVideo.load(); }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); backFromDetail(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); backFromDetail(); }
  });
  detailVideo.addEventListener('error', () => { if (dialog.open && !detailVideo.hidden && detailVideo.hasAttribute('src')) document.getElementById('detail-error').hidden = false; });
  detailImage.addEventListener('error', () => { if (dialog.open && !detailImage.hidden) document.getElementById('detail-error').hidden = false; });
  arrival.addEventListener('ended', () => { ready = true; arrival.pause(); render(); });
  arrival.addEventListener('error', () => { ready = true; render(); announcement.textContent = 'The opening video could not load. You can still step out of the lift.'; });
  nextButton.addEventListener('click', () => { if (scene === 4) finishWalk(); else void go(scene + 1); });
  back.addEventListener('click', () => { void go(scene - 1); });
  forward.addEventListener('click', () => { void go(scene + 1); });
  sideView.addEventListener('click', () => {
    const item = hotspots.find(target => target.scene === scene);
    if (item) openDetail(item);
  });
  for (const item of hotspots) document.getElementById(item.id).addEventListener('click', () => openDetail(item));
  document.getElementById('memory-notebook').addEventListener('click', () => {
    if (busy || dialog.open || GameEnding.active()) return;
    MemoryAtmosphere.stop(); GameEnding.openNotebook();
  });
  window.addEventListener('resize', layout);
  document.addEventListener('keydown', event => {
    if (GameEnding.active() || dialog.open || notebookDialog.open || busy || event.target.closest('a')) return;
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); if (scene === 4) finishWalk(); else void go(scene + 1); }
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); void go(scene - 1); }
  });
  window.addEventListener('pagehide', () => { arrival.pause(); detailVideo.pause(); save(); });
  async function start() {
    if (scene === -2) { backdrop.src = 'assets/lift-inside.jpg'; await playArrival(); }
    else {
      photo.src = source(scene); backdrop.src = photo.src;
      photo.alt = scene === -1 ? 'An older lift in an unfamiliar lobby' : `View ${scene + 1} along the empty corridor`;
      try { await photo.decode(); if (scene >= 0) visited.add(scene); save(); } catch { error.hidden = false; }
      render();
      if (GameEnding.active()) GameEnding.show();
    }
  }
  GameEnding.useImaginedNotes(() => [...collected]);
  MemoryAtmosphere.init({
    hasEffect: id => effectsSeen.has(id),
    rememberEffect(id) { effectsSeen.add(id); save(); },
    canPlay: scope => !GameEnding.active() && !busy && scene >= 0 && !notebookDialog.open && (scope === 'reading' ? dialog.open && Boolean(currentArtifact) : !dialog.open),
  });
  void start();
})();
