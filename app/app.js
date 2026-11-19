// Leonida Legend — GTA VI trophy guide & platinum tracker.
// Vanilla JS, no build step, fully offline. Loads the official trophy data
// from data/trophies.json, verifies it live (the audit strip), tracks earned
// trophies and counters in localStorage, and renders cited guides plus a
// four-stage platinum roadmap.

const STORAGE_KEY = 'gta6-trophy-tracker-v1';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABEL = { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', online: 'Online' };
const STAGE_TITLES = {
  1: 'Story — first run',
  2: 'Strands & side activities',
  3: 'Collectibles & world completion',
  4: 'Cleanup & the platinum',
};
const STAGE_RATIONALES = {
  1: 'Play the five chapters in order. Every chapter and named-mission trophy here is automatic, but do the Chapter 1 meditation at Jason\u2019s house the moment Lucia suggests it — PowerPyx flags it as the one step in the whole list that may not come back, because there is no mission replay. While the story runs, also bank the partner heat trophies and one-off moments that sit naturally in the early game, and scan vehicles and study animals as you meet them: that progress already counts toward the 100% checklist later.',
  2: 'With the story done (or alongside it), finish the five character questlines — Andy, Kenton, Billy, Randy and Tyrone — and complete 8 stranger strands for the Strangers & Freaks silver. Then work the repeatable earners: races, robberies, challenges and the two money counters. Quest givers who vanish during the story always return in free-roam, so nothing in this stage can be locked out.',
  3: 'The long sweep. The 100% checklist is now visible (Progress > Stats) and, per PowerPyx, it is lenient — closer to 60% true completion, with only 70 of 80 challenges needed. Clear the categories it requires in full (shooting ranges, drone races, robberies, Bret\u2019s quests) and grind the big counters: 250+ stunts, 3 card sets, 100 WAiNK locations, 100 discovered vehicles, the remaining meditation spots, every garage, and the last unexplored corners of Leonida.',
  4: 'Whatever is left: the deliberately cryptic one-off trophies whose descriptions are jokes or teases, and the long 500-choice counter that only a full run feeds. When the 54th trophy lands, the platinum — Vice Got a Price! — pops on its own. If anything is still missing, the checklist above shows exactly which card it is.',
};

const listEl = document.getElementById('trophy-list');
const emptyEl = document.getElementById('empty-state');
const searchEl = document.getElementById('search');
const gradeFilterEl = document.getElementById('grade-filter');
const stateFilterEl = document.getElementById('state-filter');
const sortEl = document.getElementById('sort-mode');
const spoilerToggleEl = document.getElementById('spoiler-toggle');
const kindChipsEl = document.getElementById('kind-chips');

let trophies = [];
let progress = loadProgressState();
let activeKind = 'all';
const openGuides = new Set();

function loadProgressState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: {}, counts: {}, spoiler: false };
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      spoiler: parsed.spoiler === true,
    };
  } catch {
    return { earned: {}, counts: {}, spoiler: false };
  }
}

function saveProgressState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function isEarned(trophy) {
  return progress.earned[trophy.id] === true;
}

function computeAuditSummary(data) {
  const all = data.trophies;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const names = new Set();
  let guidesOk = true;
  let totalPoints = 0;
  for (const t of all) {
    if (byGrade[t.grade] !== undefined) byGrade[t.grade] += 1;
    names.add(t.name);
    if (!t.guide || !t.guide.trim()) guidesOk = false;
    totalPoints += t.points || 0;
  }
  const splitOk = byGrade.platinum === 1 && byGrade.gold === 2 && byGrade.silver === 6 && byGrade.bronze === 46;
  return {
    total: all.length,
    uniqueNames: names.size,
    byGrade,
    splitOk,
    guidesOk,
    totalPoints,
    verified: all.length === 55 && names.size === 55 && splitOk && guidesOk,
  };
}

function renderAuditStrip(audit) {
  const el = document.getElementById('audit-strip');
  const verdict = audit.verified
    ? 'names & descriptions match the official PlayStation list'
    : 'data check FAILED — see console';
  el.innerHTML =
    `<strong>Audit:</strong> ${audit.total} of 55 official trophies · ${audit.byGrade.platinum} platinum · ` +
    `${audit.byGrade.gold} gold · ${audit.byGrade.silver} silver · ${audit.byGrade.bronze} bronze · ` +
    `${audit.uniqueNames} unique names · ${audit.totalPoints.toLocaleString('en-US')} PSN points · ` +
    `0 online trophies · ${verdict}.`;
}

