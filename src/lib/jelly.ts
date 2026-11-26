// Jelly: one small spring world for the whole site. Every body is an underdamped spring, so
// anything that is pushed, dragged, hovered or carried by scroll overshoots and wobbles back.
// Volume is preserved: what stretches one way squashes the other.
//
//   data-jelly            pops on hover and press, lags behind scroll
//   data-jelly="drag"     can also be pulled around and let go
//   data-jelly="hang"     hangs from its top edge and swings (the home reel)
//   data-magnetic="0.3"   leans toward the pointer, wobbles back when it leaves
//   jellyLetters(el)      every letter is a body the pointer pushes aside
import { gsap } from 'gsap';
import { chars, reduced } from './text';

type Mode = 'pop' | 'drag' | 'hang' | 'magnet' | 'letter';
export type Body = {
  el: HTMLElement; mode: Mode; mass: number; pull: number;
  x: number; y: number; vx: number; vy: number; tx: number; ty: number;
  q: number; vq: number; // squash and stretch
  awake: boolean; inview: boolean; dragging: boolean; scroll: boolean;
  off: (() => void)[];
};

const bodies = new Set<Body>();
const pointer = { x: -9999, y: -9999, moved: false };
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
let started = false;
let scrollV: () => number = () => 0;
let lastScrollV = 0;
let io: IntersectionObserver | null = null;
const byEl = new WeakMap<Element, Body>();

/** Where scroll speed comes from (Lenis). Bodies lag behind changes in it. */
export const setScrollVelocity = (fn: () => number) => { scrollV = fn; };

const wake = (b: Body) => { b.awake = true; };

function start() {
  if (started) return;
  started = true;
  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; }, { passive: true });
  io = new IntersectionObserver((es) => es.forEach((e) => { const b = byEl.get(e.target); if (b) b.inview = e.isIntersecting; }), { rootMargin: '15%' });
  gsap.ticker.add(step);
}

function step(_t: number, delta: number) {
  const dt = Math.min(delta, 34) / 1000;
  // scroll inertia: a change in scroll speed shoves everything on screen
  const sv = scrollV();
  // a jump (anchor, programmatic scroll, a hard flick) must nudge, never launch
  const dv = gsap.utils.clamp(-5, 5, sv - lastScrollV);
  lastScrollV = sv;

  // read phase: letters near the pointer need their resting centre
  const pushes: [Body, number, number][] = [];
  if (pointer.moved) {
    bodies.forEach((b) => {
      if (b.mode !== 'letter' || !b.inview) return;
      const r = b.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - b.x, cy = r.top + r.height / 2 - b.y;
      const dx = cx - pointer.x, dy = cy - pointer.y;
      const R = Math.max(90, r.height * 1.1);
      const d = Math.hypot(dx, dy);
      if (d < R && d > 0.01) {
        const f = (1 - d / R) ** 2 * 5200;
        pushes.push([b, (dx / d) * f, (dy / d) * f]);
      }
    });
    pointer.moved = false;
  }
  pushes.forEach(([b, fx, fy]) => { b.vx += (fx / b.mass) * dt; b.vy += (fy / b.mass) * dt; wake(b); });

  // write phase
  bodies.forEach((b) => {
    if (b.scroll && b.inview && Math.abs(dv) > 0.05) { b.vy -= (dv * 26) / b.mass; b.vq += dv * 0.05; wake(b); }
    if (!b.awake) return;
    const K = b.dragging ? 520 : b.mode === 'letter' ? 150 : 190;
    const C = b.dragging ? 34 : b.mode === 'letter' ? 8.5 : 10.5;
    b.vx += (-K * (b.x - b.tx) - C * b.vx) * dt;
    b.vy += (-K * (b.y - b.ty) - C * b.vy) * dt;
    b.vx = gsap.utils.clamp(-2600, 2600, b.vx);
    b.vy = gsap.utils.clamp(-2600, 2600, b.vy);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (!b.dragging && b.mode !== 'letter') { b.x = gsap.utils.clamp(-90, 90, b.x); b.y = gsap.utils.clamp(-90, 90, b.y); }
    b.vq += (-320 * b.q - 9.5 * b.vq) * dt;
    b.q += b.vq * dt;

    const still = !b.dragging && b.tx === 0 && b.ty === 0
      && Math.abs(b.x) < 0.05 && Math.abs(b.y) < 0.05 && Math.abs(b.vx) < 1 && Math.abs(b.vy) < 1
      && Math.abs(b.q) < 0.001 && Math.abs(b.vq) < 0.01;
    if (still) {
      b.x = b.y = b.vx = b.vy = b.q = b.vq = 0;
      b.awake = false;
      b.el.style.transform = '';
      return;
    }
    const sx = Math.min(0.22, Math.abs(b.vx) * 0.00028);
    const sy = Math.min(0.22, Math.abs(b.vy) * 0.00028);
    const q = gsap.utils.clamp(-0.3, 0.3, b.q);
    if (b.mode === 'hang') {
      const lean = gsap.utils.clamp(-16, 16, -b.x * 0.16);
      b.el.style.transform = `skewX(${lean.toFixed(2)}deg) scale(${(1 + q * 0.35).toFixed(4)},${(1 - q + Math.abs(lean) * 0.004).toFixed(4)})`;
    } else {
      const rot = gsap.utils.clamp(-14, 14, b.vx * 0.012);
      b.el.style.transform = `translate3d(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px,0) rotate(${rot.toFixed(2)}deg) scale(${(1 + q + sx - sy * 0.6).toFixed(4)},${(1 - q + sy - sx * 0.6).toFixed(4)})`;
    }
  });
}

