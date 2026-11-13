/* swarm-intro.js: a swarm of cursors rebuilds the page when it loads.
   Original code written for this portfolio (not copied from any extension). */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  history.scrollRestoration = 'manual'; scrollTo(0, 0);

  // Text blocks get "typed"; box blocks get "drawn". Targets must not nest.
  const TEXT = '.hero-title .l,.hero-sub,.sec-no,.sec-title,.contact-title,.contact-label';
  const BOX = 'nav.top,.hero-meta,.hero-cta .btn,.stat,.marquee,.exp,.skill,.proj,.edu,.cert,.contact-links a,footer';
  const PEOPLE = [['Architect','#b5532a'],['Analyst','#2f6fed'],['Explorer','#1f9d6b'],['Engineer','#d6336c'],['Strategist','#7c4dff'],['Optimizer','#c58a00']];

  const css = document.createElement('style');
  css.textContent = `
  .sw-h{opacity:0!important}
  .sw-h.sw-go{opacity:1!important;transition:opacity .7s ease!important}
  #sw{position:absolute;left:0;top:0;width:100%;height:0;z-index:9500;pointer-events:none;overflow:visible}
  .sw-c{position:absolute;left:0;top:0;will-change:transform}
  .sw-c svg{display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.25))}
  .sw-c b{position:absolute;left:14px;top:18px;font:500 10px/1 'JetBrains Mono',monospace;color:#fff;padding:3px 7px;border-radius:99px;white-space:nowrap}
  .sw-b{position:absolute;border:1px solid;box-sizing:border-box}
  .sw-b i{position:absolute;right:0;top:100%;margin-top:4px;font:500 10px/1 'JetBrains Mono',monospace;font-style:normal;color:#fff;padding:3px 6px;border-radius:3px;white-space:nowrap}
  .sw-k{position:absolute;width:2px;animation:swk .9s steps(1) infinite}
  @keyframes swk{50%{opacity:0}}
  #sw-skip{position:fixed;right:1.25rem;bottom:1.25rem;z-index:9600;font:500 .7rem 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;padding:.55rem 1rem;border:1px solid #141414;border-radius:999px;background:#f4f1ea;color:#141414;cursor:pointer}`;
  document.head.appendChild(css);

  // Hide everything up front (the existing curtain covers the page meanwhile).
  document.querySelectorAll('.r').forEach(e => e.classList.add('in'));
  const queue = [];
  [[TEXT, 1], [BOX, 0]].forEach(([s, type]) => document.querySelectorAll(s).forEach(e => queue.push({ e, type })));
  queue.forEach(t => {
    const r = t.e.getBoundingClientRect();
    t.y = r.top + scrollY; t.x = r.left; t.e.classList.add('sw-h');
  });
  queue.sort((a, b) => a.y - b.y || a.x - b.x);
  const drift = document.querySelector('.drift'); if (drift) drift.classList.add('sw-h');

  const ov = document.createElement('div'); ov.id = 'sw'; document.body.appendChild(ov);
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  let finished = false, dead = false, backlog = 0, left = queue.length, skipBtn;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const spd = () => Math.min(3.5, 1 + backlog / 5);          // swarm speeds up when you scroll ahead of it
  const tween = (ms, fn) => new Promise(res => {
    const s = performance.now(), d = ms / spd();
    (function f(t) { if (dead) return res(); const p = Math.min(1, (t - s) / d); fn(p); p < 1 ? requestAnimationFrame(f) : res(); })(s);
  });

  function mk([name, color]) {
    const el = document.createElement('div'); el.className = 'sw-c';
    el.innerHTML = `<svg width="18" height="22" viewBox="0 0 18 22"><path d="M1 1L1 17L5.6 12.8L8.8 20L11.8 18.6L8.6 11.6L15 11.4Z" fill="${color}" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg><b style="background:${color}">${name}</b>`;
    ov.appendChild(el);
    const c = { color, x: innerWidth / 2 + (Math.random() - .5) * 240, y: innerHeight / 2 + (Math.random() - .5) * 120 };
    c.set = (x, y) => { c.x = x; c.y = y; el.style.transform = `translate3d(${x}px,${y}px,0)`; };
    c.go = (x, y, ms) => {                                      // curved walk, not a straight line
      const x0 = c.x, y0 = c.y, cx = (x0 + x) / 2 + (Math.random() - .5) * 120, cy = (y0 + y) / 2 + (Math.random() - .5) * 120;
      return tween(ms, p => { const t = ease(p), u = 1 - t; c.set(u*u*x0 + 2*u*t*cx + t*t*x, u*u*y0 + 2*u*t*cy + t*t*y); });
    };
    c.set(c.x, c.y);
    return c;
  }
  const cursors = PEOPLE.slice(0, innerWidth < 780 ? 4 : 6).map(mk);

  function box(c, x, y) {
    const b = document.createElement('div'); b.className = 'sw-b';
    b.style.cssText = `left:${x}px;top:${y}px;border-color:${c.color};background:${c.color}14`;
    b.innerHTML = `<i style="background:${c.color}"></i>`; ov.appendChild(b); return b;
  }

  async function build(c, t) {
    const e = t.e, r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const x0 = r.left + scrollX, y0 = r.top + (cs.position === 'fixed' ? 0 : scrollY);
    let T = r;
    if (t.type) { const g = document.createRange(); g.selectNodeContents(e); const q = g.getBoundingClientRect(); if (q.width) T = q; }
    const x = T.left + scrollX, y = y0 + (T.top - r.top), w = T.width, h = T.height;
    await c.go(x - 6, y - 6, 700);                              // walk to the corner
    const b = box(c, x, y);
    await tween(250 + Math.min(650, (w + h) * .7), p => {       // crosshair drag with live W x H badge
      const k = ease(p); b.style.width = w * k + 'px'; b.style.height = h * k + 'px';
      b.firstChild.textContent = `${Math.round(w * k)} × ${Math.round(h * k)}`;
      c.set(x + w * k, y + h * k);
    });
    if (t.type) {                                               // type the text in, row by row
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      const rows = Math.max(1, Math.round(h / lh)), ox = T.left - r.left, oy = T.top - r.top;
      const k = document.createElement('div'); k.className = 'sw-k'; k.style.cssText = `background:${c.color};height:${lh}px`; ov.appendChild(k);
      e.style.clipPath = 'inset(0 0 100% 0)'; e.classList.remove('sw-h');
      await tween(300 + Math.min(1500, w * rows * .6), p => {
        const q = p * rows, row = Math.min(rows - 1, Math.floor(q)), edge = ox + w * (q - row);
        const a = oy + row * lh, z = row === rows - 1 ? r.height + 8 : a + lh;
        e.style.clipPath = `polygon(-8px -8px,calc(100% + 8px) -8px,calc(100% + 8px) ${a}px,${edge}px ${a}px,${edge}px ${z}px,-8px ${z}px)`;
        k.style.left = x0 + edge + 'px'; k.style.top = y0 + a + 'px';
        c.set(x0 + edge + 4, y0 + a + lh * .8);
      });
      e.style.clipPath = ''; k.remove();
    } else {                                                    // release the mouse: real element fades in
      e.classList.add('sw-go'); await sleep(200 / spd());
      setTimeout(() => e.classList.remove('sw-h', 'sw-go'), 800);
    }
    b.style.transition = 'opacity .4s'; b.style.opacity = 0; setTimeout(() => b.remove(), 450);
  }

  function next() {                                             // only build what is near the viewport
    const a = queue.filter(t => !t.taken && t.e.getBoundingClientRect().top < innerHeight * 1.1);
    backlog = a.length;
    return a.find(t => t.e.getBoundingClientRect().bottom > 0) || a[0];
  }

  async function run(c, i) {
    await sleep(i * 200);
    while (!finished && !dead) {
      const t = next();
      if (!t) { await c.go(mouse.x + scrollX + (Math.random() - .5) * 200, mouse.y + scrollY + (Math.random() - .5) * 200, 1200); continue; }
      t.taken = true; await build(c, t);
      if (--left === 0) finish();
    }
  }

  function finish() {                                           // flock to the mouse, then fade away
    finished = true;
    setTimeout(() => cursors.forEach((c, i) => c.go(mouse.x + scrollX + Math.cos(i * 1.05) * 56, mouse.y + scrollY + Math.sin(i * 1.05) * 56, 900)), 1300);
    setTimeout(() => { ov.style.transition = 'opacity .8s'; ov.style.opacity = 0; setTimeout(() => ov.remove(), 900); skipBtn.remove(); }, 3300);
  }

  function skip() {
    dead = true;
    queue.forEach(t => { t.e.style.clipPath = ''; t.e.classList.remove('sw-h', 'sw-go'); });
    if (drift) drift.classList.remove('sw-h', 'sw-go');
    ov.remove(); skipBtn.remove();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && !dead) skip(); });

  function start() {
    skipBtn = document.createElement('button'); skipBtn.id = 'sw-skip'; skipBtn.textContent = 'Skip intro';
    skipBtn.onclick = skip; document.body.appendChild(skipBtn);
    cursors.forEach(run);
    if (drift) setTimeout(() => { drift.classList.add('sw-go'); setTimeout(() => drift.classList.remove('sw-h', 'sw-go'), 800); }, 2000);
  }

  // Begin once the existing curtain lifts.
  const curtain = document.getElementById('curtain');
  if (curtain) new MutationObserver((m, o) => {
    if (curtain.classList.contains('up')) { o.disconnect(); setTimeout(start, 500); }
  }).observe(curtain, { attributes: true });
  else start();
})();
