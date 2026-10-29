(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const $ = id => document.getElementById(id);
const body = document.body;
function add(tag, id, cls, html){ const e = document.createElement(tag); if(id) e.id = id; if(cls) e.className = cls; if(html) e.innerHTML = html; body.appendChild(e); return e; }

/* текстуры */
add('div', 'concrete');
add('div', 'grid');
add('div', 'bigword', '', 'Расписание · Расписание · Расписание · Расписание ·');
if(reduce) return;
for(let i = 0; i < 3; i++) add('div', null, 'scratch');

/* зерно плёнки */
const g = add('canvas', 'grain'); g.width = 160; g.height = 160;
const gx = g.getContext('2d'), im = gx.createImageData(160, 160);
let last = 0;
(function grain(t){
  if(t - last > 90){
    last = t; const d = im.data;
    for(let i = 0; i < d.length; i += 4){ const v = Math.random() * 255 | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
    gx.putImageData(im, 0, 0);
  }
  requestAnimationFrame(grain);
})(0);

/* бегущая строка */
(function(){
  const header = document.querySelector('.top'); if(!header) return;
  const D = window.SCHEDULE;
  const items = ['Расписание занятий', D ? D.org : 'ХТК', D ? D.title.replace(/\s*г\.?$/,'') : '2026/2027', (D ? D.groups.length : '') + ' групп', 'Числитель / Знаменатель', 'Не опаздывай'];
  const one = items.map(s => `<span>${s}</span><span class="dot">✦</span>`).join('');
  const t = document.createElement('div'); t.className = 'ticker';
  t.innerHTML = `<div class="ticker-track">${one}${one}${one}${one}</div>`;
  header.insertAdjacentElement('afterend', t);

  /* круговой штамп */
  const st = document.createElement('div'); st.className = 'stamp';
  st.innerHTML = `<svg viewBox="0 0 100 100"><defs><path id="cp" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>
    <text><textPath href="#cp">РАСПИСАНИЕ • ХТК • 2026 • </textPath></text></svg><i>▮</i>`;
  header.appendChild(st);
})();

/* курсор-инвертор */
if(fine){
  const r = add('div', 'ring'); let x = innerWidth/2, y = innerHeight/2, tx = x, ty = y;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  addEventListener('pointerdown', () => r.classList.add('down'));
  addEventListener('pointerup', () => r.classList.remove('down'));
  document.addEventListener('pointerover', e => { r.classList.toggle('big', !!e.target.closest('button, input, .lesson, .res, .tab, .chip')); });
  (function f(){ x += (tx - x) * .2; y += (ty - y) * .2; r.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(f); })();
}

/* жалюзи-инверсия при переходах */
const bl = add('div', 'blinds'); for(let i = 0; i < 9; i++){ const b = document.createElement('i'); b.style.animationDelay = (i * .035) + 's'; bl.appendChild(b); }
let blTimer;
function blinds(){ bl.classList.remove('go'); void bl.offsetWidth; bl.classList.add('go'); clearTimeout(blTimer); blTimer = setTimeout(() => bl.classList.remove('go'), 1100); }
document.addEventListener('click', e => {
  if(e.target.closest('#groupChips .chip, #modeSeg button, .res')) blinds();
});
$('groupInput').addEventListener('change', blinds);

/* редкая вспышка негатива */
(function loop(){
  setTimeout(() => {
    const h = document.documentElement; h.classList.add('neg');
    setTimeout(() => { h.classList.remove('neg'); setTimeout(() => { h.classList.add('neg'); setTimeout(() => h.classList.remove('neg'), 60); }, 70); }, 90);
    loop();
  }, 14000 + Math.random() * 16000);
})();
})();
