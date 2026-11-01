// A Day 2 observation at the viewing unit. The player never enters the flat.
const DoorEncounter = (() => {
  const dialog = document.getElementById('door-encounter');
  const title = document.getElementById('door-encounter-title');
  const copy = document.getElementById('door-encounter-copy');
  const status = document.getElementById('door-encounter-status');
  const sound = document.getElementById('door-chant-audio');
  const soundButton = document.getElementById('door-chant-sound');
  const photo = document.getElementById('artifact-photo');
  let api;
  let timer;
  let lean;
  let returnFocus;
  let reviewing = false;
  let revealed = false;
  let attempt = 0;

  function updateSoundButton() {
    soundButton.textContent = !Discovery.soundEnabled() ? 'Enable sound' : sound.paused ? 'Play sound' : 'Mute sound';
    soundButton.hidden = reviewing || sound.ended;
  }
  function stop() {
    attempt += 1;
    clearTimeout(timer);
    lean?.cancel();
    sound.pause();
  }
  async function play() {
    if (!dialog.open || reviewing || !Discovery.soundEnabled() || document.hidden) return;
    const token = ++attempt;
    status.hidden = true;
    sound.volume = .38;
    try {
      await sound.play();
    } catch {
      if (token !== attempt || !dialog.open) return;
      status.textContent = 'The sound could not play. Try Play sound, or continue with the written description.';
      status.hidden = false;
    }
    if (token === attempt) updateSoundButton();
  }
  function reveal() {
    if (!dialog.open || document.hidden || revealed) return;
    revealed = true;
    title.textContent = 'Sounds behind the door';
    copy.textContent = DAY_CONTENT[2].evidence.doorChant.description;
    // The written observation also makes the encounter playable with sound off.
    Discovery.record('doorChant');
    api.refresh();
  }
  function open() {
    if (!api.canOpen() || Discovery.isOpen() || !Discovery.canInspect('doorChant')) return;
    api.prepare();
    returnFocus = document.activeElement;
    reviewing = Discovery.hasCollected('doorChant');
    revealed = reviewing;
    status.hidden = true;
    title.textContent = reviewing ? 'Sounds behind the door' : 'A closer look';
    copy.textContent = reviewing ? DAY_CONTENT[2].evidence.doorChant.description : 'You lean towards the gate, about to peek inside…';
    sound.currentTime = 0;
    updateSoundButton();
    dialog.showModal();
    api.refresh();
    document.getElementById('door-stay-outside').focus();
    if (reviewing) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const base = photo.style.transform;
      lean = photo.animate([
        { transform: base },
        { transform: `${base} scale(1.035)`, offset: .55 },
        { transform: base },
      ], { duration: 2200, easing: 'ease-in-out' });
    }
    // Start playback in the click gesture; the audio's soft lead-in accompanies the lean.
    void play();
    timer = setTimeout(reveal, 1400);
  }
  soundButton.addEventListener('click', () => {
    if (!sound.paused) {
      Discovery.setSoundEnabled(false);
      sound.pause();
    } else {
      Discovery.setSoundEnabled(true);
      if (sound.error) sound.load();
      void play();
    }
    updateSoundButton();
    api.refresh();
  });
  sound.addEventListener('playing', () => {
    if (!dialog.open || reviewing || !Discovery.soundEnabled() || document.hidden) { sound.pause(); return; }
    status.hidden = true;
    updateSoundButton();
  });
  sound.addEventListener('ended', updateSoundButton);
  document.getElementById('door-stay-outside').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    stop();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    // If this was inspection six, let the player finish before the Reddit preview.
    api.refresh();
  });
  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) stop();
    else {
      updateSoundButton();
      if (!revealed) timer = setTimeout(reveal, 500);
    }
  });
  window.addEventListener('pagehide', stop);
  return { open, init(config) { api = config; } };
})();
