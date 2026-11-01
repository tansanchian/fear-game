// Read-only evidence viewer. Collection and game progression belong to the caller.
function createNotebookView({ dialog, evidence, artifacts, getCollected, onClose = () => {} }) {
  const element = id => dialog.querySelector(`#${id}`);
  const list = element('notebook-list');
  const detail = element('notebook-detail');
  const collected = () => [...new Set(getCollected())].filter(id => evidence[id] && artifacts[id]);
  let selected = null;
  let returnFocus;
  function renderNotebook() {
    const groups = [...new Set(collected().map(id => `${evidence[id].day}:${evidence[id].group}`))];
    element('notebook-title').textContent = 'Your notebook';
    element('notebook-summary').textContent = `${groups.length} ${groups.length === 1 ? 'artifact' : 'artifacts'} recorded`;
    list.replaceChildren();
    element('notebook-empty').hidden = groups.length > 0;
    for (const group of groups) {
      const ids = collected().filter(id => `${evidence[id].day}:${evidence[id].group}` === group);
      const first = ids[0];
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'notebook-entry'; card.dataset.entry = group;
      const thumb = document.createElement('img'); thumb.src = artifacts[first].image; thumb.alt = ''; thumb.loading = 'lazy';
      const copy = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = evidence[evidence[first].group]?.title ?? evidence[first].title;
      const location = document.createElement('small'); location.textContent = `Day ${evidence[first].day} · ${evidence[first].location}`;
      const count = document.createElement('small'); count.textContent = artifacts[first].type === 'conversation' ? 'Conversation · Read dialogue' : artifacts[first].type === 'observation' ? 'Observation · Read note' : `${ids.length} ${ids.length === 1 ? 'image' : 'images'}`;
      copy.append(title, location, count); card.append(thumb, copy);
      card.addEventListener('click', () => showEntry(first)); list.append(card);
    }
  }
  function showEntry(id) {
    if (!collected().includes(id)) return;
    selected = id;
    list.hidden = true;
    element('notebook-empty').hidden = true;
    detail.hidden = false;
    const entry = artifacts[id];
    const isConversation = entry.type === 'conversation';
    const transcript = element('notebook-transcript');
    transcript.replaceChildren(); transcript.hidden = !isConversation;
    dialog.querySelector('.notebook-image-scroll').hidden = isConversation;
    element('notebook-zoom').hidden = isConversation;
    if (isConversation) {
      for (const line of entry.transcript) {
        const paragraph = document.createElement('p');
        const speaker = document.createElement('strong'); speaker.textContent = `${line.speaker}: `;
        paragraph.append(speaker, document.createTextNode(line.text)); transcript.append(paragraph);
      }
    }
    const photo = element('notebook-photo');
    photo.src = artifacts[id].image; photo.alt = artifacts[id].alt;
    element('notebook-caption').textContent = `Day ${evidence[id].day} · ${evidence[id].description}`;
    photo.classList.remove('is-enlarged');
    element('notebook-zoom').textContent = 'Enlarge image';
    const variants = element('notebook-variants'); variants.replaceChildren();
    variants.hidden = isConversation;
    for (const variant of collected().filter(key => evidence[key].day === evidence[id].day && evidence[key].group === evidence[id].group)) {
      const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = evidence[variant].title;
      tab.setAttribute('aria-pressed', String(variant === id)); tab.addEventListener('click', () => showEntry(variant)); variants.append(tab);
    }
    element('notebook-to-list').focus();
  }
  function showList() {
    selected = null; detail.hidden = true; list.hidden = false; renderNotebook();
    element('notebook-close').focus();
  }
  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    selected = null; detail.hidden = true; list.hidden = false;
    renderNotebook(); dialog.showModal(); element('notebook-close').focus();
  }
  function backOrClose() { if (selected) showList(); else dialog.close(); }
  dialog.addEventListener('cancel', event => { event.preventDefault(); backOrClose(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); backOrClose(); }
  });
  dialog.addEventListener('close', () => {
    if (returnFocus?.isConnected && !returnFocus.hidden) returnFocus.focus({ preventScroll: true });
    onClose();
  });
  element('notebook-close').addEventListener('click', () => dialog.close());
  element('notebook-to-list').addEventListener('click', showList);
  element('notebook-zoom').addEventListener('click', event => {
    const enlarged = element('notebook-photo').classList.toggle('is-enlarged');
    event.currentTarget.textContent = enlarged ? 'Fit image' : 'Enlarge image';
  });
  return { open };
}
