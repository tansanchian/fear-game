const stops = [
  { image: 'assets/stop-01.jpg', label: 'At the corridor entrance' },
  { image: 'assets/stop-02.jpg', label: 'Passing the first homes' },
  { image: 'assets/stop-03.jpg', label: 'Halfway along the corridor' },
  { image: 'assets/stop-04.jpg', label: 'Approaching the last units' },
  { image: 'assets/stop-05.jpg', label: 'In front of the flat' },
];

const artifacts = {
  map: {
    image: 'assets/floor_plan_view.jpg',
    title: 'FLOOR PLAN',
    alt: 'Floor plan sign with the block and floor label blurred',
    position: 0,
  },
  flat: {
    image: 'assets/hdb_door.jpg',
    title: 'FLAT ENTRANCE',
    alt: 'Entrance gate of the flat',
    position: stops.length - 1,
  },
};

const explorer = document.getElementById('explorer');
const scene = document.getElementById('scene');
const corridorStage = document.getElementById('corridor-stage');
const corridorCamera = document.getElementById('corridor-camera');
const artifactStage = document.getElementById('artifact-stage');
const artifactPhoto = document.getElementById('artifact-photo');
const artifactBackdrop = document.getElementById('artifact-backdrop');
const frameA = document.getElementById('frame-a');
const frameB = document.getElementById('frame-b');
const backButton = document.getElementById('back-button');
const floorArrow = document.getElementById('floor-arrow');
const mapPrompt = document.getElementById('map-prompt');
const destinationCard = document.getElementById('destination-card');
const artifactReturn = document.getElementById('artifact-return');
const artifactTitle = document.getElementById('artifact-title');
const returnButton = document.getElementById('return-to-corridor');
const infoPanel = document.getElementById('info-panel');
const announcement = document.getElementById('announcement');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const fullscreenButton = document.getElementById('fullscreen');

let position = 0;
let activeFrame = frameA;
let inactiveFrame = frameB;
let artifact = null;
let transitioning = false;
let turning = false;
let zoom = 1;
let lookX = 0;
let lookY = 0;
let savedView = null;
let pointer = null;

for (const stop of stops.slice(1)) {
  const preload = new Image();
  preload.src = stop.image;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function turnDuration() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 900;
}

function renderCamera() {
  const corridorScale = 1.08 * zoom;
  const artifactScale = zoom;
  const scale = artifact ? artifactScale : corridorScale;
  const limit = (scale - 1) * 50;
  const x = clamp(lookX, -limit, limit);
  const y = clamp(lookY, -limit, limit);
  corridorCamera.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${corridorScale})`;
  artifactPhoto.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${artifactScale})`;
  zoomInButton.disabled = zoom >= (artifact === 'map' ? 3 : 1.6);
  zoomOutButton.disabled = zoom <= 1;
}

function render() {
  const busy = transitioning || turning;
  mapPrompt.hidden = busy || Boolean(artifact) || position !== 0;
  destinationCard.hidden = busy || Boolean(artifact) || position !== stops.length - 1;
  artifactReturn.hidden = busy || !artifact;
  backButton.disabled = busy || Boolean(artifact) || position === 0;
  floorArrow.disabled = busy || Boolean(artifact) || position === stops.length - 1;
  renderCamera();
}

async function transitionTo(next) {
  if (transitioning || turning || artifact || next === position || next < 0 || next >= stops.length) return;
  transitioning = true;
  render();

  const incoming = inactiveFrame;
  const outgoing = activeFrame;
  incoming.src = stops[next].image;
  incoming.dataset.stop = String(next);
  incoming.alt = `Corridor stop ${next + 1}: ${stops[next].label}`;
  try {
    if (incoming.decode) await incoming.decode();
  } catch {
    transitioning = false;
    render();
    announcement.textContent = 'This corridor view could not be loaded.';
    return;
  }

  const forward = next > position;
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 720;
  incoming.style.zIndex = '2';
  outgoing.style.zIndex = '1';
  const outgoingAnimation = outgoing.animate([
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
    { opacity: .92, transform: forward ? 'scale(1.035)' : 'scale(.97)', filter: 'blur(0px)', offset: .3 },
    { opacity: 0, transform: forward ? 'scale(1.13)' : 'scale(.88)', filter: 'blur(5px)' },
  ], { duration, easing: 'cubic-bezier(.2, .72, .2, 1)', fill: 'forwards' });
  const incomingAnimation = incoming.animate([
    { opacity: 0, transform: forward ? 'scale(.9)' : 'scale(1.12)', filter: 'blur(5px)' },
    { opacity: .08, transform: forward ? 'scale(.93)' : 'scale(1.08)', filter: 'blur(3px)', offset: .28 },
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
  ], { duration, easing: 'cubic-bezier(.2, .72, .2, 1)', fill: 'forwards' });

  await Promise.allSettled([outgoingAnimation.finished, incomingAnimation.finished]);
  outgoing.classList.remove('is-active');
  outgoing.setAttribute('aria-hidden', 'true');
  incoming.classList.add('is-active');
  incoming.removeAttribute('aria-hidden');
  outgoingAnimation.cancel();
  incomingAnimation.cancel();
  outgoing.style.zIndex = '';
  incoming.style.zIndex = '';
  activeFrame = incoming;
  inactiveFrame = outgoing;
  position = next;
  transitioning = false;
  render();
  announcement.textContent = `${stops[position].label}. Stop ${position + 1} of ${stops.length}.`;
}

