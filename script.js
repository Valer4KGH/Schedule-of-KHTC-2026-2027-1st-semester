(function(){
const D = window.SCHEDULE;
const DAYS = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб'];
const $ = id => document.getElementById(id);

/* ---- безопасное хранилище ---- */
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- шапка ---- */
$('subtitle').textContent = D.org + ' · ' + D.title.replace(/\s*г\.?$/,'');
$('foot1').textContent = D.org + ' · ' + D.title;
function tick(){
  const n = new Date();
  $('clockTime').textContent = n.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
  $('clockDate').textContent = n.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
}
tick(); setInterval(tick, 20000);

/* ---- числитель / знаменатель ----
   Опорная неделя: понедельник 31 августа 2026 (неделя 1 сентября) — числитель.
   Если в вашем колледже наоборот, нажмите нужную кнопку — выбор запомнится. */
const ANCHOR = new Date(2026, 7, 31);
function autoWeek(date){
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d0.getDay() + 6) % 7;
  const monday = new Date(d0); monday.setDate(d0.getDate() - dow);
  const weeks = Math.round((monday - ANCHOR) / (7*864e5));
  return (((weeks % 2) + 2) % 2 === 0) ? 'n' : 'd';
}
let flip = store.get('rasp.flip') === '1';
const curWeek = () => { const a = autoWeek(new Date()); return flip ? (a === 'n' ? 'd' : 'n') : a; };
let week = curWeek();
let mode = store.get('rasp.mode') === 'week' ? 'week' : 'day';
const todayIdx = (() => { const i = (new Date().getDay() + 6) % 7; return i; })(); // 6 = воскресенье
let dayIdx = todayIdx > 5 ? 0 : todayIdx;
let group = null;

/* ---- разбор текста пары ---- */
const isNo = t => !t || /^(нет|-|—)\.?$/i.test(t.trim());
function splitParts(t){
  let parts = t.split(' / ').map(s => s.trim()).filter(Boolean);
  if(parts.length === 1){
    const m = parts[0].match(/\s([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ]\.\s?[А-ЯЁ]?\.?|(?=\s*(?:УЛК|УПМ|[Оо]бщ|\d))))/);
    if(m && m.index > 8) parts = [parts[0].slice(0, m.index).trim(), parts[0].slice(m.index).trim()];
  }
  return parts;
}
function lessonHTML(t){
  const parts = splitParts(t);
  const subj = parts.shift() || '';
  return `<div class="subj">${esc(subj)}</div>` + (parts.length ? `<div class="meta">${esc(parts.join(' · '))}</div>` : '');
}
function textFor(it, w){ return w === 'n' ? it.n : it.d; }