export function addBody(el: HTMLElement, mode: Mode = 'pop', opts: Partial<Pick<Body, 'mass' | 'pull' | 'scroll'>> = {}): Body {
  start();
  const b: Body = {
    el, mode, mass: opts.mass ?? gsap.utils.random(0.8, 1.35), pull: opts.pull ?? 0.3,
    x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, q: 0, vq: 0,
    awake: false, inview: true, dragging: false, scroll: opts.scroll ?? (mode === 'pop' || mode === 'drag'), off: [],
  };
  bodies.add(b);
  byEl.set(el, b);
  io?.observe(el);
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => {
    el.addEventListener(type, fn as EventListener, o);
    b.off.push(() => el.removeEventListener(type, fn as EventListener, o));
  };

  if (mode !== 'letter') {
    on('pointerenter', () => { b.vq += 3.4; wake(b); });
    // hanging cards only swing and pop on hover: pressing one must not deform it mid click
    if (mode !== 'hang') {
      on('pointerdown', () => { b.vq -= 5; wake(b); });
      on('pointerup', () => { b.vq += 4; wake(b); });
    }
  }
  if (mode === 'magnet' && fine()) {
    on('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      b.tx = (e.clientX - (r.left + r.width / 2 - b.x)) * b.pull;
      b.ty = (e.clientY - (r.top + r.height / 2 - b.y)) * b.pull;
      wake(b);
    });
    on('pointerleave', () => { b.tx = b.ty = 0; wake(b); });
  }
  if (mode === 'drag' && fine()) {
    let sx = 0, sy = 0, moved = 0;
    el.style.touchAction = 'pan-y';
    // window listeners instead of pointer capture, so buttons and links inside still get their click
    const move = (e: PointerEvent) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      moved = Math.max(moved, Math.hypot(dx, dy));
      // rubber band: the further it is pulled, the harder it resists
      const k = (v: number) => Math.sign(v) * 260 * (1 - Math.exp(-Math.abs(v) / 260));
      b.tx = k(dx); b.ty = k(dy);
      wake(b);
    };
    const release = () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', release);
      removeEventListener('pointercancel', release);
      if (!b.dragging) return;
      b.dragging = false; b.tx = b.ty = 0;
      b.vq += Math.min(7, moved * 0.03);
      el.classList.remove('is-held');
      wake(b);
    };
    on('pointerdown', (e) => {
      if (e.button !== 0) return;
      b.dragging = true; sx = e.clientX - b.x; sy = e.clientY - b.y; moved = 0;
      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerup', release);
      addEventListener('pointercancel', release);
      el.classList.add('is-held');
      wake(b);
    });
    b.off.push(release);
    on('dragstart', (e) => e.preventDefault());
    // a pull is not a click
    on('click', (e) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, { capture: true });
  }
  return b;
}

export function removeBody(b: Body) {
  b.off.forEach((f) => f());
  io?.unobserve(b.el);
  b.el.style.transform = '';
  bodies.delete(b);
}

/** Give every body currently on screen a shove (px per second). */
export function kick(vx: number, vy: number, only?: (b: Body) => boolean) {
  bodies.forEach((b) => {
    if (!b.inview || (only && !only(b))) return;
    b.vx += vx / b.mass; b.vy += vy / b.mass; wake(b);
  });
}
export function poke(b: Body, vq: number, vx = 0, vy = 0) { b.vq += vq; b.vx += vx; b.vy += vy; wake(b); }

export function pokeEl(el: Element | null, vq: number) { const b = el && byEl.get(el); if (b) poke(b, vq); }

/** Split an element into letters and make each one a body the pointer can push. */
export function jellyLetters(el: HTMLElement, opts: { mass?: number } = {}) {
  const spans = chars(el);
  if (reduced()) return { spans, bodies: [] as Body[], off: () => {} };
  const bs = spans.filter((s) => s.textContent?.trim()).map((s, i) => addBody(s, 'letter', { mass: opts.mass ?? 0.8 + ((i * 7) % 5) * 0.09, scroll: false }));
  return { spans, bodies: bs, off: () => bs.forEach(removeBody) };
}

/** Wire every declared body inside root. Returns a cleanup. */
export function jellify(root: ParentNode) {
  if (reduced()) return () => {};
  const made: Body[] = [];
  root.querySelectorAll<HTMLElement>('[data-jelly]').forEach((el) => {
    const mode = (el.dataset.jelly || 'pop') as Mode;
    made.push(addBody(el, mode, { mass: el.dataset.jellyMass ? parseFloat(el.dataset.jellyMass) : undefined }));
  });
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    made.push(addBody(el, 'magnet', { pull: parseFloat(el.dataset.magnetic || '0.3'), scroll: false }));
  });
  return () => made.forEach(removeBody);
}
