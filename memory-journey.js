// Shared story progress across the real and imagined corridor pages.
const MemoryJourney = (() => {
  const key = 'concrete-memories.memory-journey.v1';
  const phases = ['idle', 'prompt', 'phone', 'post', 'walk', 'ending', 'complete'];
  let phase = 'idle';
  let persistent = true;
  try {
    const saved = sessionStorage.getItem(key);
    if (phases.includes(saved)) phase = saved;
    sessionStorage.setItem(key, phase);
  } catch { persistent = false; }
  // A cross-page handoff still works when browser storage is disabled.
  if (!persistent && new URLSearchParams(location.search).get('memory') === 'complete') phase = 'complete';
  function save() { try { sessionStorage.setItem(key, phase); } catch { persistent = false; } }
  function reset() {
    phase = 'idle'; save();
    try {
      sessionStorage.removeItem('concrete-memories.imagined.v1');
      sessionStorage.removeItem('concrete-memories.ending.v1');
    } catch {}
  }
  return {
    phase: () => phase,
    // The real corridor stays closed once the final story sequence starts.
    active: () => phase !== 'idle',
    persistent: () => persistent,
    advance(next) {
      if (phases.indexOf(next) !== phases.indexOf(phase) + 1) return false;
      phase = next; save(); return true;
    },
    reset,
  };
})();
