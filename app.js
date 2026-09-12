const STORAGE_KEY = 'the-deck-progress-v1';

// Spaced-repetition ladder, in days. No entry yet = brand new, due immediately.
const INTERVAL_DAYS = [1, 3, 7, 16, 35, 75, 150];
const DAY_MS = 24 * 60 * 60 * 1000;

let topics = [];               // loaded topic objects
let state = {
  learned: {},                // globalId -> true  (manual "I know this" checkbox, drives progress %)
  flagged: {},                 // globalId -> true
  mode: 'study',
  studyTopic: null,
  studyModule: null,
  studyIndexByModuleKey: {},   // `${topicId}:${moduleId}` -> index
  review: {},                  // globalId -> { intervalIdx: number, dueAt: epoch ms }
  lastFeedGid: null
};

function globalId(topicId, moduleId, lessonId){ return `${topicId}:${moduleId}:${lessonId}`; }

// Advance or reset a lesson's spot in the spaced-repetition ladder.
// Called whenever "Mark learned" is toggled, in either Study or Feed mode.
function advanceReview(gid){
  const cur = state.review[gid];
  const nextIdx = cur ? Math.min(cur.intervalIdx + 1, INTERVAL_DAYS.length - 1) : 0;
  state.review[gid] = { intervalIdx: nextIdx, dueAt: Date.now() + INTERVAL_DAYS[nextIdx] * DAY_MS };
}
function resetReview(gid){
  state.review[gid] = { intervalIdx: -1, dueAt: 0 }; // due again immediately
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
    }
  }catch(e){ /* first run */ }
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ console.error('save failed', e); }
}

async function loadTopics(){
  const res = await fetch('content/index.json');
  const registry = await res.json();
  const loaded = [];
  for(const t of registry.topics){
    try{
      const r = await fetch('content/' + t.file);
      const data = await r.json();
      loaded.push(data);
    }catch(e){ console.error('failed to load topic', t, e); }
  }
  topics = loaded;
}

function allLessonRefs(){
  const refs = [];
  topics.forEach(topic => {
    topic.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        refs.push({ topic, mod, lesson, gid: globalId(topic.id, mod.id, lesson.id) });
      });
    });
  });
  return refs;
}

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Picks the next feed card by spaced-repetition due date.
// Never-reviewed cards count as due immediately and are preferred over
// reviewed-but-due cards, so genuinely new content surfaces first. If
// nothing is due yet, falls back to the soonest-due card rather than
// stopping — the feed should never simply run out.
function pickFeedCard(){
  const refs = allLessonRefs();
  const now = Date.now();
  let pool = refs.filter(r => r.gid !== state.lastFeedGid || refs.length === 1);

  const due = pool.filter(r => !state.review[r.gid] || state.review[r.gid].dueAt <= now);

  if(due.length > 0){
    const unseen = due.filter(r => !state.review[r.gid]);
    const chosen = unseen.length ? unseen : due;
    const ref = chosen[Math.floor(Math.random() * chosen.length)];
    return { ref, status: unseen.length ? 'new' : 'due' };
  }

  // Nothing due — surface the soonest-due card early rather than dead-ending.
  const bySoonest = pool.slice().sort((a, b) =>
    (state.review[a.gid] ? state.review[a.gid].dueAt : 0) - (state.review[b.gid] ? state.review[b.gid].dueAt : 0)
  );
  return { ref: bySoonest[0], status: 'early' };
}

function formatDueIn(gid){
  const rv = state.review[gid];
  if(!rv) return '';
  const days = Math.round((rv.dueAt - Date.now()) / DAY_MS);
  if(days <= 0) return '';
  return days === 1 ? '1 day' : days + ' days';
}

function findRefByGid(gid){
  return allLessonRefs().find(r => r.gid === gid);
}

// ---------- overall progress ----------
function renderOverall(){
  const refs = allLessonRefs();
  const total = refs.length;
  const learnedN = refs.filter(r => state.learned[r.gid]).length;
  const pct = total ? Math.round((learnedN/total)*100) : 0;
  document.getElementById('pctLabel').textContent = pct + '%';
  document.getElementById('learnedCount').textContent = learnedN + ' / ' + total + ' learned';
  document.getElementById('overallBar').style.setProperty('--pct', pct + '%');
}