/* ---- выбор группы ---- */
const input = $('groupInput'), list = $('groupList');
list.innerHTML = D.groups.map(g => `<option value="${esc(g.name)}">${g.course} курс</option>`).join('');
let course = 0;
function renderChips(){
  const courses = [...new Set(D.groups.map(g => g.course))].sort();
  $('courseChips').innerHTML = `<button class="chip ${course===0?'on':''}" data-c="0">Все</button>` +
    courses.map(c => `<button class="chip ${course===c?'on':''}" data-c="${c}">${c} курс</button>`).join('');
  $('groupChips').innerHTML = D.groups.filter(g => !course || g.course === course)
    .map(g => `<button class="chip ${group && group.name===g.name?'on':''}" data-g="${esc(g.name)}">${esc(g.name)}</button>`).join('');
}
$('courseChips').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if(!b) return; course = +b.dataset.c; renderChips(); });
$('groupChips').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if(b) pick(b.dataset.g); });
input.addEventListener('input', () => {
  const v = input.value.trim().toLowerCase();
  const g = D.groups.find(x => x.name.toLowerCase() === v);
  if(g) pick(g.name, true);
});
function pick(name, fromInput){
  const g = D.groups.find(x => x.name === name); if(!g) return;
  group = g; store.set('rasp.group', name);
  if(!fromInput) input.value = name;
  if(!course) {} else course = g.course;
  renderChips(); render();
  if(!fromInput) $('view').scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---- рендер ---- */
function render(){
  const has = !!group;
  $('view').classList.toggle('hidden', !has);
  $('empty').classList.toggle('hidden', has);
  if(!has) return;
  $('gName').textContent = group.name;
  [...$('weekSeg').children].forEach(b => b.classList.toggle('on', b.dataset.w === week));
  [...$('modeSeg').children].forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  const auto = curWeek();
  $('weekHint').innerHTML = `Сейчас идёт неделя: <b>${auto==='n'?'числитель':'знаменатель'}</b>` + (week !== auto ? ` · вы смотрите <b>${week==='n'?'числитель':'знаменатель'}</b>` : '');
  $('dayTabs').classList.toggle('hidden', mode === 'week');
  $('dayView').classList.toggle('hidden', mode === 'week');
  $('weekView').classList.toggle('hidden', mode !== 'week');
  mode === 'week' ? renderWeek() : (renderTabs(), renderDay());
}
function renderTabs(){
  $('dayTabs').innerHTML = DAYS.map((d,i) => {
    const cnt = (group.days[d] || []).filter(x => x.p && !isNo(textFor(x, week))).length;
    return `<button class="tab ${i===dayIdx?'on':''} ${i===todayIdx?'today':''}" data-i="${i}">${d}<small>${cnt ? cnt + ' ' + (cnt===1?'пара':cnt<5?'пары':'пар') : 'нет пар'}</small></button>`;
  }).join('');
}
$('dayTabs').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if(!b) return; dayIdx = +b.dataset.i; renderTabs(); renderDay(); });

function renderDay(){
  const items = group.days[DAYS[dayIdx]] || [];
  const byPair = {}; items.forEach(x => byPair[x.p] = x);
  const maxP = Math.max(3, ...items.filter(x => x.p && !isNo(textFor(x, week))).map(x => x.p));
  let html = '', i = 0;
  const talk = byPair[0];
  if(talk && !isNo(textFor(talk, week)))
    html += `<div class="lesson talk" style="animation-delay:0s"><div class="num"><b>★</b><span>до пар</span></div><div class="body"><span class="badge">КЛАССНЫЙ ЧАС</span>${lessonHTML(textFor(talk, week))}</div></div>`;
  for(let p = 1; p <= maxP; p++){
    const it = byPair[p], t = it ? textFor(it, week) : '';
    const other = it ? textFor(it, week === 'n' ? 'd' : 'n') : '';
    const diff = it && (it.n !== it.d);
    const delay = (++i * .05).toFixed(2);
    if(!it || isNo(t)){
      html += `<div class="lesson free" style="animation-delay:${delay}s"><div class="num"><b>${p}</b><span>пара</span></div><div class="body">— нет занятия —</div></div>`;
    } else {
      html += `<div class="lesson" style="animation-delay:${delay}s"><div class="num"><b>${p}</b><span>пара</span></div><div class="body">` +
        (diff ? `<span class="badge g">${week==='n'?'ЧИСЛИТЕЛЬ':'ЗНАМЕНАТЕЛЬ'}</span>` : '') + lessonHTML(t) +
        (diff && !isNo(other) ? `<div class="alt"><b>${week==='n'?'ЗНАМЕНАТЕЛЬ':'ЧИСЛИТЕЛЬ'}</b>${esc(other.split(' / ').join(' · '))}</div>` : '') +
        `</div></div>`;
    }
  }
  $('dayView').innerHTML = html;
}
function renderWeek(){
  let maxP = 3;
  DAYS.forEach(d => (group.days[d]||[]).forEach(x => { if(x.p > maxP && !isNo(textFor(x, week))) maxP = x.p; }));
  let h = '<table><thead><tr><th>№</th>' + DAYS.map((d,i) => `<th class="${i===todayIdx?'today':''}">${SHORT[i]}</th>`).join('') + '</tr></thead><tbody>';
  for(let p = 1; p <= maxP; p++){
    h += `<tr><td class="pn">${p}</td>`;
    DAYS.forEach((d,i) => {
      const it = (group.days[d]||[]).find(x => x.p === p), t = it ? textFor(it, week) : '';
      if(!it || isNo(t)) h += `<td class="free ${i===todayIdx?'today':''}">—</td>`;
      else {
        const parts = splitParts(t);
        h += `<td class="${i===todayIdx?'today':''}"><b>${esc(parts.shift())}</b><span>${esc(parts.join(' · '))}</span></td>`;
      }
    });
    h += '</tr>';
  }
  $('weekView').innerHTML = h + '</tbody></table>';
}
$('weekSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-w]'); if(!b) return;
  week = b.dataset.w;
  flip = (week !== autoWeek(new Date())); store.set('rasp.flip', flip ? '1' : '0');
  render();
});
$('modeSeg').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if(!b) return; mode = b.dataset.m; store.set('rasp.mode', mode); render(); });

