// Stereo montages reuse familiar sounds in unfamiliar combinations. One channel,
// one pending cue, and successful-playback history prevent uncontrolled overlap.
const MemoryAtmosphere = (() => {
  const audio = document.getElementById('memory-audio');
  const dim = document.getElementById('memory-dim');
  const buttons = ['memory-sound', 'detail-sound'].map(id => document.getElementById(id));
  const captions = ['memory-sound-caption', 'detail-sound-caption'].map(id => document.getElementById(id));
  const cues = {
    'read-article2': { src: 'assets/memory-radio.mp3?v=20261102-stronger-cues', volume: .52, rate: .85, scope: 'reading', caption: 'A low radio-like murmur swells, breaks into static, and falls quiet.' },
    'walk-voices': { src: 'assets/memory-mix-voices.mp3', volume: .74, rate: 1, scope: 'walking', caption: 'An electrical hum, voices to one side, then a latch from somewhere else.' },
    'walk-laughter': { src: 'assets/memory-mix-laughter.mp3', volume: .72, rate: 1, scope: 'walking', caption: 'Children’s laughter crosses the corridor. Footsteps answer from behind.' },
    'walk-chant': { src: 'assets/memory-mix-chant.mp3', volume: .76, rate: 1, scope: 'walking', caption: 'The chant from the flat returns beneath a rising buzz. Its direction seems to shift.' },
    'walk-echo': { src: 'assets/memory-mix-echo.mp3', volume: .74, rate: 1, scope: 'walking', caption: 'Fragments of laughter and voices return through the static, then stop.' },
  };
  let enabled = true;
  try { enabled = JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1'))?.soundEnabled !== false; } catch {}
  let api;
  let cue = null;
  let blocked = false;
  let starting = false;
  let version = 0;
  let dipAnimation;
  let queued = null;
  const eligible = () => cue && api?.canPlay(cue.scope) && !document.hidden;
  function renderButtons() {
    const label = enabled && blocked && cue ? 'Play sound' : enabled ? 'Sound on' : 'Sound off';
    for (const button of buttons) {
      button.textContent = label; button.setAttribute('aria-pressed', String(enabled));
      button.setAttribute('aria-label', label === 'Play sound' ? 'Retry the nearby sound' : enabled ? 'Mute sound' : 'Enable sound');
    }
  }
  function caption(text) {
    const inReader = document.getElementById('memory-detail').open;
    captions.forEach((element, index) => { element.textContent = text; element.hidden = !text || (index === 1) !== inReader; });
  }
  function stop() {
    version += 1; cue = null; queued = null; blocked = false; starting = false;
    audio.pause(); delete audio.dataset.cue;
    dipAnimation?.cancel(); caption(''); renderButtons();
  }
  function moving() {
    queued = null;
    dipAnimation?.cancel();
    // Let an audible walking mix finish across subsequent steps.
    // Failed or pending attempts still expire when the player leaves the area.
    if (!cue || cue.scope !== 'walking' || blocked || starting || audio.paused) stop();
  }
  async function play() {
    if (!enabled || !eligible() || starting) return;
    const token = ++version;
    starting = true;
    try { await audio.play(); }
    catch {
      if (token !== version) return;
      blocked = true;
      caption('Sound could not play. Choose Play sound to retry.');
    }
    if (token === version) { starting = false; renderButtons(); }
  }
  function trigger(id) {
    const next = cues[id];
    if (!next || !enabled || api.hasEffect(id) || !api.canPlay(next.scope) || document.hidden) return false;
    if (cue?.id === id) return true;
    if (next.scope === 'walking' && cue?.scope === 'walking' && !blocked && !audio.paused) {
      // Fast walking keeps the current mix audible; only the latest next cue waits.
      queued = id;
      return true;
    }
    // Audio replacement does not cancel the accompanying slow visual dip.
    version += 1; audio.pause(); starting = false; blocked = false; queued = null;
    cue = { ...next, id }; audio.src = cue.src; audio.volume = cue.volume;
    audio.playbackRate = cue.rate; audio.dataset.cue = id;
    void play(); return true;
  }
  audio.addEventListener('playing', () => {
    if (!enabled || !eligible()) { stop(); return; }
    api.rememberEffect(cue.id); blocked = false;
    caption(cue.caption); renderButtons();
  });
  audio.addEventListener('ended', () => {
    const next = queued; queued = null;
    cue = null; delete audio.dataset.cue; caption(''); renderButtons();
    if (next) trigger(next);
  });
  audio.addEventListener('error', () => {
    if (!cue || !eligible()) return;
    starting = false; blocked = true;
    caption('Sound could not load. Choose Play sound to retry.'); renderButtons();
  });
  for (const button of buttons) button.addEventListener('click', () => {
    if (enabled && blocked && cue) { blocked = false; audio.load(); void play(); }
    else {
      enabled = !enabled;
      try {
        const saved = JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1')) || {};
        saved.soundEnabled = enabled;
        sessionStorage.setItem('concrete-memories.discovery.v1', JSON.stringify(saved));
      } catch {}
      if (!enabled) stop();
    }
    renderButtons();
  });
  function dip(id) {
    if (api.hasEffect(id) || !api.canPlay('walking') || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dipAnimation?.cancel();
    dipAnimation = dim.animate([{ opacity: 0 }, { opacity: .21, offset: .55 }, { opacity: 0 }], { duration: 2600, easing: 'ease-in-out' });
    api.rememberEffect(id);
  }
  function walked(from, to) {
    if (to < 0) { stop(); return; }
    if (!enabled || document.hidden || !api.canPlay('walking')) return;
    const forward = to > from;
    const order = forward
      ? ['walk-voices', 'walk-laughter', 'walk-chant', 'walk-echo']
      : ['walk-chant', 'walk-echo', 'walk-voices', 'walk-laughter'];
    // The first arrival is quiet. Later passages rearrange familiar sounds,
    // independent of which clues were collected on the real visit.
    if (from < 0 && to === 0) return;
    const offset = Math.max(0, to - 1) % order.length;
    const candidates = [...order.slice(offset), ...order.slice(0, offset)];
    const next = candidates.find(id => !api.hasEffect(id) && cue?.id !== id);
    if (next) trigger(next);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) dipAnimation?.cancel(); });
  return {
    init(config) { api = config; renderButtons(); }, stop, moving, walked, trigger, dip,
    soundEnabled: () => enabled,
    validEffect: id => Object.hasOwn(cues, id) || id === 'dim-memoryArticle2',
    grade(count) {
      document.getElementById('memory').style.setProperty('--memory-saturation', String(1 - count * .16));
      document.getElementById('memory').style.setProperty('--memory-brightness', String(1 - count * .035));
    },
  };
})();
