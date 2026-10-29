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
  power: {
    image: 'assets/power_box.jpg',
    title: 'POWER BOX',
    alt: 'Power box outside the unit',
    position: stops.length - 1,
  },
  powerClose: {
    image: 'assets/close_up_power_box.jpg',
    title: 'METER NUMBER',
    alt: 'Close-up of the meter display and serial number',
    position: stops.length - 1,
  },
};

const explorer = document.getElementById('explorer');
const scene = document.getElementById('scene');
const introStage = document.getElementById('intro-stage');
const liftFrameA = document.getElementById('lift-frame-a');
const liftFrameB = document.getElementById('lift-frame-b');
const liftVideo = liftFrameA;
const liftPrompt = document.getElementById('lift-prompt');
const liftPromptLocation = document.getElementById('lift-prompt-location');
const liftPromptTitle = document.getElementById('lift-prompt-title');
const liftNextLabel = document.getElementById('lift-next-label');
const corridorStage = document.getElementById('corridor-stage');
const corridorCamera = document.getElementById('corridor-camera');
const artifactStage = document.getElementById('artifact-stage');
const artifactPhoto = document.getElementById('artifact-photo');
const artifactBackdrop = document.getElementById('artifact-backdrop');
const frameA = document.getElementById('frame-a');
const frameB = document.getElementById('frame-b');
const powerHotspot = document.getElementById('view-power-box');
const backButton = document.getElementById('back-button');
const floorArrow = document.getElementById('floor-arrow');
const mapPrompt = document.getElementById('map-prompt');
const destinationCard = document.getElementById('destination-card');
const artifactReturn = document.getElementById('artifact-return');
const artifactTitle = document.getElementById('artifact-title');
const returnButton = document.getElementById('return-to-corridor');
const returnIcon = document.getElementById('return-icon');
const returnLabel = document.getElementById('return-label');
const viewPowerCloseButton = document.getElementById('view-power-close');
const replayButton = document.getElementById('replay-lift');
const infoButton = document.getElementById('info-button');
const infoPanel = document.getElementById('info-panel');
const announcement = document.getElementById('announcement');
const zoomInButton = document.getElementById('zoom-in');
const zoomOutButton = document.getElementById('zoom-out');
const fullscreenButton = document.getElementById('fullscreen');

let position = 0;
let activeFrame = frameA;
let inactiveFrame = frameB;
let introActive = true;
let liftPosition = 0;
let liftReady = false;
let activeLiftFrame = liftFrameA;
let inactiveLiftFrame = liftFrameB;
let fromIntro = false;
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

function layoutPowerHotspot() {
  const width = corridorCamera.clientWidth;
  const height = corridorCamera.clientHeight;
  if (!width || !height) return;
  const imageScale = Math.max(width / 1280, height / 720);
  const positionPercent = parseFloat(getComputedStyle(activeFrame).objectPosition);
  const imagePositionX = Number.isFinite(positionPercent) ? positionPercent / 100 : .5;
  const offsetX = (width - 1280 * imageScale) * imagePositionX;
  const offsetY = (height - 720 * imageScale) / 2;
  powerHotspot.style.left = `${offsetX + 430 * imageScale}px`;
  powerHotspot.style.top = `${offsetY + 52 * imageScale}px`;
  powerHotspot.style.width = `${70 * imageScale}px`;
  powerHotspot.style.height = `${165 * imageScale}px`;
}

function render() {
  const busy = transitioning || turning;
  explorer.classList.toggle('is-power-artifact', artifact === 'power' || artifact === 'powerClose');
  liftPrompt.hidden = busy || !introActive || (liftPosition === 0 && !liftReady);
  liftPromptLocation.textContent = liftPosition === 0 ? 'INSIDE THE LIFT' : 'LIFT LOBBY';
  liftPromptTitle.textContent = liftPosition === 0 ? 'The doors are open' : 'You are out of the lift';
  liftNextLabel.textContent = liftPosition === 0 ? 'Step out of the lift' : 'View floor plan';
  mapPrompt.hidden = busy || introActive || Boolean(artifact) || position !== 0;
  powerHotspot.hidden = busy || introActive || Boolean(artifact) || position !== stops.length - 1;
  destinationCard.hidden = busy || introActive || Boolean(artifact) || position !== stops.length - 1;
  artifactReturn.hidden = busy || !artifact;
  viewPowerCloseButton.hidden = busy || artifact !== 'power';
  replayButton.hidden = busy || artifact !== 'map' || !fromIntro;
  returnIcon.textContent = fromIntro ? '→' : '←';
  returnLabel.textContent = fromIntro ? 'Continue to corridor' : artifact === 'powerClose' ? 'Back to power box' : 'Back to corridor';
  backButton.disabled = busy || Boolean(artifact) || (introActive ? liftPosition === 0 : position === 0);
  floorArrow.disabled = busy || introActive || Boolean(artifact) || position === stops.length - 1;
  document.querySelector('.view-controls').hidden = introActive;
  infoButton.hidden = introActive;
  layoutPowerHotspot();
  renderCamera();
}

