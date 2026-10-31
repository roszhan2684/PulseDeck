// Walkthrough controller: steps drive the embedded app through the web bridge
// (src/features/demo/webBridge.ts) and the app reports its route back.
const frame = document.getElementById('app');
const steps = [...document.querySelectorAll('#steps button')];
const playBtn = document.getElementById('tour-play');
const wrap = document.getElementById('phone-wrap');
const loading = document.getElementById('loading');
let ready = false;
let tour = null;

function fitPhone() {
  const col = wrap.parentElement.getBoundingClientRect().width || window.innerWidth;
  const byHeight = (window.innerHeight - 140) / 892;
  const byWidth = Math.min(col, window.innerWidth - 32) / 433;
  const s = Math.max(0.55, Math.min(1, byWidth, window.innerWidth > 1080 ? byHeight : 1));
  wrap.style.setProperty('--s', s.toFixed(3));
}
fitPhone();
window.addEventListener('resize', fitPhone);

function go(btn) {
  if (btn.dataset.flow === 'onboarding') {
    // Fresh app instance that starts as a brand-new user.
    ready = false;
    loading.classList.remove('hidden');
    frame.src = '/demo/?flow=onboarding&r=' + Date.now();
    return setActive(btn);
  }
  if (!ready) return;
  frame.contentWindow.postMessage({ type: 'pulsedeck:navigate', href: btn.dataset.href }, location.origin);
  setActive(btn);
}

function setActive(btn) {
  steps.forEach((b) => b.classList.toggle('active', b === btn));
}

steps.forEach((btn) =>
  btn.addEventListener('click', () => {
    stopTour();
    go(btn);
    if (window.innerWidth <= 1080) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }),
);

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'pulsedeck:route') return;
  if (!ready) {
    ready = true;
    loading.classList.add('hidden');
    // Shareable deep links into the tour: /#step-2 opens the swipe deck.
    const n = Number(location.hash.match(/^#step-(\d)/)?.[1]);
    if (steps[n - 1] && !/flow=onboarding/.test(frame.src)) return go(steps[n - 1]);
  }
  const match = steps.find((b) => new RegExp(b.dataset.match).test(e.data.pathname));
  if (match) setActive(match);
});

function stopTour() {
  clearInterval(tour);
  tour = null;
  playBtn.textContent = '▶ Auto-play the tour';
}

playBtn.addEventListener('click', () => {
  if (tour) return stopTour();
  const order = steps.filter((b) => !b.dataset.flow);
  let i = 0;
  go(order[i]);
  playBtn.textContent = '❚❚ Pause tour';
  tour = setInterval(() => {
    i = (i + 1) % order.length;
    go(order[i]);
  }, 5200);
  if (window.innerWidth <= 1080) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('reset').addEventListener('click', () => {
  stopTour();
  ready = false;
  loading.classList.remove('hidden');
  frame.src = '/demo/?r=' + Date.now();
});

// Fallback: hide the loader even if the route message is missed.
frame.addEventListener('load', () => setTimeout(() => loading.classList.add('hidden'), 2500));

document.querySelectorAll('.spring').forEach((el) =>
  el.addEventListener('click', () => {
    el.classList.remove('run');
    void el.offsetWidth;
    el.classList.add('run');
  }),
);
const springObserver = new IntersectionObserver((entries) =>
  entries.forEach((en) => en.isIntersecting && en.target.querySelectorAll('.spring').forEach((s) => s.classList.add('run'))),
  { threshold: 0.4 },
);
springObserver.observe(document.getElementById('springs'));