// ---------- mode switching ----------
function setMode(mode){
  state.mode = mode;
  document.getElementById('modeStudyBtn').classList.toggle('active', mode === 'study');
  document.getElementById('modeFeedBtn').classList.toggle('active', mode === 'feed');
  document.getElementById('studyView').classList.toggle('hide', mode !== 'study');
  document.getElementById('feedView').classList.toggle('hide', mode !== 'feed');
  saveState();
  if(mode === 'study') renderStudy();
  else renderFeed();
}

// ---------- STUDY MODE ----------
function renderStudyTabs(){
  const topicHost = document.getElementById('topicTabs');
  topicHost.innerHTML = '';
  topics.forEach(topic => {
    const btn = document.createElement('button');
    btn.className = 'topic-tab' + (topic.id === state.studyTopic ? ' active' : '');
    btn.style.setProperty('--topic-color', topic.color);
    btn.textContent = topic.title;
    btn.onclick = () => {
      state.studyTopic = topic.id;
      state.studyModule = topic.modules[0].id;
      saveState();
      renderStudy();
    };
    topicHost.appendChild(btn);
  });

  const topic = topics.find(t => t.id === state.studyTopic);
  const moduleHost = document.getElementById('moduleTabs');
  moduleHost.innerHTML = '';
  if(!topic) return;
  topic.modules.forEach(mod => {
    const key = `${topic.id}:${mod.id}`;
    const learnedN = mod.lessons.filter(l => state.learned[globalId(topic.id, mod.id, l.id)]).length;
    const btn = document.createElement('button');
    btn.className = 'module-tab' + (mod.id === state.studyModule ? ' active' : '');
    btn.innerHTML = mod.label + ` <span class="count">${learnedN}/${mod.lessons.length}</span>`;
    btn.onclick = () => { state.studyModule = mod.id; saveState(); renderStudy(); };
    moduleHost.appendChild(btn);
  });
}

// A module's study positions run from -1 (summary bookend, if present)
// through its real lesson indices to lessons.length (takeaway bookend,
// if present) — see renderStudyCard/renderBookendCard.
function studyBounds(mod){
  return {
    min: mod.summary ? -1 : 0,
    max: mod.lessons.length - 1 + (mod.takeaway ? 1 : 0)
  };
}

function renderStudyCard(){
  const topic = topics.find(t => t.id === state.studyTopic);
  const host = document.getElementById('studyCardHost');
  if(!topic){ host.innerHTML = ''; return; }
  const mod = topic.modules.find(m => m.id === state.studyModule) || topic.modules[0];
  const key = `${topic.id}:${mod.id}`;
  const { min, max } = studyBounds(mod);
  let idx = state.studyIndexByModuleKey[key];
  if(idx === undefined) idx = min;
  if(idx > max) idx = max;
  if(idx < min) idx = min;
  state.studyIndexByModuleKey[key] = idx;

  if(idx === -1){
    renderBookendCard(host, topic, mod, 'summary');
    document.getElementById('posLabel').textContent = 'Overview';
  } else if(idx === mod.lessons.length){
    renderBookendCard(host, topic, mod, 'takeaway');
    document.getElementById('posLabel').textContent = 'Key takeaway';
  } else {
    const lesson = mod.lessons[idx];
    if(!lesson){ host.innerHTML = ''; return; }
    const gid = globalId(topic.id, mod.id, lesson.id);
    renderCardInto(host, topic, mod, lesson, gid, { showDetailOpenByDefault: true });
    document.getElementById('posLabel').textContent = (idx+1) + ' of ' + mod.lessons.length;
  }

  document.getElementById('prevBtn').disabled = idx === min;
  document.getElementById('nextBtn').disabled = idx === max;
}

function renderStudy(){
  if(!state.studyTopic && topics.length){
    state.studyTopic = topics[0].id;
    state.studyModule = topics[0].modules[0].id;
  }
  renderStudyTabs();
  renderStudyCard();
}

