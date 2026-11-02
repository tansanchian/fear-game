// The final decision is submitted to the shared Supabase response table.
const GameEnding = (() => {
  const key = 'concrete-memories.ending.v1';
  const dialog = document.getElementById('game-ending');
  const ringtone = document.getElementById('ending-ringtone');
  const form = document.getElementById('ending-form');
  const thoughts = document.getElementById('ending-thoughts');
  const title = document.getElementById('ending-title');
  const replaySound = document.getElementById('ending-play-ring');
  const notebookButton = document.getElementById('ending-notebook');
  const submissionStatus = document.getElementById('ending-submission-status');
  const retrySubmission = document.getElementById('ending-retry-submit');
  const evidence = Object.fromEntries(Object.entries(DAY_CONTENT).flatMap(([day, content]) =>
    Object.entries(content.evidence).map(([id, entry]) => [id, { ...entry, day: Number(day) }])));
  Object.assign(evidence, IMAGINED_EVIDENCE);
  let imaginedNotes = () => [];
  const notebook = createNotebookView({
    dialog: document.getElementById('notebook'), evidence, artifacts: ARTIFACT_CONTENT,
    getCollected() {
      let dayNotes = [];
      try {
        const saved = JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1'));
        if (Array.isArray(saved?.collected)) dayNotes = saved.collected;
      } catch { /* Imagined notes remain available in memory. */ }
      return [...dayNotes, ...imaginedNotes()];
    },
  });
  let state = { stage: 'call', choice: '', thoughts: '' };
  let restarting = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && ['call', 'decision', 'done'].includes(saved.stage)) {
      const choice = ['buy', 'pass'].includes(saved.choice) ? saved.choice : '';
      state = { stage: saved.stage === 'done' && !choice ? 'decision' : saved.stage,
        choice, thoughts: typeof saved.thoughts === 'string' ? saved.thoughts.slice(0, 1200) : '' };
    }
  } catch { /* The ending still works without storage. */ }
  const active = () => ['ending', 'complete'].includes(MemoryJourney.phase());
  function save() { try { sessionStorage.setItem(key, JSON.stringify(state)); } catch {} }
  function stopRing() { ringtone.pause(); ringtone.currentTime = 0; replaySound.hidden = true; }
  function showSubmission(result) {
    const remoteStatus = typeof ParticipantData !== 'undefined' ? ParticipantData.current()?.remoteStatus : '';
    const submitted = result?.ok || remoteStatus === 'submitted';
    const failed = result && !result.ok;
    const submitting = !failed && (remoteStatus === 'submitting' || remoteStatus === 'in-progress' || !remoteStatus);
    submissionStatus.textContent = submitted ? 'Your response was submitted.'
      : submitting ? 'Submitting your response…'
        : 'Your response could not be submitted. Check your connection and try again.';
    retrySubmission.hidden = submitted || submitting;
  }
  function soundEnabled() {
    if (typeof MemoryAtmosphere !== 'undefined') return MemoryAtmosphere.soundEnabled();
    try { return JSON.parse(sessionStorage.getItem('concrete-memories.discovery.v1'))?.soundEnabled !== false; }
    catch { return true; }
  }
  async function ring() {
    if (state.stage !== 'call' || document.hidden || !soundEnabled()) return;
    ringtone.volume = .45;
    try { await ringtone.play(); replaySound.hidden = true; }
    catch { if (state.stage === 'call') replaySound.hidden = false; }
  }
  function show() {
    if (!active()) return;
    document.getElementById('memory').dataset.ending = state.stage;
    for (const stage of ['call', 'decision', 'done']) document.getElementById(`ending-${stage}`).hidden = stage !== state.stage;
    title.textContent = state.stage === 'call' ? 'Your wife is calling' : state.stage === 'decision' ? 'Would you buy this home?' : 'The end';
    const endingLabel = document.getElementById('ending-label');
    endingLabel.hidden = state.stage !== 'done';
    endingLabel.textContent = 'Concrete Memories';
    notebookButton.hidden = state.stage === 'call';
    if (state.stage === 'decision') {
      thoughts.value = state.thoughts;
      for (const input of form.elements.choice) input.checked = input.value === state.choice;
    }
    if (state.stage === 'done') {
      document.getElementById('ending-choice-summary').textContent = state.choice === 'buy'
        ? 'You tell your wife you would buy the flat.' : 'You tell your wife you would not buy the flat.';
      document.getElementById('ending-thoughts-summary').textContent = state.thoughts;
      document.getElementById('ending-reflection').hidden = !state.thoughts.trim();
      showSubmission();
    }
    if (!dialog.open) dialog.showModal();
    (state.stage === 'call' ? document.getElementById('ending-answer')
      : state.stage === 'decision' ? document.getElementById('ending-buy') : title).focus({ preventScroll: true });
  }
  function begin() {
    if (!MemoryJourney.advance('ending')) { show(); return; }
    save(); show(); void ring();
  }
  document.getElementById('ending-answer').addEventListener('click', () => {
    if (!active() || state.stage !== 'call') return;
    stopRing(); state.stage = 'decision'; save(); show();
  });
  replaySound.addEventListener('click', () => { void ring(); });
  notebookButton.addEventListener('click', () => {
    if (active() && state.stage !== 'call') notebook.open();
  });
  form.addEventListener('input', () => {
    if (state.stage !== 'decision') return;
    state.choice = form.elements.choice.value;
    state.thoughts = thoughts.value.slice(0, 1200);
    save();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.stage !== 'decision' || !form.reportValidity()) return;
    const choice = form.elements.choice.value;
    if (!['buy', 'pass'].includes(choice)) return;
    state = { stage: 'done', choice, thoughts: thoughts.value.slice(0, 1200) };
    save(); MemoryJourney.advance('complete'); stopRing(); show();
    const result = typeof ParticipantData !== 'undefined'
      ? await ParticipantData.finish(choice, state.thoughts)
      : { ok: false, reason: 'unavailable' };
    showSubmission(result);
  });
  retrySubmission.addEventListener('click', async () => {
    retrySubmission.hidden = true;
    submissionStatus.textContent = 'Submitting your response…';
    const result = typeof ParticipantData !== 'undefined'
      ? await ParticipantData.submit()
      : { ok: false, reason: 'unavailable' };
    showSubmission(result);
  });
  document.getElementById('ending-restart').addEventListener('click', () => {
    if (state.stage !== 'done' || restarting) return;
    restarting = true; stopRing(); MemoryJourney.reset();
    try { sessionStorage.removeItem('concrete-memories.discovery.v1'); } catch {}
    if (typeof ParticipantData !== 'undefined') ParticipantData.endRun();
    location.replace('index.html');
  });
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.preventDefault();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopRing(); });
  window.addEventListener('pagehide', stopRing);
  return { active, begin, show,
    useImaginedNotes(getCollected) { imaginedNotes = getCollected; },
    openNotebook() { notebook.open(); },
  };
})();
