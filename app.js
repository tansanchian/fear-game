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
  flyer: {
    image: 'assets/nearby-listing-flyer.svg',
    title: 'NEARBY LISTING',
    alt: 'For sale flyer for a nearby three-room flat with an asking price of $688,000',
    position: 1,
  },
  flat: {
    image: 'assets/hdb_door.jpg',
    title: 'FLAT ENTRANCE',
    alt: 'Entrance gate of the flat',
    position: stops.length - 1,
  },
  filmRequest: {
    image: 'assets/film_request.jpg',
    title: 'PAPER ON THE DOOR',
    alt: 'Letter requesting the use of a home as a filming location',
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
const artifactHotspotLayer = document.getElementById('artifact-hotspot-layer');
const filmRequestHotspot = document.getElementById('view-film-request');
const frameA = document.getElementById('frame-a');
const frameB = document.getElementById('frame-b');
const flatDoorHotspot = document.getElementById('view-flat-door');
const powerHotspot = document.getElementById('view-power-box');
const objectNote = document.getElementById('object-note');
const objectNoteTitle = document.getElementById('object-note-title');
const objectNoteClose = document.getElementById('object-note-close');
const backButton = document.getElementById('back-button');
const floorArrow = document.getElementById('floor-arrow');
const mapPrompt = document.getElementById('map-prompt');
const destinationCard = document.getElementById('destination-card');
const destinationClose = document.getElementById('destination-close');
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
const sceneHotspots = [
  { button: document.getElementById('view-shoe-cabinet'), stop: 0, title: 'A shoe cabinet', bounds: { x: 382, y: 185, width: 118, height: 525 } },
  { button: document.getElementById('view-wooden-blocks'), stop: 0, title: 'Wooden blocks on the floor', bounds: { x: 515, y: 395, width: 58, height: 130 } },
  { button: document.getElementById('view-listing-flyer'), stop: 1, bounds: { x: 394, y: 283, width: 52, height: 76 } },
  { button: document.getElementById('view-stop-two-plants'), stop: 1, title: 'Plants', bounds: { x: 440, y: 345, width: 150, height: 215 } },
  { button: document.getElementById('view-trolley'), stop: 2, title: 'A trolley', bounds: { x: 502, y: 345, width: 108, height: 205 } },
  { button: document.getElementById('view-wheelchair'), stop: 3, title: 'A wheelchair', bounds: { x: 385, y: 485, width: 155, height: 235 } },
  { button: document.getElementById('view-door-sign'), stop: 3, title: 'Unit 491', bounds: { x: 338, y: 118, width: 55, height: 28 } },
  { button: document.getElementById('view-hanging-clothes'), stop: 4, title: 'Hanging clothes', bounds: { x: 585, y: 145, width: 105, height: 275 } },
  { button: flatDoorHotspot, stop: stops.length - 1, bounds: { x: 478, y: 220, width: 74, height: 420 } },
  { button: powerHotspot, stop: stops.length - 1, bounds: { x: 430, y: 52, width: 70, height: 165 } },
];

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
let notedObject = null;
let doorPromptOpen = false;

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

function maxZoom() {
  return ['map', 'flyer', 'filmRequest'].includes(artifact) ? 3 : 1.6;
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
  artifactHotspotLayer.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${artifactScale})`;
  zoomInButton.disabled = zoom >= maxZoom();
  zoomOutButton.disabled = zoom <= 1;
}

function layoutSceneHotspots() {
  const width = corridorCamera.clientWidth;
  const height = corridorCamera.clientHeight;
  if (!width || !height) return;
  const imageScale = Math.max(width / 1280, height / 720);
  const positionPercent = parseFloat(getComputedStyle(activeFrame).objectPosition);
  const imagePositionX = Number.isFinite(positionPercent) ? positionPercent / 100 : .5;
  const offsetX = (width - 1280 * imageScale) * imagePositionX;
  const offsetY = (height - 720 * imageScale) / 2;
  for (const { button, bounds } of sceneHotspots) {
    button.style.left = `${offsetX + bounds.x * imageScale}px`;
    button.style.top = `${offsetY + bounds.y * imageScale}px`;
    button.style.width = `${bounds.width * imageScale}px`;
    button.style.height = `${bounds.height * imageScale}px`;
  }
}

function layoutFilmRequestHotspot() {
  const width = artifactStage.clientWidth;
  const height = artifactStage.clientHeight;
  const imageWidth = artifactPhoto.naturalWidth;
  const imageHeight = artifactPhoto.naturalHeight;
  if (!width || !height || !imageWidth || !imageHeight) return;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const offsetX = (width - imageWidth * scale) / 2;
  const offsetY = (height - imageHeight * scale) / 2;
  const paper = { x: 290, y: 575, width: 45, height: 82 };
  filmRequestHotspot.style.left = `${offsetX + paper.x * scale}px`;
  filmRequestHotspot.style.top = `${offsetY + paper.y * scale}px`;
  filmRequestHotspot.style.width = `${paper.width * scale}px`;
  filmRequestHotspot.style.height = `${paper.height * scale}px`;
}

function positionObjectNote() {
  if (!notedObject || objectNote.hidden) return;
  const rect = notedObject.button.getBoundingClientRect();
  const host = explorer.getBoundingClientRect();
  const noteWidth = objectNote.offsetWidth;
  const nextToObject = rect.right - host.left + 12;
  const left = nextToObject + noteWidth < host.width - 12 ? nextToObject : Math.max(12, rect.left - host.left - noteWidth - 12);
  objectNote.style.left = `${left}px`;
  objectNote.style.top = `${clamp(rect.top - host.top + 18, 12, host.height - objectNote.offsetHeight - 12)}px`;
}

function dismissObjectNote(restoreFocus = false) {
  const previous = notedObject;
  notedObject = null;
  objectNote.hidden = true;
  if (restoreFocus && previous && !previous.button.hidden) previous.button.focus();
  if (previous) queueMicrotask(render);
}

function showObjectNote(item) {
  if (Discovery.isOpen() || !Discovery.canInspect(item.button.id) || introActive || transitioning || turning || artifact || position !== item.stop) return;
  if (notedObject === item) { dismissObjectNote(true); return; }
  notedObject = item;
  objectNoteTitle.textContent = item.title;
  objectNote.classList.toggle('is-long', item.title.length > 28);
  objectNote.hidden = false;
  positionObjectNote();
  objectNoteClose.focus();
  announcement.textContent = item.title;
  Discovery.inspect(item.button.id);
  render();
}

function dismissDoorPrompt(restoreFocus = false) {
  doorPromptOpen = false;
  render();
  if (restoreFocus && !flatDoorHotspot.hidden) flatDoorHotspot.focus();
}

function showDoorPrompt() {
  if (Discovery.isOpen() || introActive || transitioning || turning || artifact || position !== stops.length - 1) return;
  dismissObjectNote();
  doorPromptOpen = true;
  render();
  document.getElementById('see-flat').focus();
  announcement.textContent = 'Flat entrance. See the flat or dismiss this prompt.';
}

function render() {
  const busy = transitioning || turning;
  if (position !== stops.length - 1) doorPromptOpen = false;
  if (notedObject && (busy || introActive || artifact || position !== notedObject.stop)) dismissObjectNote();
  explorer.classList.toggle('is-power-artifact', artifact === 'power' || artifact === 'powerClose');
  liftPrompt.hidden = busy || !introActive || (liftPosition === 0 && !liftReady);
  liftPromptLocation.textContent = `DAY ${Discovery.day()} · ${liftPosition === 0 ? 'INSIDE THE LIFT' : 'LIFT LOBBY'}`;
  liftPromptTitle.textContent = liftPosition === 0 ? 'The doors are open' : 'You are out of the lift';
  liftNextLabel.textContent = liftPosition === 0 ? 'Step out of the lift' : 'View floor plan';
  mapPrompt.hidden = busy || introActive || Boolean(artifact) || position !== 0;
  for (const item of sceneHotspots) item.button.hidden = busy || introActive || Boolean(artifact) || position !== item.stop || !Discovery.available(item.button.id);
  filmRequestHotspot.hidden = busy || artifact !== 'flat' || !Discovery.available('filmRequest');
  destinationCard.hidden = busy || introActive || Boolean(artifact) || position !== stops.length - 1 || !doorPromptOpen;
  artifactReturn.hidden = busy || !artifact;
  viewPowerCloseButton.hidden = busy || artifact !== 'power' || !Discovery.canInspect('powerClose');
  replayButton.hidden = busy || artifact !== 'map' || !fromIntro;
  returnIcon.textContent = fromIntro ? '→' : '←';
  returnLabel.textContent = fromIntro ? 'Continue to corridor' : artifact === 'powerClose' ? 'Back to power box' : artifact === 'filmRequest' ? 'Back to flat' : 'Back to corridor';
  backButton.disabled = busy || Boolean(artifact) || (introActive ? liftPosition === 0 : position === 0);
  floorArrow.disabled = busy || introActive || Boolean(artifact) || position === stops.length - 1;
  document.querySelector('.view-controls').hidden = introActive;
  infoButton.hidden = introActive;
  layoutSceneHotspots();
  if (artifact === 'flat') layoutFilmRequestHotspot();
  renderCamera();
  Discovery.render({ introActive, busy, artifact, position, doorPromptOpen, inspecting: Boolean(notedObject) });
  if (!busy) saveProgress();
}

function playLiftOpening() {
  void liftVideo.play().catch(() => {
    liftReady = true;
    render();
    announcement.textContent = 'The lift video could not play. Step out of the lift to continue.';
  });
}

async function moveLift(next) {
  if (Discovery.isOpen() || !introActive || transitioning || turning || next === liftPosition || next < 0 || next > 1 || (next === 1 && !liftReady)) return;
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
  if (Discovery.isOpen() || introActive || transitioning || turning || artifact || next === position || next < 0 || next >= stops.length) return;
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
  Discovery.move(position, next);
  position = next;
  transitioning = false;
  render();
  announcement.textContent = `${stops[position].label}. Stop ${position + 1} of ${stops.length}.`;
}

async function finishIntro() {
  if (Discovery.isOpen() || !introActive || liftPosition !== 1 || turning || transitioning) return;
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
  if (Discovery.isOpen() || !Discovery.canInspect(kind) || !target || introActive || position !== target.position || transitioning || turning || artifact) return;
  if (kind !== 'flat') doorPromptOpen = false;
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
  announcement.textContent = kind === 'map' ? 'Showing the floor plan.' : kind === 'flyer' ? 'Showing the nearby listing flyer.' : kind === 'power' ? 'Showing the power box.' : 'Showing the flat entrance.';
  window.setTimeout(() => {
    turning = false;
    Discovery.record(kind);
    render();
    (kind === 'power' && !viewPowerCloseButton.hidden ? viewPowerCloseButton : returnButton).focus();
  }, turnDuration());
}

async function showDetailView(nextKind) {
  const detailPair = { power: 'powerClose', powerClose: 'power', flat: 'filmRequest', filmRequest: 'flat' };
  if (Discovery.isOpen() || !Discovery.canInspect(nextKind) || detailPair[artifact] !== nextKind || turning) return;
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
  Discovery.record(nextKind);
  render();
  (nextKind === 'power' ? viewPowerCloseButton : nextKind === 'flat' ? filmRequestHotspot : returnButton).focus();
  announcement.textContent = nextKind === 'power' ? 'Back at the power box.' : nextKind === 'flat' ? 'Back at the flat entrance.' : nextKind === 'filmRequest' ? 'Showing the paper on the door.' : 'Showing the meter number close-up.';
}

function returnFromArtifact() {
  if (Discovery.isOpen() || !artifact || turning) return;
  if (artifact === 'powerClose') { void showDetailView('power'); return; }
  if (artifact === 'filmRequest') { void showDetailView('flat'); return; }
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
    (previousArtifact === 'map' ? document.getElementById('view-floor-plan') : previousArtifact === 'flyer' ? document.getElementById('view-listing-flyer') : previousArtifact === 'power' ? document.getElementById('view-power-box') : document.getElementById('see-flat')).focus();
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
flatDoorHotspot.addEventListener('click', showDoorPrompt);
destinationClose.addEventListener('click', () => dismissDoorPrompt(true));
for (const item of sceneHotspots.filter(item => item.title)) item.button.addEventListener('click', () => showObjectNote(item));
objectNoteClose.addEventListener('click', () => dismissObjectNote(true));
document.getElementById('view-listing-flyer').addEventListener('click', () => { void openArtifact('flyer'); });
document.getElementById('view-power-box').addEventListener('click', () => { void openArtifact('power'); });
viewPowerCloseButton.addEventListener('click', () => { void showDetailView('powerClose'); });
filmRequestHotspot.addEventListener('click', () => { void showDetailView('filmRequest'); });
returnButton.addEventListener('click', returnFromArtifact);
replayButton.addEventListener('click', replayLift);
zoomInButton.addEventListener('click', () => { dismissObjectNote(); zoom = Math.round(clamp(zoom + .2, 1, maxZoom()) * 10) / 10; renderCamera(); });
zoomOutButton.addEventListener('click', () => { dismissObjectNote(); zoom = Math.round(clamp(zoom - .2, 1, maxZoom()) * 10) / 10; renderCamera(); });
document.getElementById('reset-view').addEventListener('click', () => { dismissObjectNote(); zoom = 1; lookX = 0; lookY = 0; renderCamera(); });
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
  dismissObjectNote();
  if (doorPromptOpen) dismissDoorPrompt();
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
window.addEventListener('resize', () => { layoutSceneHotspots(); layoutFilmRequestHotspot(); positionObjectNote(); });

document.addEventListener('keydown', (event) => {
  if (Discovery.isOpen()) return;
  if (event.key === 'Escape' && !infoPanel.hidden) { infoPanel.hidden = true; return; }
  if (event.key === 'Escape' && !objectNote.hidden) { dismissObjectNote(true); return; }
  if (introActive) {
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); if (liftPosition === 0) void moveLift(1); else void finishIntro(); }
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); void moveLift(0); }
    return;
  }
  if (event.key === 'Escape' && artifact) { returnFromArtifact(); return; }
  if (event.key === 'Escape' && doorPromptOpen) { dismissDoorPrompt(true); return; }
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { event.preventDefault(); void transitionTo(position + 1); }
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { event.preventDefault(); if (artifact) returnFromArtifact(); else void transitionTo(position - 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); dismissObjectNote(); lookX -= 4; renderCamera(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); dismissObjectNote(); lookX += 4; renderCamera(); }
});

function saveProgress() {
  if (transitioning || turning) return;
  Discovery.save({ position, introActive, liftPosition, artifact, fromIntro, zoom, lookX, lookY, savedView, doorPromptOpen });
}

function restartDay() {
  position = 0;
  activeFrame = frameA; inactiveFrame = frameB;
  frameA.src = stops[0].image; frameA.dataset.stop = '0'; frameA.alt = stops[0].label;
  frameA.classList.add('is-active'); frameA.removeAttribute('aria-hidden');
  frameB.classList.remove('is-active'); frameB.setAttribute('aria-hidden', 'true');
  introActive = true; liftPosition = 0; liftReady = false;
  activeLiftFrame = liftFrameA; inactiveLiftFrame = liftFrameB;
  liftFrameA.classList.add('is-active'); liftFrameA.removeAttribute('aria-hidden');
  liftFrameB.classList.remove('is-active'); liftFrameB.setAttribute('aria-hidden', 'true');
  liftVideo.pause(); liftVideo.currentTime = 0;
  fromIntro = false; artifact = null; transitioning = false; turning = false;
  zoom = 1; lookX = 0; lookY = 0; savedView = null; pointer = null; notedObject = null; doorPromptOpen = false;
  objectNote.hidden = true; infoPanel.hidden = true;
  scene.classList.remove('dragging');
  artifactPhoto.src = artifacts.map.image; artifactBackdrop.src = artifacts.map.image;
  artifactPhoto.alt = artifacts.map.alt; artifactPhoto.dataset.kind = 'map'; artifactTitle.textContent = artifacts.map.title;
  explorer.classList.remove('has-left-intro', 'is-at-artifact', 'is-power-artifact');
  explorer.classList.add('is-intro');
  introStage.setAttribute('aria-hidden', 'false');
  corridorStage.setAttribute('aria-hidden', 'true'); artifactStage.setAttribute('aria-hidden', 'true');
  render();
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 650;
  explorer.animate([{ opacity: 0 }, { opacity: 1 }], { duration });
  playLiftOpening();
  document.getElementById('notebook-button').focus();
  announcement.textContent = `Day ${Discovery.day()}. You return to the block. The lift doors are opening.`;
}

async function startExplorer() {
  const saved = Discovery.init({ artifacts, refresh: render, restartDay });
  if (saved && Number.isInteger(saved.position) && saved.position >= 0 && saved.position < stops.length && saved.introActive === false) {
    position = saved.position;
    activeFrame.src = stops[position].image;
    activeFrame.dataset.stop = String(position);
    activeFrame.alt = `Corridor stop ${position + 1}: ${stops[position].label}`;
    introActive = false;
    liftVideo.pause();
    liftPosition = 1;
    activeLiftFrame = liftFrameB;
    inactiveLiftFrame = liftFrameA;
    liftFrameA.classList.remove('is-active');
    liftFrameA.setAttribute('aria-hidden', 'true');
    liftFrameB.classList.add('is-active');
    liftFrameB.removeAttribute('aria-hidden');
    explorer.classList.remove('is-intro');
    explorer.classList.add('has-left-intro');
    introStage.setAttribute('aria-hidden', 'true');
    artifact = Object.hasOwn(artifacts, saved.artifact) && Discovery.available(saved.artifact) ? saved.artifact : null;
    fromIntro = artifact === 'map' && saved.fromIntro === true;
    doorPromptOpen = saved.doorPromptOpen === true;
    const validView = view => view && [view.zoom, view.lookX, view.lookY].every(Number.isFinite);
    if (validView(saved)) { zoom = clamp(saved.zoom, 1, maxZoom()); lookX = clamp(saved.lookX, -100, 100); lookY = clamp(saved.lookY, -100, 100); }
    savedView = validView(saved.savedView) ? saved.savedView : null;
    if (artifact) {
      const target = artifacts[artifact];
      artifactPhoto.src = target.image;
      artifactBackdrop.src = target.image;
      artifactPhoto.alt = target.alt;
      artifactPhoto.dataset.kind = artifact;
      artifactTitle.textContent = target.title;
      try { await artifactPhoto.decode(); } catch { artifact = null; }
    }
    explorer.classList.toggle('is-at-artifact', Boolean(artifact));
    corridorStage.setAttribute('aria-hidden', String(Boolean(artifact)));
    artifactStage.setAttribute('aria-hidden', String(!artifact));
    render();
  } else {
    render();
    playLiftOpening();
  }
}
window.addEventListener('pagehide', saveProgress);
void startExplorer();