function playLiftOpening() {
  void liftVideo.play().catch(() => {
    liftReady = true;
    render();
    announcement.textContent = 'The lift video could not play. Step out of the lift to continue.';
  });
}

async function moveLift(next) {
  if (!introActive || transitioning || turning || next === liftPosition || next < 0 || next > 1 || (next === 1 && !liftReady)) return;
  transitioning = true;
  render();

  const incoming = inactiveLiftFrame;
  const outgoing = activeLiftFrame;
  if (next === 0) {
    liftReady = false;
    liftVideo.pause();
    liftVideo.currentTime = 0;
  } else {
    incoming.src = 'assets/lift-lobby.jpg';
    incoming.alt = 'Lift lobby with bicycles and a walkway ahead';
  }
  try {
    if (incoming instanceof HTMLImageElement && incoming.decode) await incoming.decode();
  } catch {
    transitioning = false;
    render();
    announcement.textContent = 'The lift viewpoint could not be loaded.';
    return;
  }

  const forward = next > liftPosition;
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 650;
  incoming.style.zIndex = '2';
  outgoing.style.zIndex = '1';
  const outgoingAnimation = outgoing.animate([
    { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
    { opacity: 0, transform: forward ? 'scale(1.15)' : 'scale(.9)', filter: 'blur(5px)' },
  ], { duration, easing: 'cubic-bezier(.2, .72, .2, 1)', fill: 'forwards' });
  const incomingAnimation = incoming.animate([
    { opacity: 0, transform: forward ? 'scale(.92)' : 'scale(1.1)', filter: 'blur(5px)' },
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
  activeLiftFrame = incoming;
  inactiveLiftFrame = outgoing;
  liftPosition = next;
  transitioning = false;
  render();
  if (next === 0) {
    playLiftOpening();
    announcement.textContent = 'Inside the lift. The doors are opening.';
  } else {
    document.getElementById('lift-next').focus();
    announcement.textContent = 'At the lift lobby. View the floor plan to continue.';
  }
}

async function transitionTo(next) {
  if (introActive || transitioning || turning || artifact || next === position || next < 0 || next >= stops.length) return;
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

async function finishIntro() {
  if (!introActive || liftPosition !== 1 || turning || transitioning) return;
  turning = true;
  render();
  try {
    if (artifactPhoto.decode) await artifactPhoto.decode();
  } catch {
    turning = false;
    render();
    announcement.textContent = 'The floor plan could not be loaded. Try again.';
    return;
  }

  introActive = false;
  fromIntro = true;
  artifact = 'map';
  explorer.classList.remove('is-intro');
  explorer.classList.add('has-left-intro', 'is-at-artifact');
  introStage.setAttribute('aria-hidden', 'true');
  artifactStage.setAttribute('aria-hidden', 'false');
  render();
  announcement.textContent = 'Arrived at the floor plan. Continue to the corridor when ready.';
  window.setTimeout(() => {
    turning = false;
    render();
    returnButton.focus();
  }, turnDuration());
}

async function openArtifact(kind) {
  const target = artifacts[kind];
  if (!target || introActive || position !== target.position || transitioning || turning || artifact) return;
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
  fromIntro = false;
  artifact = kind;
  explorer.classList.add('is-at-artifact');
  corridorStage.setAttribute('aria-hidden', 'true');
  artifactStage.setAttribute('aria-hidden', 'false');
  render();
  announcement.textContent = kind === 'map' ? 'Showing the floor plan.' : kind === 'power' ? 'Showing the power box.' : 'Showing the flat entrance.';
  window.setTimeout(() => {
    turning = false;
    render();
    (kind === 'power' ? viewPowerCloseButton : returnButton).focus();
  }, turnDuration());
}

async function showPowerView(nextKind) {
  if (!['power', 'powerClose'].includes(artifact) || !['power', 'powerClose'].includes(nextKind) || artifact === nextKind || turning) return;
  turning = true;
  render();
  const target = artifacts[nextKind];
  const preload = new Image();
  preload.src = target.image;
  try {
    if (preload.decode) await preload.decode();
  } catch {
    turning = false;
    render();
    announcement.textContent = 'This image could not be loaded.';
    return;
  }

  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 220;
  const fadeOut = artifactPhoto.animate([
    { opacity: 1, filter: 'blur(0px)' },
    { opacity: 0, filter: 'blur(4px)' },
  ], { duration, easing: 'ease-in', fill: 'forwards' });
  await fadeOut.finished;
  artifactPhoto.style.opacity = '0';
  fadeOut.cancel();
  artifactPhoto.src = target.image;
  artifactBackdrop.src = target.image;
  artifactPhoto.alt = target.alt;
  artifactPhoto.dataset.kind = nextKind;
  artifactTitle.textContent = target.title;
  artifact = nextKind;
  zoom = 1;
  lookX = 0;
  lookY = 0;
  renderCamera();
  const fadeIn = artifactPhoto.animate([
    { opacity: 0, filter: 'blur(4px)' },
    { opacity: 1, filter: 'blur(0px)' },
  ], { duration, easing: 'ease-out', fill: 'forwards' });
  await fadeIn.finished;
  artifactPhoto.style.opacity = '';
  fadeIn.cancel();
  turning = false;
  render();
  (nextKind === 'power' ? viewPowerCloseButton : returnButton).focus();
  announcement.textContent = nextKind === 'power' ? 'Back at the power box.' : 'Showing the meter number close-up.';
}

function returnFromArtifact() {
  if (!artifact || turning) return;
  if (artifact === 'powerClose') { void showPowerView('power'); return; }
  const previousArtifact = artifact;
  turning = true;
  render();
  artifact = null;
  fromIntro = false;
  explorer.classList.remove('is-at-artifact');
  corridorStage.setAttribute('aria-hidden', 'false');
  artifactStage.setAttribute('aria-hidden', 'true');
  if (savedView) ({ zoom, lookX, lookY } = savedView);
  savedView = null;
  render();
  window.setTimeout(() => {
    turning = false;
    render();
    (previousArtifact === 'map' ? document.getElementById('view-floor-plan') : previousArtifact === 'power' ? document.getElementById('view-power-box') : document.getElementById('see-flat')).focus();
  }, turnDuration());
  announcement.textContent = `Returned to ${stops[position].label.toLowerCase()}.`;
}

function replayLift() {
  if (artifact !== 'map' || !fromIntro || turning) return;
  turning = true;
  render();
  artifact = null;
  fromIntro = false;
  introActive = true;
  explorer.classList.remove('is-at-artifact', 'has-left-intro');
  explorer.classList.add('is-intro');
  introStage.setAttribute('aria-hidden', 'false');
  artifactStage.setAttribute('aria-hidden', 'true');
  infoPanel.hidden = true;
  render();
  window.setTimeout(() => { turning = false; render(); document.getElementById('lift-next').focus(); }, turnDuration());
  announcement.textContent = 'Returned to the lift lobby.';
}

backButton.addEventListener('click', () => { if (introActive) void moveLift(0); else void transitionTo(position - 1); });
floorArrow.addEventListener('click', () => { void transitionTo(position + 1); });
liftVideo.addEventListener('ended', () => {
  liftVideo.pause();
  liftReady = true;
  render();
  announcement.textContent = 'The lift doors are open. Step out of the lift to continue.';
});
liftVideo.addEventListener('error', () => {
  liftReady = true;
  render();
  announcement.textContent = 'The lift video could not load. Step out of the lift to continue.';
});
document.getElementById('lift-next').addEventListener('click', () => { if (liftPosition === 0) void moveLift(1); else void finishIntro(); });
document.getElementById('view-floor-plan').addEventListener('click', () => { void openArtifact('map'); });
document.getElementById('see-flat').addEventListener('click', () => { void openArtifact('flat'); });
document.getElementById('view-power-box').addEventListener('click', () => { void openArtifact('power'); });
viewPowerCloseButton.addEventListener('click', () => { void showPowerView('powerClose'); });
returnButton.addEventListener('click', returnFromArtifact);
replayButton.addEventListener('click', replayLift);
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
  if (event.button !== 0 || event.target.closest('button')) return;
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
window.addEventListener('resize', layoutPowerHotspot);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !infoPanel.hidden) { infoPanel.hidden = true; return; }
  if (introActive) {
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); if (liftPosition === 0) void moveLift(1); else void finishIntro(); }
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); void moveLift(0); }
    return;
  }
  if (event.key === 'Escape' && artifact) { returnFromArtifact(); return; }
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); void transitionTo(position + 1); }
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); if (artifact) returnFromArtifact(); else void transitionTo(position - 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); lookX -= 4; renderCamera(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); lookX += 4; renderCamera(); }
});

render();
playLiftOpening();
