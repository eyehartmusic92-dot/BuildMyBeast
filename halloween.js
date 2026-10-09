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
    @media(max-width:850px){.halloween-spotlight{grid-template-columns:1fr;padding:18px}.bmb-halloween .visual{background-position:70% center}}
    @media print{.halloween-spotlight{display:none}}
  `;
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
    }
  }
  sync();
  // Also restore the original on a page left open across the cutoff.
  setInterval(sync, 60000);
  document.addEventListener('visibilitychange', sync);
})();
