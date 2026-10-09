/* Seasonal overlay: original homepage content is restored after Halloween. */
(() => {
  const start = Date.parse('2026-10-01T00:00:00-05:00');
  const end = Date.parse('2026-11-01T00:00:00-05:00');
  const original = [];
  let active = false;
  const style = document.createElement('style');
  style.textContent = `
    html.bmb-halloween{--hot:#f97721;--hot2:#ffad68;--line:#493247}
    .bmb-halloween body{background:radial-gradient(ellipse at top right,#311837 0,transparent 55%),var(--bg)}
    .bmb-halloween .hero{border-bottom:1px solid #623248}
    .bmb-halloween .visual{background-image:url('assets/halloween-nova-2026.webp');background-position:72% center;border-color:#a85e2c;box-shadow:0 20px 80px #72257c33}
    .bmb-halloween .hero h1{color:#ffad68;text-shadow:0 3px 25px #c95e2033}
    .halloween-spotlight{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;border:1px solid #7a4234;border-radius:18px;padding:24px;margin-bottom:24px;background:linear-gradient(135deg,#231024,#18110c)}
    .halloween-spotlight img{width:100%;height:auto;border-radius:12px;display:block}
    .halloween-spotlight p{color:var(--muted);line-height:1.6}
    .bmb-halloween body{isolation:isolate}
    .halloween-atmosphere{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;contain:strict}
    .halloween-fog{position:absolute;left:-25%;bottom:-10%;width:150%;height:42%;background:radial-gradient(ellipse at 30% 80%,#ae7ac51a,transparent 60%),radial-gradient(ellipse at 70% 60%,#ff8b551c,transparent 55%);animation:bmb-fog 28s ease-in-out infinite alternate}
    .halloween-fog.fog-back{bottom:15%;opacity:.6;animation-duration:37s;animation-delay:-15s}
    .halloween-ember{position:absolute;left:var(--x);bottom:-12px;width:3px;height:3px;border-radius:50%;background:#ffa35b;box-shadow:0 0 8px #ff6b22;animation:bmb-ember var(--duration) linear infinite;animation-delay:var(--delay)}
    .halloween-bat{position:absolute;left:-90px;top:var(--y);width:48px;height:24px;color:#b392bb;opacity:.28;animation:bmb-bat var(--duration) linear infinite;animation-delay:var(--delay)}
    .halloween-bat svg{display:block;width:100%;height:100%;animation:bmb-flap .7s ease-in-out infinite alternate}
    .halloween-witch{position:absolute;right:3.5%;top:100px;width:clamp(100px,12vw,205px);height:auto;color:#100b16;filter:drop-shadow(0 0 12px #b57dcc33);opacity:.85;animation:bmb-witch 14s ease-in-out infinite}
    .halloween-witch svg{display:block;width:100%;height:auto}
    @keyframes bmb-witch{0%,100%{transform:translate3d(0,0,0) rotate(-5deg)}50%{transform:translate3d(-30px,18px,0) rotate(3deg)}}
    @media(max-width:850px){.halloween-witch{right:12px;top:85px;width:95px;opacity:.65}}
    @keyframes bmb-fog{from{transform:translate3d(-5%,0,0)}to{transform:translate3d(8%,-8%,0)}}
    @keyframes bmb-ember{0%{transform:translate3d(0,0,0);opacity:0}10%{opacity:.55}80%{opacity:.35}100%{transform:translate3d(55px,-105vh,0);opacity:0}}
    @keyframes bmb-bat{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(55vw,-35px,0)}100%{transform:translate3d(calc(100vw + 180px),15px,0)}}
    @keyframes bmb-flap{from{transform:scaleY(.6)}to{transform:scaleY(1)}}
    .bmb-halloween.bmb-motion-paused .halloween-atmosphere *{animation-play-state:paused!important}
    @media(max-width:850px){.halloween-ember:nth-of-type(n+9),.halloween-bat:last-child{display:none}}
    @media(prefers-reduced-motion:reduce){.halloween-atmosphere{display:none}}
    @media(max-width:850px){.halloween-spotlight{grid-template-columns:1fr;padding:18px}.bmb-halloween .visual{background-position:70% center}}
    @media print{.halloween-spotlight,.halloween-atmosphere{display:none}}
  `;
  const atmosphere = document.createElement('div');
  atmosphere.className = 'halloween-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = '<div class="halloween-fog"></div><div class="halloween-fog fog-back"></div>' +
    Array.from({length:12}, (_, i) => `<span class="halloween-ember" style="--x:${(i * 37 + 7) % 100}%;--duration:${18 + i % 5 * 3}s;--delay:-${i * 4}s"></span>`).join('') +
    Array.from({length:3}, (_, i) => `<span class="halloween-bat" style="--y:${12 + i * 25}%;--duration:${32 + i * 9}s;--delay:-${i * 13}s"><svg viewBox="0 0 80 40" fill="currentColor" focusable="false"><path d="M40 16 35 9 34 18C24 8 13 5 2 4L10 25 19 20 25 31 33 27 40 37 47 27 55 31 61 20 70 25 78 4C67 5 56 8 46 18L45 9Z"/></svg></span>`).join('') +
    `<span class="halloween-witch"><svg viewBox="0 0 220 140" fill="currentColor" focusable="false"><g transform="rotate(-10 110 100)"><path d="M18 104 205 104 205 110 18 110Z"/><path d="M19 102 0 88 4 104 0 120 22 113 44 111 44 103Z"/><path d="M18 95 34 103 13 99ZM13 118 34 110 19 115Z"/><path d="M91 46 119 10 119 37 134 49 151 55 79 55Z"/><path d="M108 53C104 62 108 72 118 72L126 68 138 66 128 61 127 54Z"/><path d="M110 58C91 57 99 71 79 78 99 79 111 73 113 65Z"/><path d="M111 71C94 71 92 85 75 95L53 101 115 101 121 89 136 94 146 109 156 110 145 85 125 78Z"/><path d="M119 73 137 79 157 88 174 87 175 93 154 94 133 86 115 84Z"/><path d="M111 94 120 113 143 117 151 113 133 108 128 94Z"/></g></svg></span>`;
  const spotlight = document.createElement('article');
  spotlight.className = 'halloween-spotlight';
  spotlight.innerHTML = `<div><div class="eyebrow">🎃 October spotlight · Halloween concept</div><h3>Monster Builds</h3><p>A purple ’68 Chevy Nova with blood-splatter paint, glowing headlights, pumpkins and fog. What would your Halloween getaway vehicle look like?</p><div class="actions"><a class="btn" href="#builder">Plan Your Monster Build</a><a class="btn ghost" href="#submitBuild">Submit Your Real Ride</a></div><p class="mini">AI concept artwork inspired by a model car. Member photos below are reviewed before publication.</p></div><img src="assets/halloween-nova-2026.webp" alt="Halloween concept of a purple 1968 two-door Chevrolet Nova with red splatter paint and glowing pumpkins" loading="lazy" width="1672" height="941">`;
  function replace(selector, content, attribute) {
    const node = document.querySelector(selector);
    if (!node) return;
    original.push(() => attribute ? node.setAttribute(attribute, content.before) : node.innerHTML = content.before);
    content.before = attribute ? node.getAttribute(attribute) : node.innerHTML;
    if (attribute) node.setAttribute(attribute, content.after);
    else node.innerHTML = content.after;
  }
  function sync() {
    const now = Date.now();
    const enabled = now >= start && now < end;
    if (enabled === active) return;
    active = enabled;
    document.documentElement.classList.toggle('bmb-halloween', enabled);
    if (enabled) {
      document.head.append(style);
      document.body.prepend(atmosphere);
      replace('.hero .eyebrow', {after:'🎃 Build My Beast · Halloween Edition'});
      replace('.hero h1', {after:'UNLEASH<br>THE MONSTER.'});
      replace('.hero p', {after:'Build something wicked. Plan your upgrades, estimate your budget, and research parts for your Halloween getaway vehicle—or your next everyday beast.'});
      replace('.hero .visualtag', {after:'1968 CHEVY NOVA // HALLOWEEN CONCEPT'});
      replace('.hero .visual', {after:'Halloween concept: purple 1968 Chevrolet Nova with red splatter paint, glowing headlights, fog and pumpkins'}, 'aria-label');
      const gallery = document.querySelector('#gallery');
      if (gallery) gallery.insertBefore(spotlight, gallery.querySelector('.head')?.nextSibling || null);
    } else {
      original.splice(0).reverse().forEach(restore => restore());
      style.remove();
      spotlight.remove();
      atmosphere.remove();
    }
  }
  sync();
  // Also restore the original on a page left open across the cutoff.
  setInterval(sync, 60000);
  function visibility() {
    document.documentElement.classList.toggle('bmb-motion-paused', document.hidden);
    sync();
  }
  visibility();
  document.addEventListener('visibilitychange', visibility);
})();