document.getElementById('prevBtn').onclick = () => {
  const topic = topics.find(t => t.id === state.studyTopic);
  const mod = topic.modules.find(m => m.id === state.studyModule);
  const key = `${topic.id}:${mod.id}`;
  const { min } = studyBounds(mod);
  const cur = state.studyIndexByModuleKey[key];
  state.studyIndexByModuleKey[key] = Math.max(min, (cur === undefined ? min : cur) - 1);
  saveState(); renderStudyCard(); renderOverall();
};
document.getElementById('nextBtn').onclick = () => {
  const topic = topics.find(t => t.id === state.studyTopic);
  const mod = topic.modules.find(m => m.id === state.studyModule);
  const key = `${topic.id}:${mod.id}`;
  const { min, max } = studyBounds(mod);
  const cur = state.studyIndexByModuleKey[key];
  state.studyIndexByModuleKey[key] = Math.min(max, (cur === undefined ? min : cur) + 1);
  saveState(); renderStudyCard(); renderOverall();
};

// ---------- FEED MODE ----------
function renderFeed(){
  const { ref, status } = pickFeedCard();
  const host = document.getElementById('feedCardHost');
  if(!ref){ host.innerHTML = ''; return; }
  state.lastFeedGid = ref.gid;
  saveState();
  renderCardInto(host, ref.topic, ref.mod, ref.lesson, ref.gid, { showDetailOpenByDefault: false, feedStatus: status });
}

document.getElementById('feedNextBtn').onclick = () => {
  renderFeed();
};

// ---------- module summary/takeaway bookend cards ----------
function renderBookendCard(host, topic, mod, kind){
  const isTakeaway = kind === 'takeaway';
  const text = isTakeaway ? mod.takeaway : mod.summary;
  const badgeText = isTakeaway ? 'KEY TAKEAWAY' : 'OVERVIEW';
  const badgeClass = isTakeaway ? 'badge badge--takeaway' : 'badge badge--overview';

  host.innerHTML = `
    <div class="card bookend" style="--topic-color:${topic.color};">
      <div class="card-meta">
        <span>${topic.title.toUpperCase()} · ${mod.label.toUpperCase()}</span>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <p class="bookend-text">${text}</p>
    </div>
  `;
}

