// Artifact memories change Day 2 only. Movement, not rendering or reading, triggers cues.
const CorridorEffects = (() => {
  const photographs = document.getElementById('corridor-photographs');
  const dimLayer = document.getElementById('corridor-dim');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cues = {
    laughter: { id: 'laughter', src: 'assets/children-laughter.mp3', volume: .12, caption: 'Faint children’s laughter echoes nearby.' },
    buzz: { id: 'buzz', src: 'assets/electrical-buzz.mp3', volume: .13, caption: 'A faint electrical buzz comes from beside the flat.' },
    voices: { id: 'voices', src: 'assets/behind-door-voices.mp3', volume: .16, caption: 'Muffled voices behind you, then a soft click.', onStarted: () => Discovery.rememberEffect('filming-voices') },
  };
  let context = { introActive: true, turning: false, artifact: null };
  let laughterThisVisit = false;
  let dimAnimation = null;
  const eligible = () => Discovery.day() === 2 && !context.introActive && !context.turning && !context.artifact && !Discovery.isOpen() && !document.hidden;

  function cancelDim() {
    dimAnimation?.cancel();
    dimAnimation = null;
  }
  function dimOnce() {
    if (Discovery.hasEffect('power-dim')) return;
    Discovery.rememberEffect('power-dim');
    // A single slow dip, never a flicker; reduced-motion users skip the transient.
    if (reducedMotion.matches) return;
    cancelDim();
    dimAnimation = dimLayer.animate([
      { opacity: 0 }, { opacity: .17, offset: .45 }, { opacity: 0 },
    ], { duration: 2800, easing: 'ease-in-out' });
  }
  function update(nextContext = context) {
    context = nextContext;
    const level = Discovery.atmosphereLevel();
    photographs.style.setProperty('--corridor-saturation', String(1 - .35 * level));
    photographs.style.setProperty('--corridor-brightness', String(1 - .06 * level));
    photographs.style.setProperty('--corridor-coolness', String(.10 * level));
    if (context.introActive || Discovery.day() !== 2) laughterThisVisit = false;
    if (!eligible()) cancelDim();
    CorridorAudio.update(context);
  }
  function walked(from, to) {
    CorridorAudio.discardRetry();
    // Cancel the local dip when leaving that viewpoint, while audio may trail off.
    if (to !== 4) cancelDim();
    if (to === 1) laughterThisVisit = false;
    if (!eligible()) return;

    if (to === 4 && (Discovery.hasCollected('power') || Discovery.hasCollected('powerClose'))) {
      dimOnce();
      CorridorAudio.trigger(cues.buzz);
    } else if (from === 4 && to === 3 && Discovery.hasCollected('filmRequest') && !Discovery.hasEffect('filming-voices')) {
      CorridorAudio.trigger(cues.voices);
    } else if ((from === 1 || to === 1) && !laughterThisVisit && Discovery.hasCollected('murderArticle')) {
      // Arrival and its following departure are one passage. A newly read article
      // instead arms the first departure, without making any sound while reading.
      laughterThisVisit = true;
      CorridorAudio.trigger(cues.laughter);
    }
  }
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) cancelDim(); });
  document.addEventListener('visibilitychange', () => update());
  window.addEventListener('pagehide', cancelDim);
  return { update, walked };
})();
