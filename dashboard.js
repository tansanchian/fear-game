(() => {
  const labels = {
    power: 'Power box', powerClose: 'Meter number', flyer: 'Nearby listing', filmRequest: 'Filming request',
    murderArticle: 'Torn newspaper fragment', neighbourConversation: 'A new neighbour', doorChant: 'Sounds behind the door',
    memoryArticle1: 'Old newspaper clipping', memoryArticle2: 'Trial report', memoryArticle2Close: 'Trial report close-up',
  };
  const activityLabels = {
    game_started: 'Started the game', page_viewed: 'Opened', item_inspected: 'Inspected an item',
    notebook_item_added: 'Added an item to the notebook', notebook_opened: 'Opened the notebook',
    corridor_moved: 'Moved along the corridor', day_started: 'Started the next day',
    imagined_corridor_moved: 'Moved through the imagined corridor', imagined_notebook_item_added: 'Recorded an imagined artifact',
    game_completed: 'Completed the story',
  };
  const tokenKey = 'concrete-memories.supabase-dashboard-token.v1';
  const config = ParticipantData.configuration();
  const list = document.getElementById('response-list');
  const empty = document.getElementById('empty-state');
  const filter = document.getElementById('response-filter');
  const status = document.getElementById('dashboard-status');
  const template = document.getElementById('response-template');
  const login = document.getElementById('dashboard-login');
  const content = document.getElementById('dashboard-content');
  const logout = document.getElementById('dashboard-logout');
  let responses = [];

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
  const getToken = () => { try { return sessionStorage.getItem(tokenKey) || ''; } catch { return ''; } };
  const setToken = token => { try { token ? sessionStorage.setItem(tokenKey, token) : sessionStorage.removeItem(tokenKey); } catch {} };

  function render() {
    const completed = responses.filter(response => response.status === 'complete');
    const buys = completed.filter(response => response.ending?.choice === 'buy').length;
    const passes = completed.filter(response => response.ending?.choice === 'pass').length;
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
      for (const id of notes.length ? notes : ['None']) { const item = document.createElement('li'); item.textContent = labels[id] || id; tags.append(item); }
      card.querySelector('.response-comment').textContent = response.ending?.comment?.trim() || 'No comment submitted.';
      const activity = card.querySelector('.activity-list');
      for (const entry of response.activity || []) { const item = document.createElement('li'); item.textContent = `${date(entry.at)} — ${detailText(entry)}`; activity.append(item); }
      list.append(card);
    }
  }

  async function loadResponses(token = getToken()) {
    if (!config.ready) {
      status.textContent = 'Supabase is not configured yet. Add the project URL and publishable key in supabase-config.js.';
      login.hidden = true; content.hidden = true; return;
    }
    if (!token) { login.hidden = false; content.hidden = true; logout.hidden = true; return; }
    status.textContent = 'Loading responses…';
    const result = await fetch(`${config.url}/rest/v1/game_responses?select=response&order=completed_at.desc`, {
      headers: { apikey: config.publishableKey, Authorization: `Bearer ${token}` },
    });
    if (result.status === 401 || result.status === 403) {
      setToken(''); login.hidden = false; content.hidden = true; logout.hidden = true;
      status.textContent = 'Your dashboard session expired. Please sign in again.'; return;
    }
    if (!result.ok) throw new Error(`Could not load responses (${result.status}).`);
    responses = (await result.json()).map(row => row.response).filter(Boolean);
    login.hidden = true; content.hidden = false; logout.hidden = false;
    status.textContent = `${responses.length} shared ${responses.length === 1 ? 'response' : 'responses'} loaded from Supabase.`;
    render();
  }

  document.getElementById('login-form').addEventListener('submit', async event => {
    event.preventDefault(); status.textContent = 'Signing in…';
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      const result = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
        method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.get('email'), password: fields.get('password') }),
      });
      const data = await result.json();
      if (!result.ok || !data.access_token) throw new Error(data.error_description || data.msg || 'Sign-in failed.');
      setToken(data.access_token); form.reset(); await loadResponses(data.access_token);
    } catch (error) { status.textContent = error.message; }
  });
  logout.addEventListener('click', () => { setToken(''); responses = []; login.hidden = false; content.hidden = true; logout.hidden = true; status.textContent = 'Signed out.'; });
  filter.addEventListener('change', render);
  loadResponses().catch(error => { status.textContent = error.message; login.hidden = false; content.hidden = true; });
})();
