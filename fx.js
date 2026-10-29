(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const $ = id => document.getElementById(id);
const rnd = n => Math.floor(Math.random() * n);

/* ---------- 1. «Расшифровка» текста ---------- */
const GLYPHS = '01<>/\\{}[]#$%&@ABCDEFXYZ';
function scramble(el, finalText, dur){
  if(reduce || !el) return;
  const text = finalText != null ? finalText : el.textContent;
  if(el._busy) return;
  el._busy = true;
  const len = text.length, start = performance.now(); dur = dur || 600;
  (function step(now){
    const p = Math.min(1, (now - start) / dur);
    const fixed = Math.floor(p * len);
    let out = '';
    for(let i = 0; i < len; i++){
      const ch = text[i];
      out += (i < fixed || ch === ' ' || ch === '.' || ch === ',') ? ch : GLYPHS[rnd(GLYPHS.length)];
    }
    el.textContent = out;
    if(p < 1) requestAnimationFrame(step); else { el.textContent = text; el._busy = false; }
  })(start);
}

/* ---------- 2. Загрузочный терминал ---------- */
function boot(){
  if(reduce) return;
  const D = window.SCHEDULE, n = D ? D.groups.length : 0;
  const el = document.createElement('div'); el.id = 'boot';
  el.innerHTML = '<pre id="bootTxt"></pre><div class="skip">нажмите, чтобы пропустить</div>';
  document.body.appendChild(el);
  const lines = [
    '> подключение к серверу ХТК...',
    '> загрузка расписания 2026/2027 ... OK',
    '> найдено групп: ' + n,
    '> синхронизация числителя/знаменателя ... OK',
    '> доступ разрешён_'
  ];
  const pre = $('bootTxt'); let li = 0, ci = 0, done = false;
  function close(){ if(done) return; done = true; el.classList.add('out'); setTimeout(() => { el.remove(); intro(); }, 520); }
  el.addEventListener('click', close);
  (function type(){
    if(done) return;
    if(li >= lines.length){ pre.innerHTML += '<span class="cur"></span>'; return setTimeout(close, 450); }
    pre.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + lines[li].slice(0, ++ci);
    if(ci >= lines[li].length){ li++; ci = 0; setTimeout(type, 160); } else setTimeout(type, 18);
  })();
  setTimeout(close, 3600);
}
function intro(){
  const h = document.querySelector('h1'); if(h) scramble(h, h.textContent, 900);
  const sub = $('subtitle'); if(sub) scramble(sub, sub.textContent, 1100);
}

/* ---------- 3. Часы с мигающим двоеточием ---------- */
function clock(){
  const n = new Date(), p = x => String(x).padStart(2, '0');
  $('clockTime').innerHTML = p(n.getHours()) + '<span class="colon">:</span>' + p(n.getMinutes());
}
clock(); setInterval(clock, 1000);

/* ---------- 4. Случайные глитчи заголовка ---------- */
if(!reduce){
  const h = document.querySelector('h1');
  (function loop(){ setTimeout(() => { h.classList.add('gl'); setTimeout(() => h.classList.remove('gl'), 400); loop(); }, 3500 + rnd(6000)); })();
  const beam = document.createElement('div'); beam.className = 'beam'; document.body.appendChild(beam);
}

/* ---------- 5. Появление блоков при прокрутке ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.08});
document.querySelectorAll('.panel, .bar').forEach(n => { n.classList.add('rv'); io.observe(n); });
const viewObs = new MutationObserver(() => { const v = $('view'); if(!v.classList.contains('hidden')){ v.querySelectorAll('.bar,.tabs').forEach(n => { n.classList.add('in'); }); } });
viewObs.observe($('view'), {attributes:true, attributeFilter:['class']});

/* ---------- 6. Расшифровка названия группы и предметов ---------- */
const gName = $('gName'); let gLast = gName.textContent;
new MutationObserver(() => {
  if(gName._busy) return;
  const t = gName.textContent; if(t === gLast) return; gLast = t; scramble(gName, t, 650);
}).observe(gName, {childList:true, characterData:true, subtree:true});

const dayView = $('dayView'); let prevDay = null;
function dayIndexNow(){ const a = document.querySelector('.tab.on'); return a ? +a.dataset.i : 0; }
new MutationObserver(() => {
  dayView.querySelectorAll('.subj').forEach((s, i) => { const t = s.textContent; setTimeout(() => scramble(s, t, 450), i * 90); });
}).observe(dayView, {childList:true});

/* направление листания дней + глитч */
$('dayTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-i]'); if(!b) return;
  const now = +b.dataset.i;
  const dir = prevDay == null ? 1 : (now >= prevDay ? 1 : -1);
  dayView.dataset.dir = dir; prevDay = now;
  dayView.classList.remove('sw'); void dayView.offsetWidth; dayView.classList.add('sw');
  setTimeout(() => dayView.classList.remove('sw'), 380);
}, true);
dayView.dataset.dir = 1;