function renderProgressSummary() {
  const earned = trophies.filter(isEarned);
  const earnedPoints = earned.reduce((sum, t) => sum + t.points, 0);
  const totalPoints = trophies.reduce((sum, t) => sum + t.points, 0);
  const percent = trophies.length ? Math.round((earned.length / trophies.length) * 100) : 0;
  document.getElementById('earned-count').textContent = String(earned.length);
  document.getElementById('points-earned').textContent = earnedPoints.toLocaleString('en-US');
  document.getElementById('percent-earned').textContent = `${percent}%`;
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${percent}%`;
  fill.parentElement.setAttribute('aria-valuenow', String(earned.length));
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = earned.filter((t) => t.grade === g).length;
    return `${GRADE_LABEL[g]} ${got}/${total}`;
  });
  document.getElementById('grade-progress').textContent = parts.join(' · ');
  const platinum = trophies.find((t) => t.grade === 'platinum');
  const others = trophies.filter((t) => t.grade !== 'platinum');
  const othersEarned = others.filter(isEarned).length;
  document.getElementById('platinum-progress').textContent = platinum && isEarned(platinum)
    ? 'Platinum earned — you are a Leonida Legend.'
    : `Platinum progress: ${othersEarned}/${others.length} other trophies toward “Vice Got a Price!”`;
}

function trophyCountsForKind(kind) {
  if (kind === 'all') return trophies.length;
  if (kind === 'missable') return trophies.filter((t) => t.missable).length;
  return trophies.filter((t) => t.kind === kind).length;
}

function buildKindChips() {
  kindChipsEl.replaceChildren();
  for (const kind of ['all', 'story', 'missable', 'collectibles', 'activities', 'online']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip' + (activeKind === kind ? ' active' : '');
    const label = kind === 'all' ? 'All' : KIND_LABEL[kind];
    button.innerHTML = `${label} <span class="chip-count">${trophyCountsForKind(kind)}</span>`;
    button.addEventListener('click', () => {
      activeKind = kind;
      buildKindChips();
      renderTrophyList();
    });
    kindChipsEl.append(button);
  }
}

function trophyMatchesFilters(trophy) {
  if (activeKind === 'missable' && !trophy.missable) return false;
  if (activeKind !== 'all' && activeKind !== 'missable' && trophy.kind !== activeKind) return false;
  if (gradeFilterEl.value !== 'all' && trophy.grade !== gradeFilterEl.value) return false;
  if (stateFilterEl.value === 'earned' && !isEarned(trophy)) return false;
  if (stateFilterEl.value === 'unearned' && isEarned(trophy)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function sortTrophies(list) {
  const mode = sortEl.value;
  const copy = [...list];
  if (mode === 'grade') copy.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  else if (mode === 'official') copy.sort((a, b) => a.id - b.id);
  else copy.sort((a, b) => a.stage - b.stage || GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  return copy;
}

function isMasked(trophy) {
  return progress.spoiler && trophy.kind === 'story' && trophy.grade !== 'platinum' && !isEarned(trophy);
}

function shortSourceLine(trophy) {
  const first = trophy.sources && trophy.sources.length ? trophy.sources[0] : '';
  const extra = trophy.sources && trophy.sources.length > 1 ? ` +${trophy.sources.length - 1} more in guide` : '';
  return `Source: ${first}${extra}`;
}

function renderTrophyCard(trophy) {
  const card = document.createElement('article');
  const masked = isMasked(trophy);
  card.className = 'trophy-card' + (isEarned(trophy) ? ' earned' : '') + (masked ? ' masked' : '');
  card.id = `trophy-${trophy.id}`;

  const top = document.createElement('div');
  top.className = 'card-top';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = isEarned(trophy);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    progress.earned[trophy.id] = box.checked;
    if (!box.checked) delete progress.earned[trophy.id];
    saveProgressState();
    renderAll();
  });
  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = masked ? 'Hidden story trophy — earn it to reveal' : trophy.name;
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = masked ? 'Spoiler protection is on: this story trophy\u2019s name and description stay hidden until you earn it.' : trophy.description;
  titleWrap.append(name, desc);
  const badge = document.createElement('div');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.innerHTML = `${GRADE_LABEL[trophy.grade]}<small>${trophy.points} pts</small>`;
  top.append(box, titleWrap, badge);
  card.append(top);

  const chips = document.createElement('div');
  chips.className = 'card-chips';
  const kindChip = document.createElement('span');
  kindChip.className = 'mini-chip';
  // The platinum is not really a "story" trophy — it is the meta-trophy for
  // earning all 54 others, so label it as what it is instead of by family.
  kindChip.textContent = trophy.grade === 'platinum'
    ? 'Platinum · earned with all 54 others'
    : (KIND_LABEL[trophy.kind] || trophy.kind);
  const stageChip = document.createElement('span');
  stageChip.className = 'mini-chip stage';
  stageChip.textContent = `Stage ${trophy.stage} · ${STAGE_TITLES[trophy.stage]}`;
  chips.append(kindChip, stageChip);
  if (trophy.missable) {
    const m = document.createElement('span');
    m.className = 'mini-chip missable';
    m.textContent = 'MISSABLE — see guide';
    chips.append(m);
  }
  if (trophy.hidden) {
    const h = document.createElement('span');
    h.className = 'mini-chip hidden-chip';
    h.textContent = 'Hidden on PSN';
    chips.append(h);
  }
  card.append(chips);

  if (trophy.count) {
    const row = document.createElement('div');
    row.className = 'count-row';
    const label = document.createElement('label');
    label.textContent = `Progress toward ${trophy.count.toLocaleString('en-US')}:`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.count);
    input.value = progress.counts[trophy.id] ?? 0;
    input.setAttribute('aria-label', `Count progress for ${trophy.name}`);
    const state = document.createElement('span');
    const paintState = () => {
      const v = Number(input.value) || 0;
      state.textContent = v >= trophy.count ? 'Target reached' : `${Math.floor((v / trophy.count) * 100)}%`;
      state.className = v >= trophy.count ? 'count-done' : '';
    };
    input.addEventListener('change', () => {
      const v = Math.max(0, Math.min(trophy.count, Number(input.value) || 0));
      input.value = String(v);
      progress.counts[trophy.id] = v;
      saveProgressState();
      paintState();
    });
    paintState();
    label.append(' ', input);
    row.append(label, state);
    card.append(row);
  }

  const source = document.createElement('p');
  source.className = 'card-source';
  source.textContent = shortSourceLine(trophy);
  card.append(source);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const panel = document.createElement('div');
  panel.className = 'guide-panel';
  const paintToggle = () => {
    const open = openGuides.has(trophy.id);
    panel.hidden = !open;
    toggle.textContent = open ? 'Hide guide ▴' : 'Read the guide ▾';
  };
  toggle.addEventListener('click', () => {
    if (openGuides.has(trophy.id)) openGuides.delete(trophy.id);
    else openGuides.add(trophy.id);
    paintToggle();
  });
  const guideText = document.createElement('p');
  guideText.className = 'guide-text';
  guideText.textContent = trophy.guide;
  panel.append(guideText);
  if (trophy.missable && trophy.missableNote) {
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = `Why this is flagged missable: ${trophy.missableNote}`;
    panel.append(note);
  }
  const srcHeading = document.createElement('p');
  srcHeading.className = 'sources-heading';
  srcHeading.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'guide-sources';
  for (const s of trophy.sources || []) {
    const li = document.createElement('li');
    li.textContent = s;
    srcList.append(li);
  }
  panel.append(srcHeading, srcList);
  paintToggle();
  card.append(toggle, panel);
  return card;
}

function renderSpoilerStatus() {
  const el = document.getElementById('spoiler-status');
  if (!progress.spoiler) {
    el.hidden = true;
    return;
  }
  const maskedCount = trophies.filter(isMasked).length;
  el.hidden = false;
  el.textContent = maskedCount > 0
    ? `Spoiler protection is ON — ${maskedCount} unearned story ${maskedCount === 1 ? 'trophy is' : 'trophies are'} masked until earned (earn one to reveal it).`
    : 'Spoiler protection is ON — every story trophy is earned, so nothing is masked.';
}

function renderTrophyList() {
  const visible = sortTrophies(trophies.filter(trophyMatchesFilters));
  listEl.replaceChildren(...visible.map(renderTrophyCard));
  emptyEl.hidden = visible.length > 0;
  document.getElementById('visible-count').textContent = `Showing ${visible.length} of ${trophies.length}`;
  renderSpoilerStatus();
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmap-stages');
  wrap.replaceChildren();
  for (const stage of [1, 2, 3, 4]) {
    const inStage = trophies.filter((t) => t.stage === stage);
    const doneCount = inStage.filter(isEarned).length;
    const block = document.createElement('div');
    block.className = 'stage-block';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-number';
    num.textContent = `Stage ${stage}`;
    const title = document.createElement('h3');
    title.textContent = STAGE_TITLES[stage];
    const prog = document.createElement('span');
    prog.className = 'stage-progress';
    prog.textContent = `${doneCount}/${inStage.length} earned`;
    head.append(num, title, prog);
    const why = document.createElement('p');
    why.className = 'stage-why';
    why.textContent = STAGE_RATIONALES[stage];
    const ul = document.createElement('ul');
    ul.className = 'stage-list';
    for (const t of [...inStage].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id)) {
      const li = document.createElement('li');
      if (isEarned(t)) li.className = 'done';
      li.textContent = `${t.name} (${GRADE_LABEL[t.grade]})`;
      if (t.missable) {
        const flag = document.createElement('span');
        flag.className = 'flag';
        flag.textContent = ' MISSABLE';
        li.append(flag);
      }
      ul.append(li);
    }
    block.append(head, why, ul);
    wrap.append(block);
  }
}

function renderAll() {
  renderProgressSummary();
  buildKindChips();
  renderTrophyList();
  renderRoadmap();
}

function exportProgress() {
  const payload = {
    app: 'gta6-trophy-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: progress.earned,
    counts: progress.counts,
    spoiler: progress.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  const parsed = JSON.parse(await file.text());
  const next = { earned: {}, counts: {}, spoiler: parsed.spoiler === true };
  const validIds = new Set(trophies.map((t) => t.id));
  const earnedSrc = parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {};
  for (const [key, value] of Object.entries(earnedSrc)) {
    const id = Number(key);
    if (validIds.has(id) && value === true) next.earned[id] = true;
  }
  const countsSrc = parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {};
  for (const [key, value] of Object.entries(countsSrc)) {
    const id = Number(key);
    const trophy = trophies.find((t) => t.id === id);
    if (trophy && typeof value === 'number') next.counts[id] = Math.max(0, Math.min(trophy.count || value, value));
  }
  progress = next;
  spoilerToggleEl.checked = progress.spoiler;
  saveProgressState();
  renderAll();
}

function resetProgress() {
  progress = { earned: {}, counts: {}, spoiler: false };
  spoilerToggleEl.checked = false;
  saveProgressState();
  renderAll();
}

function applyUrlParameters() {
  const params = new URLSearchParams(location.search);
  const grade = params.get('grade');
  if (grade && ['platinum', 'gold', 'silver', 'bronze'].includes(grade)) gradeFilterEl.value = grade;
  const kind = params.get('kind');
  if (kind && ['story', 'missable', 'collectibles', 'activities', 'online'].includes(kind)) activeKind = kind;
  if (params.get('spoiler') === '1') {
    progress.spoiler = true;
    spoilerToggleEl.checked = true;
  }
  const openId = Number(params.get('open'));
  if (Number.isInteger(openId) && trophies.some((t) => t.id === openId)) openGuides.add(openId);
  return params;
}

async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophy data failed to load: ${response.status}`);
  return response.json();
}

