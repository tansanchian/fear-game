(() => {
  const labels = {
    power: 'Power box', powerClose: 'Meter number', flyer: 'Nearby listing', filmRequest: 'Filming request',
    murderArticle: 'Newspaper article', neighbourConversation: 'A new neighbour', doorChant: 'Sounds behind the door',
    memoryArticle1: 'Old newspaper clipping', memoryArticle2: 'Trial report', memoryArticle2Close: 'Trial report close-up',
  };
  const activityLabels = {
    game_started: 'Started the game', page_viewed: 'Opened', item_inspected: 'Inspected an item',
    notebook_item_added: 'Added an item to the notebook', notebook_opened: 'Opened the notebook',
    corridor_moved: 'Moved along the corridor', day_started: 'Started the next day',
    imagined_corridor_moved: 'Moved through the imagined corridor', imagined_notebook_item_added: 'Recorded an imagined artifact',
    game_completed: 'Completed the story',
  };
  const list = document.getElementById('response-list');
  const empty = document.getElementById('empty-state');
  const filter = document.getElementById('response-filter');
  const status = document.getElementById('dashboard-status');
  const template = document.getElementById('response-template');

  const date = value => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not completed';
  const choiceText = choice => choice === 'buy' ? 'Would buy the flat' : choice === 'pass' ? 'Would not buy the flat' : 'No final choice yet';
  const detailText = entry => {
    const detail = entry.detail || {};
    if (entry.type === 'page_viewed') return `${activityLabels[entry.type]} ${detail.page}`;
    if (entry.type.includes('notebook_item')) return `${activityLabels[entry.type]}: ${labels[detail.id] || detail.id}`;
    if (entry.type === 'item_inspected') return `${activityLabels[entry.type]}: ${detail.id}`;
    if (entry.type === 'game_completed') return `${activityLabels[entry.type]}: ${choiceText(detail.choice)}`;
    return activityLabels[entry.type] || entry.type.replaceAll('_', ' ');
  };

  function render() {
    const database = ParticipantData.readDatabase();
    const responses = database.responses.slice().sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
    const completed = responses.filter(response => response.status === 'complete');
    const buys = completed.filter(response => response.ending?.choice === 'buy').length;
    const passes = completed.filter(response => response.ending?.choice === 'pass').length;
    const notebookTotal = responses.reduce((sum, response) => sum + new Set([...(response.notebook || []), ...(response.imaginedNotebook || [])]).size, 0);
    document.getElementById('metric-total').textContent = responses.length;
    document.getElementById('metric-complete').textContent = completed.length;
    document.getElementById('metric-buy').textContent = buys;
    document.getElementById('metric-pass').textContent = passes;
    document.getElementById('metric-notebook').textContent = responses.length ? (notebookTotal / responses.length).toFixed(1) : '0';
    const decided = buys + passes;
    document.getElementById('buy-bar').style.width = `${decided ? buys / decided * 100 : 0}%`;
    document.getElementById('pass-bar').style.width = `${decided ? passes / decided * 100 : 0}%`;
    document.getElementById('decision-caption').textContent = decided ? `${Math.round(buys / decided * 100)}% would buy · ${Math.round(passes / decided * 100)}% would not` : 'Waiting for completed responses';

    const visible = responses.filter(response => filter.value === 'all' || response.status === filter.value);
    list.replaceChildren(); empty.hidden = visible.length > 0;
    for (const response of visible) {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector('.response-name').textContent = response.participantName;
      card.querySelector('.response-meta').textContent = `Started ${date(response.startedAt)}${response.completedAt ? ` · Finished ${date(response.completedAt)}` : ''}`;
      const badge = card.querySelector('.response-status'); badge.textContent = response.status === 'complete' ? 'Complete' : 'In progress'; badge.classList.toggle('complete', response.status === 'complete');
      card.querySelector('.response-choice').textContent = choiceText(response.ending?.choice);
      const notes = [...new Set([...(response.notebook || []), ...(response.imaginedNotebook || [])])];
      card.querySelector('.response-notebook-count').textContent = `${notes.length} ${notes.length === 1 ? 'artifact' : 'artifacts'} recorded`;
      const tags = card.querySelector('.response-notebook');
      for (const id of notes) { const item = document.createElement('li'); item.textContent = labels[id] || id; tags.append(item); }
      if (!notes.length) { const item = document.createElement('li'); item.textContent = 'None'; tags.append(item); }
      const comment = response.ending?.comment?.trim();
      card.querySelector('.response-comment').textContent = comment || 'No comment submitted.';
      const activity = card.querySelector('.activity-list');
      for (const entry of response.activity || []) { const item = document.createElement('li'); item.textContent = `${date(entry.at)} — ${detailText(entry)}`; activity.append(item); }
      list.append(card);
    }
  }

  filter.addEventListener('change', render);
  document.getElementById('export-json').addEventListener('click', () => {
    const database = ParticipantData.readDatabase();
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `concrete-memories-responses-${new Date().toISOString().slice(0, 10)}.json`;
    link.click(); URL.revokeObjectURL(link.href);
    status.textContent = `Exported ${database.responses.length} responses.`;
  });
  document.getElementById('import-json').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const database = ParticipantData.importDatabase(JSON.parse(await file.text()));
      status.textContent = `Imported successfully. ${database.responses.length} responses are now consolidated.`;
      render();
    } catch (error) { status.textContent = error.message; }
    event.target.value = '';
  });
  render();
})();
