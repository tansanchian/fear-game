// Collecting the article unlocks a sound on each passage by the stop 2 unit.
const CorridorAudio = (() => {
  const unitStop = 1;
  const audio = document.getElementById('children-laughter');
  const button = document.getElementById('corridor-sound');
  const caption = document.getElementById('sound-caption');
  let context = { introActive: true, turning: false, artifact: null };
  let pending = false;
  let triggeredThisVisit = false;
  let starting = false;
  let blocked = false;
  let version = 0;
  audio.volume = .12;

  const eligible = () => Discovery.day() === 2 && Discovery.hasCollected('murderArticle') && !context.introActive && !context.turning && !context.artifact && !Discovery.isOpen() && !document.hidden;
  function renderButton() {
    const enabled = Discovery.soundEnabled();
    const retry = enabled && blocked && pending;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', retry ? 'Play the nearby sound' : enabled ? 'Mute ambient sound' : 'Enable ambient sound');
    button.title = retry ? 'Play sound' : enabled ? 'Sound on' : 'Sound off';
    button.classList.toggle('needs-playback', retry);
    document.getElementById('sound-waves').toggleAttribute('hidden', !enabled);
    document.getElementById('sound-slash').toggleAttribute('hidden', enabled);
  }
  function stop() {
    version += 1;
    starting = false;
    pending = false;
    blocked = false;
    audio.pause();
    caption.hidden = true;
  }
  async function play() {
    if (!eligible() || !Discovery.soundEnabled() || !pending || blocked || starting || !audio.paused) return;
    starting = true;
    const attempt = ++version;
    audio.currentTime = 0;
    try {
      await audio.play();
      if (attempt === version) starting = false;
    } catch (error) {
      if (attempt !== version) return;
      starting = false;
      blocked = true;
      caption.textContent = error.name === 'NotAllowedError' ? 'Tap the speaker to hear the nearby sound.' : 'The sound could not play. Tap the speaker to retry.';
      caption.hidden = false;
      renderButton();
    }
  }
  audio.addEventListener('playing', () => {
    if (!eligible() || !Discovery.soundEnabled()) { stop(); return; }
    blocked = false;
    pending = false;
    caption.textContent = 'Faint children’s laughter echoes nearby.';
    caption.hidden = false;
    renderButton();
  });
  audio.addEventListener('ended', () => { starting = false; caption.hidden = true; renderButton(); });
  button.addEventListener('click', () => {
    if (blocked && Discovery.soundEnabled() && pending) {
      blocked = false; audio.load(); void play();
    } else {
      Discovery.setSoundEnabled(!Discovery.soundEnabled());
      if (!Discovery.soundEnabled()) stop();
      else { blocked = false; void play(); }
    }
    renderButton();
  });
  function update(nextContext = context) {
    context = nextContext;
    if (context.introActive || Discovery.day() !== 2) triggeredThisVisit = false;
    if (!eligible() || !Discovery.soundEnabled()) stop();
    renderButton();
  }
  function walked(from, to) {
    // An arrival and the following departure are one passage, not two cues.
    // Collecting the paper during that visit arms the first departure instead.
    if (blocked || starting) stop();
    pending = false;
    blocked = false;
    if (to === unitStop) triggeredThisVisit = false;
    if ((from === unitStop || to === unitStop) && !triggeredThisVisit && eligible()) {
      triggeredThisVisit = true;
      stop();
      if (Discovery.soundEnabled()) { pending = true; void play(); }
    }
    renderButton();
  }
  document.addEventListener('visibilitychange', () => update());
  window.addEventListener('pagehide', stop);
  return { update, walked };
})();
