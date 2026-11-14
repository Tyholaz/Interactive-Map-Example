/* ============================================================
   utils.js — дрібні помічники: DOM, сховище, тости, іконки
   ============================================================ */

const $ = id => document.getElementById(id);
const root = document.documentElement;
const side = $('side');

// екранування HTML (для вставки тексту в шаблони)
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// медіа-запити
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mq = matchMedia('(max-width: 799px)');
const coarse = matchMedia('(pointer: coarse)').matches;

const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

// localStorage без винятків + кеш із терміном дії
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const cache = {
  get(k, ttl) { const o = store.get(k, null); return o && Date.now() - o.t < ttl ? o.v : null; },
  set(k, v) { store.set(k, { t: Date.now(), v }); }
};

// розмір піна: більший на сенсорних екранах
const PIN = coarse ? 34 : 28;
root.style.setProperty('--pin', PIN + 'px');

// короткі повідомлення
let toastT;
function toast(t) {
  const el = $('toast'); el.textContent = t; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

/* ---------- SVG-іконки (24×24, лише контури) ---------- */
const IC = {
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  eat: '<path d="M7 3v7M4 3v4a3 3 0 0 0 3 3M10 3v4a3 3 0 0 1-3 3M7 10v11M18 3c-2.2 1.6-3 4.2-3 7h3v11"/>',
  cafe: '<path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 9h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2"/>',
  bar: '<path d="M5 4h14l-7 8zM12 12v8M8 20h8"/>',
  walk: '<path d="M12 21v-6M12 3a5 5 0 0 0-4 8 4 4 0 0 0 1 4h6a4 4 0 0 0 1-4 5 5 0 0 0-4-8z"/>',
  see: '<path d="M3 21h18M5 10v11M9.5 10v11M14.5 10v11M19 10v11M3 10l9-6 9 6z"/>',
  shop: '<path d="M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0"/>'
};
const ico = (k, n) => `<svg viewBox="0 0 24 24" width="${n}" height="${n}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;
/* ============================================================
   state.js — спільний стан застосунку (змінні, які міняються під час роботи)
   ============================================================ */

let start = CENTER;          // точка старту маршрутів
let userStart = false;       // true, якщо старт — позиція користувача
let areaBounds = null;       // межі району (з OSM)

let mode = store.get('mode', 'foot');   // foot | bike | car (запам'ятовується)
if (!MODES[mode]) mode = 'foot';

let items = [];              // усі місця (добірка + OSM)
let filter = 'all';          // активна категорія
let query = '';              // пошуковий запит
let sortBy = 'dist';         // dist | name
let limit = 40;              // скільки місць показано в списку
let maxD = 0;                // фільтр відстані в метрах (0 = без обмеження)
let sel = null;              // вибране місце
const fav = new Set(store.get('fav', []));   // збережені id

// маршрут
let token = 0, routeGlow = null, routeFlow = null, routeControl = null, routeLine = null, walker = null, pulse = null, drawTimer = null;

let shown = 0;               // для анімації лічильника
let spinning = false;        // триває «Здивуй мене»
let nowCache = null;         // кеш поточного часу (Київ)
/* ============================================================
   model.js — прості обчислення над місцями
   ============================================================ */

const dist = it => map.distance(start, it.coords);   // метри по прямій
const fmt = m => m < 1000 ? Math.round(m / 10) * 10 + ' м' : (m / 1000).toFixed(1) + ' км';
const etaMin = it => Math.max(1, Math.round(dist(it) * 1.3 / SPEED[mode]));   // хвилини за обраним режимом
const byId = id => items.find(i => i.id === id);
/* ============================================================
   hours.js — «відкрито зараз» і «зачиняється через…»
   Розбирає спрощений формат OSM opening_hours; час — за Києвом
   ============================================================ */

function kyivNow() {
  if (nowCache && Date.now() - nowCache.at < 30000) return nowCache;
  let f;
  const o = { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false };
  try { f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'Europe/Kyiv' }); }
  catch (e) { try { f = new Intl.DateTimeFormat('en-US', { ...o, timeZone: 'Europe/Kiev' }); } catch (e2) { f = new Intl.DateTimeFormat('en-US', o); } }
  const p = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
  return nowCache = {
    at: Date.now(),
    di: (['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].indexOf(p.weekday.slice(0, 2)) + 6) % 7,   // 0 = понеділок
    m: (+p.hour % 24) * 60 + +p.minute                                                          // хвилини від півночі
  };
}

// Повертає null (невідомо) або { open: bool, mins: хвилин до зміни статусу | null }
function hoursState(s) {
  if (!s) return null;
  s = String(s).replace(/щодня/i, 'Mo-Su').replace(/[–—]/g, '-').trim();
  if (/^24\/7$/.test(s)) return { open: true, mins: null };

  const D = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'], { di, m } = kyivNow();
  let known = false, open = false, closeIn = null, openIn = null;

  for (const part of s.split(';')) {
    const mt = part.trim().match(/^([A-Za-z,\-]*)\s*((?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*,?\s*)+)$/);
    if (!mt) return null;

    // чи входить сьогоднішній день у цей рядок
    let dayOk = false;
    for (const x of (mt[1] ? mt[1].split(',') : ['Mo-Su'])) {
      const [a, b] = x.split('-'), ia = D.indexOf(a), ib = b ? D.indexOf(b) : ia;
      if (ia < 0 || ib < 0) return null;
      if (ia <= ib ? di >= ia && di <= ib : di >= ia || di <= ib) dayOk = true;
    }
    known = true;

    // проміжки часу
    if (dayOk) for (const t of mt[2].split(',')) {
      const r = t.trim().match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/); if (!r) continue;
      const s0 = +r[1] * 60 + +r[2], e0 = +r[3] * 60 + +r[4];
      if (e0 > s0 ? m >= s0 && m < e0 : m >= s0 || m < e0) {
        open = true;
        const left = e0 > s0 ? e0 - m : (m >= s0 ? 1440 - m + e0 : e0 - m);
        closeIn = Math.max(closeIn ?? 0, left);
      } else if (s0 > m) {
        openIn = Math.min(openIn ?? 1e9, s0 - m);
      }
    }
  }
  return known ? { open, mins: open ? closeIn : openIn } : null;
}

const openNow = s => { const h = hoursState(s); return h ? h.open : null; };

const fmtMin = n => n < 60 ? n + ' хв' : Math.floor(n / 60) + ' год' + (n % 60 ? ' ' + (n % 60) + ' хв' : '');

// Якщо до зміни статусу ≤ 2 год — показуємо «зачиняється через 40 хв», інакше просто «відкрито/зачинено»
const stHtml = h => !h ? '' : `<span class="st ${h.open ? 'on' : 'off'}">${
  h.mins != null && h.mins <= 120
    ? (h.open ? 'зачиняється через ' : 'відкриється через ') + fmtMin(Math.max(1, h.mins))
    : (h.open ? 'відкрито' : 'зачинено')
}</span>`;
/* ============================================================
   theme.js — світла / темна тема
   ============================================================ */

function setTheme(d) {
  document.body.classList.toggle('dark', d);
  $('tl').textContent = d ? 'Світла' : 'Темна';
  $('ti').innerHTML = ico(d ? 'sun' : 'moon', 20);
  store.set('dark', d);
  document.querySelector('meta[name=theme-color]').content = d ? '#121212' : '#fafafa';
}

// Перемикання з «розгортанням» круга від кнопки (де підтримується View Transitions)
$('theme').onclick = () => {
  const d = !document.body.classList.contains('dark');
  if (!document.startViewTransition || reduce) return setTheme(d);
  const r = $('theme').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(() => setTheme(d));
  t.ready.then(() => root.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
    { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
  )).catch(() => {});
};
/* ============================================================
   map.js — створення карти Leaflet
   ============================================================ */

const map = L.map('map', { attributionControl: false, tapTolerance: 15 }).setView(CENTER, 15);
L.control.attribution({ position: 'topright', prefix: false }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; учасники <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  maxZoom: 19
}).addTo(map);

const dotIcon = c => L.divIcon({ className: '', html: `<div class="dot ${c || ''}"></div>`, iconSize: [12, 12] });
const startMarker = L.marker(start, { icon: dotIcon('start'), zIndexOffset: -100 }).addTo(map).bindTooltip('Старт', { direction: 'top' });
const group = L.layerGroup().addTo(map);   // шар з пінами місць
let userMarker = null;                     // синя крапка «я тут»
/* ============================================================
   sheet.js — висувна нижня панель на телефоні + допоміжні функції камери
   ============================================================ */

const mainEl = $('main');
const SNAP = { peek: () => 150, half: () => Math.round(mainEl.clientHeight * .5), full: () => mainEl.clientHeight - 8 };
let snap = 'half', curH = 0;

function applyH(h) { curH = h; side.style.height = h + 'px'; root.style.setProperty('--sh', h + 'px'); }

function setSheet(s, instant) {
  snap = s;
  if (!mq.matches) { side.style.height = ''; root.style.setProperty('--sh', '0px'); curH = 0; return; }
  if (instant) { side.style.transition = 'none'; applyH(SNAP[s]()); side.offsetHeight; side.style.transition = ''; }
  else applyH(SNAP[s]());
}

// скільки місця на карті займає панель (щоб центрувати карту в решті)
const landscapePhone = () => matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
const sheetPad = () => mq.matches && !landscapePhone() ? curH : 0;
const sideW = () => mq.matches && landscapePhone() ? side.offsetWidth : 0;
const nearest = h => ['peek', 'half', 'full'].reduce((a, k) => Math.abs(SNAP[k]() - h) < Math.abs(SNAP[a]() - h) ? k : a, 'peek');

// перетягування за «ручку»
(() => {
  const g = $('grab'); let d = null;

  g.addEventListener('pointerdown', e => {
    if (!mq.matches) return;
    g.setPointerCapture(e.pointerId);
    d = { y: e.clientY, h: curH, ly: e.clientY, lt: performance.now(), v: 0, moved: 0 };
    side.classList.add('drag');
  });

  g.addEventListener('pointermove', e => {
    if (!d) return;
    const now = performance.now();
    d.v = (e.clientY - d.ly) / (now - d.lt || 1); d.ly = e.clientY; d.lt = now;
    d.moved = Math.max(d.moved, Math.abs(e.clientY - d.y));
    applyH(Math.max(SNAP.peek(), Math.min(SNAP.full(), d.h - (e.clientY - d.y))));
  });

  const end = () => {
    if (!d) return;
    side.classList.remove('drag');
    const pts = ['peek', 'half', 'full']; let best;
    if (d.moved < 5) best = snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'half';                                // клік
    else if (Math.abs(d.v) > .5) best = pts[Math.max(0, Math.min(2, pts.indexOf(nearest(curH)) + (d.v < 0 ? 1 : -1)))]; // «кидок»
    else best = nearest(curH);                                                                                            // відпустили
    d = null; setSheet(best);
  };
  g.addEventListener('pointerup', end);
  g.addEventListener('pointercancel', end);
  g.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSheet(snap === 'peek' ? 'half' : snap === 'half' ? 'full' : 'peek'); }
  });
})();

// перерахунок при зміні розміру/орієнтації
const relayout = debounce(() => { setSheet(snap, true); map.invalidateSize(); }, 120);
addEventListener('resize', relayout);
addEventListener('orientationchange', relayout);
mq.addEventListener ? mq.addEventListener('change', relayout) : mq.addListener(relayout);

// плавно перелетіти до точки з урахуванням панелі
function focusOn(ll, z) {
  const p = map.project(ll, z).add([-sideW() / 2, sheetPad() / 2]);
  map.flyTo(map.unproject(p, z), z, { duration: reduce ? 0 : .8 });
}
// відступи для fitBounds
const fitOpts = (pad = 40) => ({ paddingTopLeft: [pad + sideW(), pad], paddingBottomRight: [pad, pad + sheetPad()] });
/* ============================================================
   markers.js — піни місць на карті
   ============================================================ */

// «відбиток» стану піна: s = вибраний, f = збережений (щоб перемальовувати лише при зміні)
const pinKey = it => (sel && sel.id === it.id ? 's' : '') + (fav.has(it.id) ? 'f' : '');

const pinIcon = it => L.divIcon({
  className: '', iconSize: [PIN, PIN], iconAnchor: [PIN / 2, PIN / 2],
  html: `<div class="pin${sel && sel.id === it.id ? ' sel' : ''}${fav.has(it.id) ? ' fav' : ''}" style="--d:${it._fresh === false ? 0 : Math.min(it._i || 0, 40) * 25}ms">${ico(it.cat, 16)}</div>`
});

function mk(it) {
  it._k = pinKey(it);
  it.m = L.marker(it.coords, { icon: pinIcon(it), keyboard: false }).bindTooltip(it.name, { direction: 'top', offset: [0, -PIN / 2 - 2] });
  it._fresh = false;
  it.m.on('click', () => select(it.id));
}

function paint(it) {
  const k = pinKey(it);
  if (k !== it._k) { it._k = k; it.m.setIcon(pinIcon(it)); }
  it.m.setZIndexOffset(k.includes('s') ? 1000 : 0);
}

// підсвітити пін при наведенні на рядок списку
function hov(it, on) { const el = it.m.getElement(); el && el.firstChild.classList.toggle('hov', !!on); }
/* ============================================================
   list.js — фільтрація, пошук, відображення списку, «збережене»
   ============================================================ */

// для пошуку: нижній регістр без діакритики (Tarnopol = Tarnópol, żółty ≈ zołty)
const nrm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// переклади рядка (EN/PL) з i18n-dict.js, щоб шукати будь-якою мовою
const alt = s => (s && window.altNames ? window.altNames(s) : []);

function visible() {
  const q = nrm(query.trim());
  const r = items.filter(i => {
    // категорія / відкрито зараз / збережене
    if (filter === 'fav' ? !fav.has(i.id) : filter === 'open' ? openNow(i.hours) !== true : filter !== 'all' && i.cat !== filter) return false;
    // відстань
    if (maxD && dist(i) > maxD) return false;
    // пошук по назві, адресі, кухні, категорії — і в перекладах
    return !q || [
      i.name, i.addr, i.cuisine, CATS[i.cat],
      ...alt(i.name), ...alt(i.addr), ...alt(CATS[i.cat]),
      ...(i.cuisine ? i.cuisine.split(', ').flatMap(alt) : [])
    ].some(s => s && nrm(s).includes(q));
  });
  r.sort(sortBy === 'dist' ? (a, b) => dist(a) - dist(b) : (a, b) => a.name.localeCompare(b.name, 'uk'));
  return r;
}

// лічильник «12 місць» з плавною зміною числа
function setCount(n) {
  const from = shown, t0 = performance.now(), w = n % 10 === 1 && n % 100 !== 11 ? 'місце' : 'місць';
  shown = n;
  (function f(now) {
    const t = reduce ? 1 : Math.min((now - t0) / 450, 1);
    $('count').textContent = Math.round(from + (n - from) * t) + ' ' + w;
    if (t < 1) requestAnimationFrame(f);
  })(t0);
}

function render() {
  const r = visible(), ids = new Set(r.map(i => i.id));

  // піни: показуємо лише відфільтровані
  items.forEach(i => { if (ids.has(i.id)) group.addLayer(i.m); else group.removeLayer(i.m); paint(i); });
  setCount(r.length);
  $('sort').textContent = sortBy === 'dist' ? 'Ближчі' : 'А–Я';

  $('list').innerHTML = r.length
    ? r.slice(0, limit).map((i, k) => `
        <div class="item" data-id="${esc(i.id)}" style="animation-delay:${Math.min(k, 12) * 25}ms" tabindex="0" role="button">
          <div>
            <b>${esc(i.name)}</b>
            <small>${CATS[i.cat]} · ${fmt(dist(i))} · ~${etaMin(i)} хв ${ETA_W[mode]}${hoursState(i.hours) ? ' · ' + stHtml(hoursState(i.hours)) : ''}</small>
          </div>
          <button class="link f" data-f="${esc(i.id)}" type="button" aria-label="Зберегти">${fav.has(i.id) ? '♥' : '♡'}</button>
        </div>`).join('') + (r.length > limit ? '<button class="link empty" id="more" type="button">Показати ще</button>' : '')
    : `<div class="empty">${filter === 'fav' ? 'Збережених місць ще немає — натисніть ♡ біля будь-якого.' : 'Нічого не знайдено.'}</div>`;
}

/* ---------- події списку (делегування) ---------- */
$('list').addEventListener('click', e => {
  const f = e.target.closest('[data-f]');
  if (f) { e.stopPropagation(); toggleFav(f.dataset.f); return; }
  if (e.target.id === 'more') { limit += 40; render(); return; }
  const it = e.target.closest('.item'); if (it) select(it.dataset.id);
});
$('list').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.id) select(e.target.dataset.id); });
$('list').addEventListener('mouseover', e => {
  const el = e.target.closest('.item'), it = el && byId(el.dataset.id);
  if (it && it.m._map) { hov(it, 1); it.m.openTooltip(); }
});
$('list').addEventListener('mouseout', e => {
  const el = e.target.closest('.item'), it = el && byId(el.dataset.id);
  if (it && it.m._map) { hov(it, 0); it.m.closeTooltip(); }
});

/* ---------- збережене ♥ ---------- */
function burst(el) {   // іскри навколо серця
  if (reduce || !el) return;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('i'), a = i / 8 * Math.PI * 2 + Math.random() * .4, r = 18 + Math.random() * 12;
    s.className = 'spark'; s.style.setProperty('--x', Math.cos(a) * r + 'px'); s.style.setProperty('--y', Math.sin(a) * r + 'px');
    s.style.background = i % 2 ? 'var(--accent)' : '#ffb020'; el.appendChild(s); setTimeout(() => s.remove(), 650);
  }
}
function toggleFav(id) {
  const added = !fav.has(id);
  added ? fav.add(id) : fav.delete(id);
  store.set('fav', [...fav]);
  render(); if (sel) renderDetail();
  document.querySelectorAll(`[data-f="${id}"], #fv`).forEach(b => { b.classList.add('pop'); if (added) burst(b); });
}
/* ============================================================
   filters.js — чіпи категорій, чіпи відстані, режим маршруту, пошук, сортування
   ============================================================ */