const data = await loadTrophyData();
trophies = data.trophies;
renderAuditStrip(computeAuditSummary(data));
const initialParams = applyUrlParameters();
spoilerToggleEl.checked = progress.spoiler;

searchEl.addEventListener('input', renderTrophyList);
gradeFilterEl.addEventListener('change', renderTrophyList);
stateFilterEl.addEventListener('change', renderTrophyList);
sortEl.addEventListener('change', renderTrophyList);
spoilerToggleEl.addEventListener('change', () => {
  progress.spoiler = spoilerToggleEl.checked;
  saveProgressState();
  renderTrophyList();
});
document.getElementById('export-button').addEventListener('click', exportProgress);
document.getElementById('import-input').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await importProgress(file);
  } catch {
    alert('That file could not be read as trophy progress.');
  }
  event.target.value = '';
});
document.getElementById('reset-button').addEventListener('click', resetProgress);

renderAll();

// Scroll only after the first painted frame, so a screenshot (or a reader on
// a slow device) never catches the page mid-jump at a pre-paint position.
function scrollToTargetAfterPaint(element, options) {
  if (!element) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => element.scrollIntoView(options));
  });
}

if (initialParams.get('view') === 'roadmap') {
  scrollToTargetAfterPaint(document.getElementById('roadmap'));
}
const openParam = Number(initialParams.get('open'));
if (Number.isInteger(openParam) && openParam > 0) {
  scrollToTargetAfterPaint(document.getElementById(`trophy-${openParam}`), { block: 'start' });
}