async function openArtifact(kind) {
  const target = artifacts[kind];
  if (!target || position !== target.position || transitioning || turning || artifact) return;
  turning = true;
  render();
  artifactPhoto.src = target.image;
  artifactBackdrop.src = target.image;
  artifactPhoto.alt = target.alt;
  artifactPhoto.dataset.kind = kind;
  artifactTitle.textContent = target.title;
  try {
    if (artifactPhoto.decode) await artifactPhoto.decode();
  } catch {
    turning = false;
    render();
    announcement.textContent = 'This image could not be loaded.';
    return;
  }

  savedView = { zoom, lookX, lookY };
  zoom = 1;
  lookX = 0;
  lookY = 0;
  artifact = kind;
  explorer.classList.add('is-at-artifact');
  corridorStage.setAttribute('aria-hidden', 'true');
  artifactStage.setAttribute('aria-hidden', 'false');
  render();
  announcement.textContent = kind === 'map' ? 'Showing the floor plan.' : 'Showing the flat entrance.';
  window.setTimeout(() => {
    turning = false;
    render();
    returnButton.focus();
  }, turnDuration());
}

function returnFromArtifact() {
  if (!artifact || turning) return;
  const previousArtifact = artifact;
  turning = true;
  render();
  artifact = null;
  explorer.classList.remove('is-at-artifact');
  corridorStage.setAttribute('aria-hidden', 'false');
  artifactStage.setAttribute('aria-hidden', 'true');
  if (savedView) ({ zoom, lookX, lookY } = savedView);
  savedView = null;
  render();
  window.setTimeout(() => {
    turning = false;
    render();
    (previousArtifact === 'map' ? document.getElementById('view-floor-plan') : document.getElementById('see-flat')).focus();
  }, turnDuration());
  announcement.textContent = `Returned to ${stops[position].label.toLowerCase()}.`;
}

backButton.addEventListener('click', () => { void transitionTo(position - 1); });
floorArrow.addEventListener('click', () => { void transitionTo(position + 1); });
document.getElementById('view-floor-plan').addEventListener('click', () => { void openArtifact('map'); });
document.getElementById('see-flat').addEventListener('click', () => { void openArtifact('flat'); });
returnButton.addEventListener('click', returnFromArtifact);
zoomInButton.addEventListener('click', () => { zoom = Math.round(clamp(zoom + .2, 1, artifact === 'map' ? 3 : 1.6) * 10) / 10; renderCamera(); });
zoomOutButton.addEventListener('click', () => { zoom = Math.round(clamp(zoom - .2, 1, artifact === 'map' ? 3 : 1.6) * 10) / 10; renderCamera(); });
document.getElementById('reset-view').addEventListener('click', () => { zoom = 1; lookX = 0; lookY = 0; renderCamera(); });
document.getElementById('info-button').addEventListener('click', () => { infoPanel.hidden = !infoPanel.hidden; });
document.getElementById('info-close').addEventListener('click', () => { infoPanel.hidden = true; });

fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await explorer.requestFullscreen();
  } catch {
    announcement.textContent = 'Full screen is unavailable in this browser.';
  }
});
document.addEventListener('fullscreenchange', () => {
  const isFull = Boolean(document.fullscreenElement);
  fullscreenButton.setAttribute('aria-label', isFull ? 'Exit full screen' : 'Enter full screen');
  fullscreenButton.title = isFull ? 'Exit full screen' : 'Full screen';
});

scene.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, lookX, lookY };
  scene.setPointerCapture(event.pointerId);
  scene.classList.add('dragging');
});
scene.addEventListener('pointermove', (event) => {
  if (!pointer || event.pointerId !== pointer.id) return;
  lookX = pointer.lookX + ((event.clientX - pointer.x) / scene.clientWidth) * 100;
  lookY = pointer.lookY + ((event.clientY - pointer.y) / scene.clientHeight) * 100;
  renderCamera();
});
function endDrag(event) {
  if (!pointer || event.pointerId !== pointer.id) return;
  pointer = null;
  scene.classList.remove('dragging');
}
scene.addEventListener('pointerup', endDrag);
scene.addEventListener('pointercancel', endDrag);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !infoPanel.hidden) { infoPanel.hidden = true; return; }
  if (event.key === 'Escape' && artifact) { returnFromArtifact(); return; }
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); void transitionTo(position + 1); }
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); if (artifact) returnFromArtifact(); else void transitionTo(position - 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); lookX -= 4; renderCamera(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); lookX += 4; renderCamera(); }
});

render();