/* ---------- 7. Волна при нажатии ---------- */
document.addEventListener('pointerdown', e => {
  const t = e.target.closest('.chip, .tab, .seg button, .res');
  if(!t || reduce) return;
  t.classList.add('rip');
  const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
  const i = document.createElement('i');
  i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s/2}px;top:${e.clientY - r.top - s/2}px`;
  t.appendChild(i); setTimeout(() => i.remove(), 700);
});

/* ---------- 8. Подсветка + наклон под курсором ---------- */
if(fine && !reduce){
  document.addEventListener('pointermove', e => {
    const t = e.target.closest('.lesson, .res, .panel'); if(!t) return;
    const r = t.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    t.style.setProperty('--mx', x + 'px'); t.style.setProperty('--my', y + 'px');
    if(t.classList.contains('lesson')){
      t.style.setProperty('--ry', ((x / r.width - .5) * 5).toFixed(2) + 'deg');
      t.style.setProperty('--rx', ((.5 - y / r.height) * 7).toFixed(2) + 'deg');
    }
  });
  document.addEventListener('pointerout', e => {
    const t = e.target.closest && e.target.closest('.lesson');
    if(t){ t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
  });

  /* ---------- 9. След курсора ---------- */
  const cv = document.createElement('canvas'); cv.id = 'trail'; document.body.appendChild(cv);
  const cx = cv.getContext('2d'); let pts = [];
  function sz(){ cv.width = innerWidth; cv.height = innerHeight; } sz(); addEventListener('resize', sz);
  addEventListener('pointermove', e => { for(let k = 0; k < 2; k++) pts.push({x:e.clientX + (Math.random()-.5)*8, y:e.clientY + (Math.random()-.5)*8, vx:(Math.random()-.5)*1.2, vy:Math.random()*1.4 + .3, l:1, c:GLYPHS[rnd(GLYPHS.length)]}); });
  (function draw(){
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.font = '13px "Share Tech Mono",monospace';
    pts = pts.filter(p => p.l > 0);
    pts.forEach(p => { p.x += p.vx; p.y += p.vy; p.l -= .025; cx.globalAlpha = Math.max(p.l, 0); cx.fillStyle = '#00ff66'; cx.shadowColor = '#00ff66'; cx.shadowBlur = 8; cx.fillText(p.c, p.x, p.y); });
    cx.globalAlpha = 1; cx.shadowBlur = 0;
    requestAnimationFrame(draw);
  })();
}

/* ---------- 10. Печатающиеся подсказки в полях ---------- */
function typer(input, phrases){
  if(reduce) return;
  let pi = 0, ci = 0, del = false;
  (function tick(){
    if(document.activeElement === input || input.value){ input.placeholder = phrases[0]; return setTimeout(tick, 1200); }
    const ph = phrases[pi];
    ci += del ? -1 : 1; input.placeholder = ph.slice(0, ci) + (ci % 2 ? '▌' : '');
    let d = del ? 28 : 65;
    if(!del && ci === ph.length){ del = true; d = 1400; }
    else if(del && ci === 0){ del = false; pi = (pi + 1) % phrases.length; d = 350; }
    setTimeout(tick, d);
  })();
}
typer($('groupInput'), ['ИСП-Д52', 'ПГ-Д61', 'СЭЗ-Д41', 'МЭО-Д31', 'введите вашу группу']);
typer($('q'), ['Шевчук', 'Математика', 'УЛК2 ауд.311', 'Физическая культура', 'поиск по всем группам']);

/* ---------- 11. Запуск ---------- */
boot();
})();
