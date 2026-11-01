// Finish the current inspection before calling sync from Discovery.render.
const MemoryTransition = (() => {
  const dialog = document.getElementById('memory-transition');
  const video = document.getElementById('phone-video');
  const post = document.getElementById('phone-post-image');
  const title = document.getElementById('memory-transition-title');
  let shown = null;
  let leaving = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showVideoError() {
    document.getElementById('phone-video-status').textContent = 'The video could not load. You can still read the post.';
  }

  function sync() {
    const phase = MemoryJourney.phase();
    if (!MemoryJourney.active() || shown === phase || leaving) return;
    if (['walk', 'ending', 'complete'].includes(phase)) {
      leaving = true;
      location.replace('hallucination.html');
      return;
    }
    shown = phase;
    video.pause();
    for (const name of ['prompt', 'phone', 'post']) document.getElementById(`memory-stage-${name}`).hidden = name !== phase;
    dialog.dataset.stage = phase;
    title.textContent = phase === 'prompt' ? 'A question that won’t leave you' : phase === 'phone' ? 'Looking up the block' : 'Something stays with you';
    if (!dialog.open) dialog.showModal();
    if (phase === 'phone') {
      video.muted = !Discovery.soundEnabled();
      video.volume = .45;
      document.getElementById('phone-read-post').focus();
      // Metadata can fail before this script's error listener is registered.
      if (video.error) showVideoError();
      else if (!reduced()) void video.play().catch(() => {
        document.getElementById('phone-video-status').textContent = 'Use the video controls to play, or continue to the post.';
      });
    } else if (phase === 'post') {
      post.src = 'assets/hallucination_reddit.png';
      document.getElementById('phone-put-away').focus();
    } else document.getElementById('phone-search').focus();
  }
  function readPost() {
    if (MemoryJourney.advance('post')) sync();
  }
  async function putAway() {
    if (leaving || !MemoryJourney.advance('walk')) return;
    leaving = true;
    document.getElementById('phone-put-away').disabled = true;
    await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 1 : 650, fill: 'forwards' }).finished.catch(() => {});
    location.replace('hallucination.html?start=1');
  }
  document.getElementById('phone-search').addEventListener('click', () => {
    if (MemoryJourney.advance('phone')) sync();
  });
  document.getElementById('phone-read-post').addEventListener('click', readPost);
  document.getElementById('phone-put-away').addEventListener('click', () => { void putAway(); });
  document.getElementById('phone-post-zoom').addEventListener('click', event => {
    const enlarged = post.classList.toggle('is-enlarged');
    event.currentTarget.textContent = enlarged ? 'Fit image' : 'Enlarge image';
    event.currentTarget.setAttribute('aria-pressed', String(enlarged));
  });
  video.addEventListener('ended', readPost);
  video.addEventListener('error', showVideoError);
  post.addEventListener('error', () => { document.getElementById('phone-post-error').hidden = false; });
  post.addEventListener('load', () => { document.getElementById('phone-post-error').hidden = true; });
  document.getElementById('phone-post-retry').addEventListener('click', () => {
    post.src = `assets/hallucination_reddit.png?retry=${Date.now()}`;
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (MemoryJourney.phase() === 'post') void putAway();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  window.addEventListener('pagehide', () => video.pause());
  return { sync };
})();
