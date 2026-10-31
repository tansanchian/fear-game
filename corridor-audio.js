// One shared channel keeps location cues from overlapping or playing over reading.
const CorridorAudio = (() => {
  const audio = document.getElementById('corridor-audio');
  const button = document.getElementById('corridor-sound');
  const caption = document.getElementById('sound-caption');
  let context = { introActive: true, turning: false, artifact: null };
  let cue = null;
  let pending = false;
  let starting = false;
  let blocked = false;
  let version = 0;
  const eligible = () => Discovery.day() === 2 && !context.introActive && !context.turning && !context.artifact && !Discovery.isOpen() && !document.hidden;

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
    cue = null;
    audio.pause();
    delete audio.dataset.cue;
    caption.hidden = true;
  }
  async function play() {
    if (!eligible() || !Discovery.soundEnabled() || !cue || !pending || blocked || starting) return;
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
    if (!cue || !eligible() || !Discovery.soundEnabled()) { stop(); renderButton(); return; }
    blocked = false;
    if (pending) cue.onStarted?.();
    pending = false;
    caption.textContent = cue.caption;
    caption.hidden = false;
    renderButton();
  });
  audio.addEventListener('ended', () => { stop(); renderButton(); });
  button.addEventListener('click', () => {
    if (blocked && Discovery.soundEnabled() && pending) {
      blocked = false; audio.load(); void play();
    } else {
      Discovery.setSoundEnabled(!Discovery.soundEnabled());
      if (!Discovery.soundEnabled()) stop();
    }
    renderButton();
  });
  function update(nextContext = context) {
    context = nextContext;
    if (!eligible() || !Discovery.soundEnabled()) stop();
    renderButton();
  }
  function trigger(nextCue) {
    stop();
    if (eligible() && Discovery.soundEnabled()) {
      cue = nextCue;
      audio.src = cue.src;
      audio.volume = cue.volume;
      audio.dataset.cue = cue.id;
      pending = true;
      void play();
    }
    renderButton();
  }
  function discardRetry() {
    // Walking away cancels a failed/pending attempt, but lets an audible tail finish.
    if (blocked || starting) stop();
    renderButton();
  }
  document.addEventListener('visibilitychange', () => update());
  window.addEventListener('pagehide', stop);
  return { update, trigger, discardRetry };
})();