/* ---- поиск ---- */
const index = [];
D.groups.forEach(g => DAYS.forEach(d => (g.days[d]||[]).forEach(it => {
  if(!it.p) return;
  const same = it.n === it.d;
  [['n', it.n], ['d', it.d]].forEach(([w, t]) => {
    if(isNo(t)) return;
    if(w === 'd' && same) return;
    index.push({g:g.name, d, p:it.p, w: same ? '' : (w==='n'?'числ.':'знам.'), t, low:t.toLowerCase().replace(/ё/g,'е')});
  });
})));
const norm = s => s.toLowerCase().replace(/ё/g,'е').replace(/[.,]/g,' ').replace(/\s+/g,' ').trim();
let st;
$('q').addEventListener('input', () => { clearTimeout(st); st = setTimeout(search, 160); });
function search(){
  const q = norm($('q').value), box = $('results');
  if(q.length < 2){ box.innerHTML = ''; return; }
  const words = q.split(' ');
  const res = index.filter(x => { const l = norm(x.low); return words.every(w => l.includes(w)); });
  if(!res.length){ box.innerHTML = '<div class="more">Ничего не найдено</div>'; return; }
  const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')', 'gi');
  box.innerHTML = res.slice(0, 40).map(x => `<div class="res" data-g="${esc(x.g)}" data-d="${DAYS.indexOf(x.d)}">
    <div class="w">${esc(x.g)}<small>${SHORT[DAYS.indexOf(x.d)]}, ${x.p} пара ${x.w}</small></div>
    <div>${esc(x.t.split(' / ').join(' · ')).replace(re, '<mark>$1</mark>')}</div></div>`).join('') +
    (res.length > 40 ? `<div class="more">Показано 40 из ${res.length} — уточните запрос</div>` : `<div class="more">Найдено: ${res.length}</div>`);
}
$('results').addEventListener('click', e => {
  const r = e.target.closest('.res'); if(!r) return;
  dayIdx = +r.dataset.d; mode = 'day'; pick(r.dataset.g);
});

/* ---- «матрица» на фоне ---- */
const cv = $('rain'), cx = cv.getContext('2d');
let cols, drops;
function size(){ cv.width = innerWidth; cv.height = innerHeight; cols = Math.floor(cv.width / 18); drops = Array.from({length:cols}, () => Math.random() * -50); }
size(); addEventListener('resize', size);
const chars = '01ABCDEF<>/{}#$%ХТКРАСПИСАНИЕ';
(function rain(){
  cx.fillStyle = 'rgba(3,7,5,.12)'; cx.fillRect(0, 0, cv.width, cv.height);
  cx.fillStyle = '#00ff66'; cx.font = '14px monospace';
  drops.forEach((y, i) => {
    cx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, y * 18);
    drops[i] = (y * 18 > cv.height && Math.random() > .975) ? 0 : y + .5;
  });
  setTimeout(() => requestAnimationFrame(rain), 60);
})();

/* ---- старт ---- */
renderChips(); render();
const saved = store.get('rasp.group');
if(saved && D.groups.some(g => g.name === saved)){ course = D.groups.find(g => g.name === saved).course; pick(saved, false); window.scrollTo(0,0); }
})();