// ---------- lesson media (video/gif) ----------
function renderMedia(media){
  if(!media) return '';
  const caption = media.caption ? media.caption.replace(/"/g, '&quot;') : '';
  if(media.type === 'youtube'){
    return `
      <div class="media-embed">
        <iframe src="https://www.youtube-nocookie.com/embed/${media.id}"
          title="${caption || 'Video'}" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      ${media.caption ? `<p class="media-caption">${media.caption}</p>` : ''}
    `;
  }
  if(media.type === 'image'){
    return `
      <div class="media-embed">
        <img src="${media.url}" alt="${caption}" loading="lazy">
      </div>
      ${media.caption ? `<p class="media-caption">${media.caption}</p>` : ''}
    `;
  }
  return '';
}

// ---------- shared card renderer ----------
function renderCardInto(host, topic, mod, lesson, gid, opts){
  const isLearned = !!state.learned[gid];
  const isFlagged = !!state.flagged[gid];
  const detailId = 'detail-' + gid.replace(/[^a-zA-Z0-9]/g, '-');

  const badge = (opts && opts.feedStatus) ? { new: 'NEW', due: 'REVIEW', early: 'EARLY REVIEW' }[opts.feedStatus] : '';
  const badgeClass = (opts && opts.feedStatus) ? 'badge badge--' + opts.feedStatus : '';

  host.innerHTML = `
    <div class="card" style="--topic-color:${topic.color};">
      <div class="card-meta">
        <span>${topic.title.toUpperCase()} · ${mod.label.toUpperCase()}</span>
        ${badge ? `<span class="${badgeClass}">${badge}</span>` : ''}
      </div>
      <h2>${lesson.title}</h2>
      <p class="why">${lesson.why}</p>
      <ul class="facts">
        ${lesson.facts.map(f => `<li>${f}</li>`).join('')}
      </ul>
      ${renderMedia(lesson.media)}
      ${lesson.detail ? `
        <button class="detail-toggle" id="${detailId}-btn">Read more ▾</button>
        <div class="detail-body" id="${detailId}">${lesson.detail}</div>
      ` : ''}
      ${lesson.mustRemember ? `<div class="flag-banner">${lesson.mustRemember}</div>` : ''}
      <div class="card-actions">
        <button class="btn learned ${isLearned ? 'on' : ''}" id="learnedBtn">${isLearned ? '✓ Learned' : 'Mark learned'}</button>
        <button class="btn flag ${isFlagged ? 'on' : ''}" id="flagBtn">${isFlagged ? '★ Flagged' : 'Flag to remember'}</button>
      </div>
    </div>
  `;

  document.getElementById('learnedBtn').onclick = () => {
    state.learned[gid] = !state.learned[gid];
    if(state.learned[gid]) advanceReview(gid); else resetReview(gid);
    saveState();
    renderOverall();
    if(state.mode === 'study') renderStudyTabs();
    document.getElementById('learnedBtn').classList.toggle('on', state.learned[gid]);
    const dueIn = formatDueIn(gid);
    document.getElementById('learnedBtn').textContent = state.learned[gid]
      ? (dueIn ? `✓ Learned — back in ${dueIn}` : '✓ Learned')
      : 'Mark learned';
  };
  document.getElementById('flagBtn').onclick = () => {
    state.flagged[gid] = !state.flagged[gid];
    saveState();
    document.getElementById('flagBtn').classList.toggle('on', state.flagged[gid]);
    document.getElementById('flagBtn').textContent = state.flagged[gid] ? '★ Flagged' : 'Flag to remember';
  };
  if(lesson.detail){
    const detailBody = document.getElementById(detailId);
    const detailBtn = document.getElementById(detailId + '-btn');
    if(opts && opts.showDetailOpenByDefault){ detailBody.classList.add('open'); detailBtn.textContent = 'Read less ▴'; }
    detailBtn.onclick = () => {
      const open = detailBody.classList.toggle('open');
      detailBtn.textContent = open ? 'Read less ▴' : 'Read more ▾';
    };
  }
}

// ---------- flagged list ----------
function renderFlaggedList(){
  const host = document.getElementById('flaggedHost');
  const refs = allLessonRefs().filter(r => state.flagged[r.gid]);
  if(refs.length === 0){
    host.innerHTML = '<p class="empty-note">Nothing flagged yet. Tap "Flag to remember" on any card that feels important to hold onto.</p>';
    return;
  }
  host.innerHTML = refs.map(r => `
    <div class="flagged-item" data-gid="${r.gid}">
      <span class="cat">${r.topic.title.toUpperCase()} · ${r.mod.label.toUpperCase()}</span>
      <strong>${r.lesson.title}</strong>
      ${r.lesson.mustRemember ? `<div style="margin-top:6px;">${r.lesson.mustRemember}</div>` : ''}
    </div>
  `).join('');
  host.querySelectorAll('.flagged-item').forEach(el => {
    el.onclick = () => {
      const gid = el.getAttribute('data-gid');
      const ref = findRefByGid(gid);
      state.studyTopic = ref.topic.id;
      state.studyModule = ref.mod.id;
      state.studyIndexByModuleKey[`${ref.topic.id}:${ref.mod.id}`] = ref.mod.lessons.findIndex(l => l.id === ref.lesson.id);
      showDeck();
      setMode('study');
    };
  });
}

function showDeck(){
  document.getElementById('flaggedView').classList.remove('show');
}
function showFlagged(){
  document.getElementById('flaggedView').classList.add('show');
  renderFlaggedList();
}

document.getElementById('toggleFlagged').onclick = showFlagged;
document.getElementById('backToDeck').onclick = showDeck;
document.getElementById('modeStudyBtn').onclick = () => setMode('study');
document.getElementById('modeFeedBtn').onclick = () => setMode('feed');

// ---------- boot ----------
(async function init(){
  loadState();
  await loadTopics();
  if(topics.length === 0){
    document.getElementById('emptyState').classList.remove('hide');
    return;
  }
  renderOverall();
  setMode(state.mode || 'study');
})();
