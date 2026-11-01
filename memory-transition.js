// Finish the current inspection before calling sync from Discovery.render.
const MemoryTransition = (() => {
  const dialog = document.getElementById('memory-transition');
  const previewImage = document.getElementById('phone-preview-image');
  const thread = document.getElementById('phone-thread');
  const postImage = document.getElementById('phone-post-image');
  const postLoading = document.getElementById('phone-post-loading');
  const postScroll = document.getElementById('phone-post-scroll');
  const threadImages = [...thread.querySelectorAll('img[data-src]')];
  const failedImages = new Set();
  const readyImages = new Set();
  const imageRequests = new WeakMap();
  const title = document.getElementById('memory-transition-title');
  let shown = null;
  let leaving = false;
  let corridorPosition = 0;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function renderThreadLoading() {
    const waitingForPost = !readyImages.has(postImage) && !failedImages.has(postImage);
    previewImage.hidden = !readyImages.has(postImage);
    document.getElementById('phone-preview-caption').textContent = waitingForPost ? 'Loading post preview…' : 'Open post and comments →';
    postLoading.hidden = !waitingForPost;
    thread.hidden = waitingForPost;
    postScroll.setAttribute('aria-busy', String(waitingForPost));
    document.getElementById('phone-post-error').hidden = failedImages.size === 0;
  }
  function imageFailed(image) {
    imageRequests.set(image, (imageRequests.get(image) || 0) + 1);
    readyImages.delete(image); failedImages.add(image); image.hidden = true;
    renderThreadLoading();
  }
  async function imageLoaded(image) {
    const request = (imageRequests.get(image) || 0) + 1;
    imageRequests.set(image, request);
    try { await image.decode(); }
    catch { if (imageRequests.get(image) === request) imageFailed(image); return; }
    if (imageRequests.get(image) !== request) return;
    failedImages.delete(image); readyImages.add(image); image.hidden = false;
    renderThreadLoading();
  }

  function sync(context = {}) {
    if (Number.isInteger(context.position)) corridorPosition = context.position;
    const phase = MemoryJourney.phase();
    if (!MemoryJourney.active() || shown === phase || leaving) return;
    if (phase === 'retreat') {
      leaving = true; location.replace('memory-return.html'); return;
    }
    if (['walk', 'ending', 'complete'].includes(phase)) {
      leaving = true;
      location.replace('hallucination.html');
      return;
    }
    shown = phase;
    for (const name of ['preview', 'post']) document.getElementById(`memory-stage-${name}`).hidden = name !== phase;
    dialog.dataset.stage = phase;
    title.textContent = phase === 'preview' ? 'Something catches your eye' : 'The post and its replies';
    if (!dialog.open) dialog.showModal();
    if (phase === 'post') {
      renderThreadLoading();
      // Start at the post, even when the browser restores a previous scroll position.
      dialog.scrollTop = 0; postScroll.scrollTop = 0; postScroll.scrollLeft = 0;
      postScroll.focus({ preventScroll: true });
    } else {
      renderThreadLoading(); document.getElementById('phone-open-post').focus();
    }
  }
  function readPost() {
    if (MemoryJourney.advance('post')) sync();
  }
  async function putAway() {
    if (leaving || !MemoryJourney.advance('retreat')) return;
    leaving = true;
    document.getElementById('phone-put-away').disabled = true;
    await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced() ? 1 : 650, fill: 'forwards' }).finished.catch(() => {});
    location.replace(`memory-return.html?start=${corridorPosition}`);
  }
  document.getElementById('phone-open-post').addEventListener('click', readPost);
  document.getElementById('phone-put-away').addEventListener('click', () => { void putAway(); });
  document.getElementById('phone-post-zoom').addEventListener('click', event => {
    const enlarged = thread.classList.toggle('is-enlarged');
    event.currentTarget.textContent = enlarged ? 'Fit thread' : 'Enlarge thread';
    event.currentTarget.setAttribute('aria-pressed', String(enlarged));
  });
  for (const image of threadImages) {
    image.addEventListener('error', () => imageFailed(image));
    image.addEventListener('load', () => { void imageLoaded(image); });
    // Real src attributes preload the post and comments before the preview opens.
    // Cached images may have finished loading before these listeners were attached.
    if (image.complete) {
      if (image.naturalWidth) void imageLoaded(image);
      else imageFailed(image);
    }
  }
  document.getElementById('phone-post-retry').addEventListener('click', () => {
    for (const image of [...failedImages]) {
      imageRequests.set(image, (imageRequests.get(image) || 0) + 1);
      failedImages.delete(image); readyImages.delete(image);
      image.src = `${image.dataset.src}?retry=${Date.now()}`;
      if (image === postImage) previewImage.src = image.src;
    }
    renderThreadLoading();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (MemoryJourney.phase() === 'post') void putAway();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    if (MemoryJourney.phase() === 'post') void putAway();
  });
  return { sync };
})();