// хвиля при натисканні на чіп
function rip(b, e) {
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
  const x = e.detail ? e.clientX - r.left : r.width / 2, y = e.detail ? e.clientY - r.top : r.height / 2;
  const s = document.createElement('span'); s.className = 'rip';
  s.style.cssText = `width:${d}px;height:${d}px;left:${x - d / 2}px;top:${y - d / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 600);
}
const bounce = b => { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); };

/* ---------- чіпи категорій ---------- */
[['all', 'Усе'], ['open', 'Відкрито зараз'], ...Object.entries(CATS), ['fav', '♥ Збережене']].forEach(([k, t]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.dataset.k = k;
  b.innerHTML = (IC[k] ? ico(k, 14) + ' ' : '') + t;
  if (k === 'all') b.className = 'active';
  b.onclick = e => {
    rip(b, e); bounce(b);
    filter = k; limit = 40;
    document.querySelectorAll('#chips button[data-k]').forEach(x => x.classList.toggle('active', x === b));
    closeDetail(); render(); $('list').scrollTop = 0;
  };
  $('chips').appendChild(b);
});

/* ---------- чіпи відстані (повторний клік — скинути) ---------- */
[[500, 'до 500 м'], [1000, 'до 1 км'], [2000, 'до 2 км']].forEach(([d, t]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = t; b.dataset.d = d;
  b.onclick = e => {
    rip(b, e); bounce(b);
    maxD = maxD === d ? 0 : d; limit = 40;
    document.querySelectorAll('#chips button[data-d]').forEach(x => x.classList.toggle('active', +x.dataset.d === maxD));
    closeDetail(); render(); $('list').scrollTop = 0;
  };
  $('chips').appendChild(b);
});

/* ---------- режим маршруту (над списком і в картці) ---------- */
function setMode(k) {
  mode = k; store.set('mode', k);
  document.querySelectorAll('#mm [data-gm]').forEach(b => b.classList.toggle('on', b.dataset.gm === k));
}
Object.entries(MODES).forEach(([k, m]) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'link' + (k === mode ? ' on' : ''); b.dataset.gm = k; b.textContent = m[0];
  b.onclick = () => { setMode(k); render(); };
  $('mm').appendChild(b);
});

/* ---------- пошук і сортування ---------- */
$('q').oninput = debounce(e => { query = e.target.value; limit = 40; closeDetail(); render(); }, 120);
$('q').onfocus = () => { if (mq.matches && snap === 'peek') setSheet('half'); };
$('q').addEventListener('keydown', e => { if (e.key === 'Enter') $('q').blur(); });
$('sort').onclick = () => { sortBy = sortBy === 'dist' ? 'name' : 'dist'; render(); };
/* ============================================================
   detail.js — картка вибраного місця
   ============================================================ */

function renderDetail() {
  const it = sel;
  const gm = `https://www.google.com/maps/dir/?api=1&origin=${start[0]},${start[1]}&destination=${it.coords[0]},${it.coords[1]}&travelmode=${MODES[mode][2]}`;
  const st = hoursState(it.hours);

  // рядки «ключ — значення» (порожні пропускаються)
  const rows = [
    ['Адреса', esc(it.addr)],
    ['Кухня', esc(it.cuisine)],
    ['Години', it.hours ? esc(it.hours) + (st == null ? '' : ' · ' + stHtml(st)) : ''],
    ['Телефон', it.phone ? `<a class="link act" href="tel:${esc(String(it.phone).replace(/[^\d+]/g, ''))}">${esc(it.phone)}</a>` : ''],
    ['Сайт', it.web ? `<a class="link act" href="${esc(it.web)}" target="_blank" rel="noopener">${esc(it.web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : '']
  ];
  const kv = rows.filter(r => r[1]).map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
  const rt = $('rt') ? $('rt').textContent : 'Прокладаю маршрут…';   // зберегти текст про маршрут при перемальовуванні

  $('detail').innerHTML = `
    <button class="link" id="back" type="button">← Усі місця</button>
    <h2>${esc(it.name)}</h2>
    <div class="sub">${CATS[it.cat]} · ${fmt(dist(it))} по прямій${it.desc ? ' · добірка' : ''}</div>
    ${it.desc ? `<p>${esc(it.desc)}</p>${it.facts.length ? `<ul>${it.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}` : ''}
    ${kv ? `<dl class="kv">${kv}</dl>` : ''}
    <div class="modes">${Object.entries(MODES).map(([k, m]) => `<button class="link act${k === mode ? ' on' : ''}" data-m="${k}" type="button">${m[0]}</button>`).join('')}</div>
    <div class="sub" id="rt">${esc(rt)}</div>
    <div class="acts">
      <button class="link act" id="fv" type="button">${fav.has(it.id) ? '♥ Збережено' : '♡ Зберегти'}</button>
      <a class="link act" href="${gm}" target="_blank" rel="noopener">Google Maps</a>
      <button class="link act" id="sh" type="button">Поділитись</button>
    </div>`;

  $('back').onclick = closeDetail;
  $('fv').onclick = () => toggleFav(it.id);
  $('sh').onclick = async () => {
    const u = location.href.split('#')[0] + '#p=' + it.id;
    try { if (navigator.share) { await navigator.share({ title: it.name, text: it.name + ' — Аляска, Тернопіль', url: u }); return; } }
    catch (e) { if (e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(u); toast('Посилання скопійовано'); } catch (e) { toast(u); }
  };
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { setMode(b.dataset.m); render(); route(it); renderDetail(); });
}

function closeDetail() {
  if (!sel) return;
  const prev = sel; sel = null; clearRoute(); paint(prev);
  side.classList.remove('open');
  history.replaceState(null, '', location.pathname + location.search);
}

function select(id) {
  const it = byId(id); if (!it) return;
  const prev = sel; sel = it; prev && paint(prev);
  if (!it.m._map) group.addLayer(it.m);
  paint(it);
  side.classList.add('open'); $('detail').scrollTop = 0;
  if (mq.matches && snap !== 'half') setSheet('half');
  history.replaceState(null, '', '#p=' + id);

  $('detail').innerHTML = ''; renderDetail();
  // поступова поява блоків картки
  const d = $('detail');
  [...d.children].forEach((c, i) => c.style.animationDelay = i * 60 + 'ms');
  d.classList.add('enter'); setTimeout(() => d.classList.remove('enter'), 900);

  route(it);
}
/* ============================================================
   route.js — маршрут до місця (OSRM) і його анімація
   ============================================================ */

function clearRoute() {
  token++; clearTimeout(drawTimer);
  [routeGlow, routeLine, routeFlow, walker, pulse].forEach(l => l && map.removeLayer(l));
  routeGlow = routeLine = routeFlow = walker = pulse = null;
  if (routeControl) { map.removeControl(routeControl); routeControl = null; }
}

// крапка, що «йде» по маршруту
function runWalker(c, my) {
  walker = L.marker(c[0], { icon: dotIcon('me'), interactive: false, zIndexOffset: 900 }).addTo(map);
  if (reduce) return walker.setLatLng(c[c.length - 1]);

  const cum = [0];
  for (let i = 1; i < c.length; i++) cum[i] = cum[i - 1] + map.distance(c[i - 1], c[i]);
  const tot = cum[cum.length - 1] || 1, ms = Math.min(6000, Math.max(2000, tot * 4)), t0 = performance.now();
  let s = 1;

  (function f(now) {
    if (my !== token || !walker) return;
    const t = Math.min((now - t0) / ms, 1), d = easeIO(t) * tot;
    while (s < cum.length - 1 && cum[s] < d) s++;
    const k = (d - cum[s - 1]) / ((cum[s] - cum[s - 1]) || 1), a = c[s - 1], b = c[s];
    walker.setLatLng([a.lat + (b.lat - a.lat) * k, a.lng + (b.lng - a.lng) * k]);
    if (t < 1) requestAnimationFrame(f); else arrive(c[c.length - 1], my);
  })(t0);
}

// «бігучі» крапки поверх лінії
function flow(c) {
  routeFlow = L.polyline(c, { color: '#e5484d', weight: 2.5, opacity: .9, dashArray: '1 14', lineCap: 'round', interactive: false, className: 'route-flow' }).addTo(map);
}

// малює лінію маршруту з анімацією «проростання»
function drawRoute(c, my, done) {
  if (my !== token) return;
  routeGlow = L.polyline(c, { color: '#e5484d', weight: coarse ? 14 : 12, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false, className: 'route-glow' }).addTo(map);
  routeLine = L.polyline(c, { color: '#111', weight: coarse ? 5 : 4, opacity: .85, lineCap: 'round', lineJoin: 'round', className: 'route-line' }).addTo(map);

  const p = routeLine.getElement();
  if (reduce || !p || !p.getTotalLength) { flow(c); return done(); }
  const len = p.getTotalLength();
  p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.getBoundingClientRect();
  p.style.transition = 'stroke-dashoffset 1s ease-in-out'; p.style.strokeDashoffset = 0;
  p.addEventListener('transitionend', () => { p.style.strokeDasharray = 'none'; if (my === token) flow(c); done(); }, { once: true });
}

// текст про маршрут у картці
function say(t) {
  const el = $('rt'); if (!el) return;
  el.textContent = t; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
}

// «сплеск» у кінці маршруту
function arrive(ll, my) {
  if (my !== token) return;
  const m = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="arrive"></div>', iconSize: [0, 0] }), interactive: false }).addTo(map);
  setTimeout(() => map.removeLayer(m), 1300);
}

function route(it) {
  clearRoute(); const my = token;
  pulse = L.marker(it.coords, { icon: L.divIcon({ className: '', html: '<div class="pulse"></div>', iconSize: [0, 0] }), interactive: false }).addTo(map);
  focusOn(it.coords, Math.max(map.getZoom(), 16));
  say('Прокладаю маршрут…');

  routeControl = L.Routing.control({
    waypoints: [L.latLng(start), L.latLng(it.coords)],
    router: L.Routing.osrmv1({ serviceUrl: `https://routing.openstreetmap.de/${MODES[mode][1]}/route/v1` }),
    addWaypoints: false, draggableWaypoints: false, fitSelectedRoutes: false, show: false, createMarker: () => null,
    lineOptions: { styles: [{ opacity: 0, weight: 1 }] }
  }).on('routesfound', e => {
    if (my !== token) return;
    const r = e.routes[0];
    map.flyToBounds(L.latLngBounds(r.coordinates).extend(it.coords), { ...fitOpts(40), duration: reduce ? 0 : 1.2, maxZoom: 17 });

    let drawn = false;
    const go = () => { if (drawn || my !== token) return; drawn = true; drawRoute(r.coordinates, my, () => my === token && runWalker(r.coordinates, my)); };
    map.once('moveend', go); drawTimer = setTimeout(go, 1500);

    say(`${MODES[mode][0]}: ${(r.summary.totalDistance / 1000).toFixed(1)} км, ${Math.max(1, Math.round(r.summary.totalTime / 60))} хв`);
  }).on('routingerror', () => say(navigator.onLine ? 'Не вдалося прокласти маршрут. Спробуйте ще раз.' : 'Немає з\'єднання з інтернетом.')).addTo(map);
}
/* ============================================================
   geolocate.js — «Моя позиція», «Моя позиція як старт», «До району»
   ============================================================ */

function locate(asStart) {
  if (!navigator.geolocation) return toast('Геолокація недоступна в цьому браузері');
  const btns = [$('loc'), $('me')]; btns.forEach(b => b.setAttribute('data-busy', ''));

  navigator.geolocation.getCurrentPosition(p => {
    btns.forEach(b => b.removeAttribute('data-busy'));
    const ll = [p.coords.latitude, p.coords.longitude];
    if (!userMarker) userMarker = L.marker(ll, { icon: dotIcon('user'), interactive: false, zIndexOffset: 800 }).addTo(map);
    else userMarker.setLatLng(ll);

    if (asStart) {
      userStart = true; start = ll; startMarker.setLatLng(start);
      render(); sel ? (renderDetail(), route(sel)) : focusOn(ll, 16);
      toast('Старт — ваша позиція');
    } else focusOn(ll, 16);
  }, err => {
    btns.forEach(b => b.removeAttribute('data-busy'));
    toast(err.code === 1 ? 'Дозвольте доступ до геолокації в налаштуваннях браузера' : 'Не вдалося визначити позицію');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
}

$('me').onclick = () => locate(true);
$('loc').onclick = () => locate(false);
$('home').onclick = () => {
  if (areaBounds) map.flyToBounds(areaBounds, { ...fitOpts(30), duration: reduce ? 0 : 1 });
  else focusOn(CENTER, 15);
};
/* ============================================================
   extras.js — «Здивуй мене», гарячі клавіші, мережа, посилання #p=…
   ============================================================ */

// «Здивуй мене»: рулетка по відфільтрованих місцях
$('rnd').onclick = () => {
  const r = visible(); if (!r.length || spinning) return;
  const pick = r[Math.floor(Math.random() * r.length)];
  if (reduce || r.length < 3) return select(pick.id);

  spinning = true; closeDetail(); $('rnd').classList.add('spin');
  let prev = null, n = 0;
  (function step() {
    if (prev && prev.m._map) { hov(prev, 0); prev.m.closeTooltip(); }
    if (n++ >= 12) { spinning = false; $('rnd').classList.remove('spin'); select(pick.id); return; }
    prev = r[Math.floor(Math.random() * r.length)]; hov(prev, 1); prev.m.openTooltip();
    setTimeout(step, 50 + n * 14);
  })();
};

// клавіші: «/» — пошук, Esc — закрити картку
addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== $('q')) { e.preventDefault(); closeDetail(); $('q').focus(); }
  else if (e.key === 'Escape') { sel ? closeDetail() : $('q').blur(); }
});

// мережа
addEventListener('offline', () => toast('Немає з\'єднання з інтернетом'));
addEventListener('online', () => toast('З\'єднання відновлено'));

// відкриття місця за посиланням (#p=id)
addEventListener('hashchange', () => {
  const h = location.hash.match(/p=([\w-]+)/);
  if (h && byId(h[1]) && (!sel || sel.id !== h[1])) select(h[1]);
});
/* ============================================================
   osm.js — дані з OpenStreetMap (Overpass): місця та межі району
   ============================================================ */

function catOf(t) {
  if (t.amenity === 'restaurant' || t.amenity === 'fast_food') return 'eat';
  if (t.amenity === 'cafe') return 'cafe';
  if (t.amenity === 'bar' || t.amenity === 'pub') return 'bar';
  if (t.leisure === 'park' || t.leisure === 'garden') return 'walk';
  if (t.shop) return 'shop';
  return 'see';
}

// елемент OSM → наш формат місця
function fromOSM(e) {
  const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon, name = t['name:uk'] || t.name;
  if (!name || lat == null) return null;
  const street = t['addr:street'] ? t['addr:street'] + (t['addr:housenumber'] ? ', ' + t['addr:housenumber'] : '') : '';
  let web = t.website || t['contact:website'] || ''; if (!/^https?:\/\//i.test(web)) web = '';
  return {
    id: e.type[0] + e.id, name, cat: catOf(t), coords: [lat, lon], addr: street,
    hours: t.opening_hours, phone: t.phone || t['contact:phone'], web,
    cuisine: t.cuisine && t.cuisine.replace(/[;_]/g, ', ')
  };
}

// склеює добірку з даними OSM і перемальовує все
function setItems(osm) {
  // добірка: за потреби підтягуємо точні координати з OSM
  const cur = CURATED.map(c => {
    const o = c.snap && osm.find(x => c.snap.test(x.name) && map.distance(x.coords, c.coords) < 3000);
    return { ...c, coords: o ? o.coords : c.coords };
  });
  // з OSM прибираємо дублікати добірки (поруч і та сама категорія/назва)
  const rest = osm.filter(o => !cur.some(c => map.distance(c.coords, o.coords) < 60 && (c.cat === o.cat || o.name.toLowerCase().includes(c.name.split(' ').pop().toLowerCase()))));

  items.forEach(i => i.m && group.removeLayer(i.m));
  items = [...cur, ...rest];
  items.forEach((it, i) => { it._i = i; mk(it); });

  if (sel) { const s2 = byId(sel.id); if (s2) sel = s2; else { sel = null; side.classList.remove('open'); clearRoute(); } }
  render(); if (sel) paint(sel);

  const h = location.hash.match(/p=([\w-]+)/); if (h && byId(h[1]) && !sel) select(h[1]);
}

// запит до Overpass із перебором дзеркал
async function ovp(q) {
  let err;
  for (const u of OVPS) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 20000);
    try {
      const r = await fetch(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), signal: ac.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { err = e; } finally { clearTimeout(t); }
  }
  throw err;
}

// пунктирна межа району
async function loadBoundary() {
  try {
    let ways = cache.get('osm-bound-v3', 30 * 864e5);
    if (!ways) {
      const j = await ovp(`[out:json][timeout:25];rel(id:${AREAS});out geom;`);
      ways = j.elements.flatMap(rel => (rel.members || []).filter(m => m.type === 'way' && m.geometry).map(m => m.geometry.map(g => [g.lat, g.lon])));
      if (ways.length) cache.set('osm-bound-v3', ways);
    }
    if (!ways.length) return;
    ways.forEach(w => L.polyline(w, { color: '#e5484d', weight: 2, dashArray: '6 6', interactive: false }).addTo(map));
    areaBounds = L.latLngBounds(ways.flat());
    if (!userStart) { const c = areaBounds.getCenter(); start = [c.lat, c.lng]; startMarker.setLatLng(start); render(); }
    if (!sel) map.flyToBounds(areaBounds, { ...fitOpts(30), duration: reduce ? 0 : 1.4 });
  } catch (e) {}
}

// Що завантажувати з OSM: заклади, парки, туризм, історія, магазини
const Q = `[out:json][timeout:25];rel(id:${AREAS});map_to_area->.a;(` +
  `nwr[amenity~"^(restaurant|fast_food|cafe|bar|pub)$"][name](area.a);` +
  `nwr[leisure~"^(park|garden)$"][name](area.a);` +
  `nwr[tourism~"^(museum|gallery|attraction|viewpoint)$"][name](area.a);` +
  `nwr[historic~"^(castle|monument|ruins|fort|archaeological_site|building)$"][name](area.a);` +
  `nwr[shop~"^(supermarket|mall|convenience|bakery|department_store)$"][name](area.a););out center tags 600;`;

async function loadPlaces() {
  $('count').textContent = 'Завантажую місця…';
  if (!$('load')) { const l = document.createElement('div'); l.id = 'load'; document.querySelector('header').after(l); }

  let data = cache.get('osm-aliaska-v3', 12 * 36e5);   // кеш на 12 год
  if (!data) {
    try { data = (await ovp(Q)).elements; cache.set('osm-aliaska-v3', data); }
    catch (e) {
      $('load') && $('load').remove(); shown = 0;
      $('count').innerHTML = 'Не вдалося завантажити місця. <button class="link" id="retry" type="button">Повторити</button>';
      $('retry').onclick = loadPlaces; return;
    }
  }
  $('load') && $('load').remove();
  setItems(data.map(fromOSM).filter(Boolean));
}
/* ============================================================
   main.js — запуск (підключається ПЕРЕД i18n.js)
   ============================================================ */

// іконки в кнопках з data-ic
document.querySelectorAll('[data-ic]').forEach(el => el.innerHTML = ico(el.dataset.ic, 20));

// тема: збережена або системна
setTheme(store.get('dark', matchMedia('(prefers-color-scheme: dark)').matches));

// панель на телефоні — на пів екрана
setSheet('half', true);

// спочатку показуємо добірку, потім догружаємо OSM і межі району
setItems([]);
loadPlaces().then(loadBoundary);
/* ============================================================
   i18n.js — рушій перекладу UA / EN / PL (підключається ОСТАННІМ).
   Переклади — у i18n-dict.js. Тут нічого міняти не потрібно.
   Працює так: проходить по всіх текстових вузлах і атрибутах,
   зберігає оригінал і підставляє переклад зі словника.
   ============================================================ */
(() => {
  const D = Object.fromEntries(I18N_RULES.map(r => [r[0], [r[1], r[2]]]));
  window.altNames = s => D[s] || [];   // використовується пошуком (list.js)

  const NAMES = { uk: 'Українська', en: 'English', pl: 'Polski' }, ORDER = ['uk', 'en', 'pl'], CODE = { uk: 'UA', en: 'EN', pl: 'PL' };
  const ETA = { 'пішки': ['on foot', 'pieszo'], 'на велосипеді': ['by bike', 'rowerem'], 'авто': ['by car', 'autem'] };
  let lang = 'uk';
  const ix = () => lang === 'en' ? 0 : 1, WS = /^(\s*)([\s\S]*?)(\s*)$/, CY = "а-яіїєґ'";
  const plPl = n => n === 1 ? 'miejsce' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'miejsca' : 'miejsc';

  // переклад одного фрагмента (між «·»)
  function part(p, i) {
    const m = p.match(WS), pre = m[1], core = m[2], post = m[3];
    if (!core) return p;
    if (D[core]) return pre + D[core][i] + post;

    const c = core.match(/^(\d+) (?:місце|місць)$/);
    if (c) { const n = +c[1]; return pre + n + ' ' + (i ? plPl(n) : n === 1 ? 'place' : 'places') + post; }

    let x = core
      .replace(/^зачиняється через /, i ? 'zamyka się za ' : 'closes in ')
      .replace(/^відкриється через /, i ? 'otwiera się za ' : 'opens in ')
      .replace(/~(\d+) хв (пішки|на велосипеді|авто)/, (_, n, w) => '~' + n + ' min ' + ETA[w][i])
      .replace(new RegExp('(\\d+) год(?![' + CY + '])', 'g'), '$1 h')
      .replace(new RegExp('(\\d+(?:\\.\\d+)?) км(?![' + CY + '])', 'g'), '$1 km')
      .replace(new RegExp('(\\d+) м(?![' + CY + '²])', 'g'), '$1 m')
      .replace(new RegExp('(\\d+) хв(?![' + CY + '])', 'g'), '$1 min')
      .replace(/ по прямій/, i ? ' w linii prostej' : ' as the crow flies')
      .replace(/щодня/, i ? 'codziennie' : 'daily')
      .replace(/^(Пішки|Велосипед|Авто): /, (_, w) => D[w][i] + ': ');
    if (x !== core) return pre + x + post;

    // «італійська, піца» → переклад по словах
    if (core.includes(', ')) { const ps = core.split(', '); if (ps.every(q => D[q])) return pre + ps.map(q => D[q][i]).join(', ') + post; }
    return p;
  }
  function translate(s) {
    if (lang === 'uk' || !s) return s;
    const core = s.match(WS)[2]; if (!core) return s;
    if (D[core] || !core.includes('·')) return part(s, ix());
    return s.split('·').map(x => part(x, ix())).join('·');
  }

  /* текстові вузли та атрибути: зберігаємо оригінал, щоб можна було перемикати мову туди-сюди */
  const tm = new WeakMap(), am = new WeakMap(), AT = ['placeholder', 'aria-label', 'title'];
  function doText(n) {
    const p = n.parentNode; if (!p || /^(SCRIPT|STYLE)$/.test(p.nodeName)) return;
    const e = tm.get(n), src = e && e.out === n.data ? e.src : n.data, out = translate(src);
    if (out !== n.data) n.data = out;
    tm.set(n, { src, out });
  }
  function doAttrs(el) {
    for (const a of AT) {
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      const v = el.getAttribute(a), rec = am.get(el) || {}, e = rec[a], src = e && e.out === v ? e.src : v, out = translate(src);
      if (out !== v) el.setAttribute(a, out);
      rec[a] = { src, out }; am.set(el, rec);
    }
  }
  function walk(n) {
    if (n.nodeType === 3) return doText(n);
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(n.nodeName)) return;
    doAttrs(n); n.childNodes.forEach(walk);
  }
  // стежимо за змінами DOM, щоб новий контент теж перекладався
  new MutationObserver(rs => rs.forEach(r => {
    if (r.type === 'characterData') doText(r.target);
    else if (r.type === 'attributes') doAttrs(r.target);
    else r.addedNodes.forEach(walk);
  })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: AT });

  const meta = document.querySelector('meta[name=description]'), T0 = document.title, M0 = meta ? meta.content : '', btn = document.getElementById('lang');
  function head() {
    document.title = translate(T0); if (meta) meta.content = translate(M0);
    document.documentElement.lang = lang;
    btn.textContent = CODE[lang]; btn.title = NAMES[lang];
  }
  function setLang(l) {
    lang = 'uk'; walk(document.body);                        // повертаємо оригінал (українська)
    if (typeof sel !== 'undefined' && sel) renderDetail();   // перебудовуємо відкриту картку з оригінального тексту
    lang = l; walk(document.body); head();
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  btn.onclick = () => setLang(ORDER[(ORDER.indexOf(lang) + 1) % 3]);

  // початкова мова: збережена → мова браузера → українська
  let saved = null; try { saved = localStorage.getItem('lang'); } catch (e) {}
  const nav = (navigator.language || 'uk').slice(0, 2);
  const init = ORDER.includes(saved) ? saved : ORDER.includes(nav) ? nav : 'uk';
  if (init !== 'uk') setLang(init); else head();
})();
