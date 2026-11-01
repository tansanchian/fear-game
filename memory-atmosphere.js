// Brief, once-only cues. The reader and notebook stay free of looping ambience.
const MemoryAtmosphere = (() => {
  const audio = document.getElementById('memory-audio');
  const dim = document.getElementById('memory-dim');
  const buttons = ['memory-sound', 'detail-sound'].map(id => document.getElementById(id));
  const captions = ['memory-sound-caption', 'detail-sound-caption'].map(id => document.getElementById(id));
  const cues = {
    'read-article1': { src: 'assets/memory-radio.mp3', volume: .25, rate: 1, scope: 'reading', caption: 'A dry rustle, then a thin burst of radio static.' },
    'read-article2': { src: 'assets/memory-radio.mp3', volume: .22, rate: .85, scope: 'reading', caption: 'A low radio-like murmur fades into static.' },
    'past-article1': { src: 'assets/memory-footsteps.mp3', volume: .28, rate: 1, scope: 'walking', caption: 'A footstep echoes behind you. The corridor is empty.' },
    'past-article2': { src: 'assets/memory-footsteps.mp3', volume: .24, rate: .9, scope: 'walking', caption: 'Another footstep, just after yours. Then silence.' },
  };
  let enabled = true;
  try { enabled = JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1'))?.soundEnabled !== false; } catch {}
  let api;
  let cue = null;
  let blocked = false;
  let starting = false;
  let version = 0;
  let dipAnimation;
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
    version += 1; cue = null; blocked = false; starting = false;
    audio.pause(); delete audio.dataset.cue;
    dipAnimation?.cancel(); caption(''); renderButtons();
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
    // Audio replacement does not cancel the accompanying slow visual dip.
    version += 1; audio.pause(); starting = false; blocked = false;
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
    cue = null; delete audio.dataset.cue; caption(''); renderButtons();
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
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => { if (event.matches) dipAnimation?.cancel(); });
  return {
    init(config) { api = config; renderButtons(); }, stop, trigger, dip,
    soundEnabled: () => enabled,
    validEffect: id => Object.hasOwn(cues, id) || ['dim-memoryArticle1', 'dim-memoryArticle2'].includes(id),
    grade(count) {
      document.getElementById('memory').style.setProperty('--memory-saturation', String(1 - count * .16));
      document.getElementById('memory').style.setProperty('--memory-brightness', String(1 - count * .035));
    },
  };
})();
