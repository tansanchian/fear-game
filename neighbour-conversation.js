// Shared by the playable conversation and its notebook transcript.
const NEIGHBOUR_CONVERSATION = [
  { speaker: 'You', character: null, text: 'Hello, aunty. Have you just moved in?' },
  { speaker: 'Neighbour', character: 'resident', text: 'Yes, only a few days ago. There are still boxes everywhere. Are you here to view a flat?' },
  { speaker: 'You', character: null, text: 'Yes, further down the corridor. Are you having some work done here?' },
  { speaker: 'Neighbour', character: 'resident', text: 'This is the feng shui master I invited. Before I settle everything, I wanted him to look at the place and help me put things right.' },
  { speaker: 'Feng shui master', character: 'master', text: 'I’m looking at the entrance first. There’s a heaviness on the side facing the unit next door… though this flat itself seems quite ordinary.' },
  { speaker: 'You', character: null, text: 'Was there something about the flat that worried you?' },
  { speaker: 'Neighbour', character: 'resident', text: 'I haven’t felt quite settled yet. Maybe it’s just because everything is unfamiliar. I thought making a few changes might help.' },
  { speaker: 'Feng shui master', character: 'master', text: 'For now, I’ve suggested moving her resting area away from that wall. A place can feel unsettled long after the people who lived there have gone. I wouldn’t say more without knowing its history.' },
  { speaker: 'Neighbour', character: 'resident', text: 'Once it’s all arranged, perhaps it will start to feel like home.' },
  { speaker: 'You', character: null, text: 'Thank you, aunty. I’ll leave you both to settle things.' },
];

const NeighbourConversation = (() => {
  const dialog = document.getElementById('neighbour-conversation');
  const dialogue = document.getElementById('neighbour-dialogue');
  const previous = document.getElementById('neighbour-previous');
  const loading = document.getElementById('neighbour-loading');
  const portraits = [...dialog.querySelectorAll('.neighbour-portraits img')];
  const door = document.getElementById('day2-neighbour-door');
  let api;
  let lineIndex = 0;
  let ready = false;
  let request = 0;

  function renderLine() {
    const line = NEIGHBOUR_CONVERSATION[lineIndex];
    document.getElementById('neighbour-speaker').textContent = line.speaker;
    document.getElementById('neighbour-line').textContent = line.text;
    document.getElementById('neighbour-continue').textContent = lineIndex === NEIGHBOUR_CONVERSATION.length - 1
      ? (Discovery.hasCollected('neighbourConversation') ? 'Back to corridor →' : 'Save conversation & return →') : 'Click to continue →';
    for (const portrait of dialog.querySelectorAll('[data-character]')) portrait.classList.toggle('is-speaking', portrait.dataset.character === line.character);
    dialogue.dataset.speaker = line.character ?? 'you';
    previous.hidden = lineIndex === 0;
    api.refresh();
  }
  async function open(index = 0) {
    if (dialog.open || Discovery.isOpen() || !Discovery.canInspect('neighbourConversation') || !api.canOpen()) return;
    api.prepare();
    lineIndex = Number.isInteger(index) ? Math.max(0, Math.min(index, NEIGHBOUR_CONVERSATION.length - 1)) : 0;
    ready = false;
    const attempt = ++request;
    dialogue.hidden = true; previous.hidden = true; loading.hidden = false;
    loading.textContent = 'Approaching the doorway…';
    dialog.showModal();
    document.getElementById('neighbour-back').focus();
    api.refresh();
    try { await Promise.all(portraits.map(portrait => portrait.decode())); }
    catch {
      if (attempt !== request || !dialog.open) return;
      loading.textContent = 'The conversation images could not load. Return to the corridor and try again.';
      return;
    }
    if (attempt !== request || !dialog.open) return;
    ready = true; loading.hidden = true; dialogue.hidden = false;
    renderLine(); dialogue.focus();
  }
  function close() { if (dialog.open) dialog.close(); }
  dialogue.addEventListener('click', () => {
    if (!ready || !dialog.open) return;
    if (lineIndex === NEIGHBOUR_CONVERSATION.length - 1) {
      Discovery.record('neighbourConversation');
      close();
    } else { lineIndex += 1; renderLine(); }
  });
  previous.addEventListener('click', () => { if (ready && lineIndex > 0) { lineIndex -= 1; renderLine(); dialogue.focus(); } });
  document.getElementById('neighbour-back').addEventListener('click', close);
  dialog.addEventListener('close', () => {
    request += 1; ready = false;
    api.refresh();
    if (!door.hidden) door.focus();
  });
  return { open, snapshot: () => dialog.open ? lineIndex : null, init: config => { api = config; } };
})();
