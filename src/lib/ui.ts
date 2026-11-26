// Persistent interface: cursor follower, menu, and the behaviours every page shares.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { scramble, reduced } from './text';
import { jellify } from './jelly';

gsap.registerPlugin(ScrollTrigger, SplitText);
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- cursor: a small tile that unfolds into a label ---------- */
export function initCursor() {
  const el = document.getElementById('cursor');
  if (!el || !fine() || reduced()) return;
  const label = el.querySelector<HTMLElement>('.cursor__label')!;
  const box = el.querySelector<HTMLElement>('.cursor__box')!;
  // the follower is a spring too: it overshoots the pointer and stretches along its travel
  const c = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, px: innerWidth / 2, py: innerHeight / 2 };
  gsap.ticker.add((_t, delta) => {
    const dt = Math.min(delta, 34) / 1000;
    c.vx += ((c.px - c.x) * 420 - c.vx * 24) * dt;
    c.vy += ((c.py - c.y) * 420 - c.vy * 24) * dt;
    c.x += c.vx * dt; c.y += c.vy * dt;
    el.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
    const speed = Math.hypot(c.vx, c.vy);
    if (el.classList.contains('is-active') || speed < 40) { box.style.transform = ''; return; }
    const st = Math.min(0.3, speed * 0.0003);
    box.style.transform = `rotate(${(Math.atan2(c.vy, c.vx) * 57.3 - 45).toFixed(1)}deg) scale(${(1 + st).toFixed(3)},${(1 - st * 0.45).toFixed(3)})`;
  });
  const x = (v: number) => { c.px = v; };
  const y = (v: number) => { c.py = v; };
  let current = '';
  addEventListener('pointermove', (e) => {
    x(e.clientX); y(e.clientY);
    el.classList.add('is-ready');
    const t = (e.target as HTMLElement).closest?.<HTMLElement>('[data-cursor]');
    const text = t?.dataset.cursor ?? '';
    if (text !== current) {
      current = text;
      el.classList.toggle('is-active', !!text);
      if (text) scramble(label, text, 0.45);
    }
    el.classList.toggle('is-link', !text && !!(e.target as HTMLElement).closest?.('a, button'));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-ready'));
}
export const resetCursor = () => document.getElementById('cursor')?.classList.remove('is-active');

/* ---------- menu: the button unfolds into the panel ---------- */
let menuOpen = false;
let closeTimer = 0;
export function closeMenu() { if (menuOpen) setMenu(false); }
function setMenu(open: boolean) {
  clearTimeout(closeTimer); closeTimer = 0;
  if (open === menuOpen) return;
  menuOpen = open;
  const nav = document.querySelector<HTMLElement>('.menu')!;
  const btn = nav.querySelector<HTMLButtonElement>('.menu__toggle')!;
  const links = nav.querySelectorAll('.menu__panel a');
  nav.classList.toggle('is-open', open);
  btn.setAttribute('aria-expanded', String(open));
  gsap.killTweensOf(links);
  if (open && !reduced()) gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'elastic.out(1, 0.6)', stagger: 0.05, delay: 0.12 });
}
export function initMenu() {
  const nav = document.querySelector<HTMLElement>('.menu')!;
  const btn = nav.querySelector<HTMLButtonElement>('.menu__toggle')!;
  const panel = nav.querySelector<HTMLElement>('.menu__panel')!;
  const slab = nav.querySelector<HTMLElement>('.menu__slab')!;
  btn.addEventListener('click', () => setMenu(!menuOpen));
  if (fine()) {
    btn.addEventListener('pointerenter', () => setMenu(true));
    // close only once the pointer has really gone: measured against the panel's full box with a
    // margin and a short grace period. pointerleave fired while the panel was still unfolding,
    // because its clipped part cannot be hovered yet, so the menu shut on the way to a link
    const inside = (x: number, y: number) => {
      const r = panel.getBoundingClientRect(), m = 28;
      return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m;
    };
    addEventListener('pointermove', (e) => {
      if (!menuOpen) return;
      if (inside(e.clientX, e.clientY)) { clearTimeout(closeTimer); closeTimer = 0; }
      else if (!closeTimer) closeTimer = window.setTimeout(() => { closeTimer = 0; setMenu(false); }, 320);
    }, { passive: true });
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('pointerdown', (e) => { if (menuOpen && !nav.contains(e.target as Node)) setMenu(false); });
  // one slab slides behind whichever link is under the pointer or focused
  const links = [...panel.querySelectorAll<HTMLElement>('a')];
  const place = (a: HTMLElement) => {
    const p = panel.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    gsap.to(slab, { x: r.left - p.left - 10, y: r.top - p.top, width: r.width + 20, height: r.height, autoAlpha: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' });
    links.forEach((l) => l.classList.toggle('is-hot', l === a));
  };
  const clear = () => { gsap.to(slab, { autoAlpha: 0, duration: 0.2 }); links.forEach((l) => l.classList.remove('is-hot')); };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => place(a));
    a.addEventListener('focus', () => { setMenu(true); place(a); });
  });
  panel.addEventListener('pointerleave', clear);
}
export function markCurrent(path: string) {
  document.querySelectorAll<HTMLAnchorElement>('.menu__panel a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const on = href !== '/' && path.startsWith(href);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ---------- behaviours shared by every page ---------- */
export function initCommon(root: HTMLElement, intro: gsap.core.Timeline) {
  const off: (() => void)[] = [];
  const motion = !reduced();

  // labels decode when they come into view
  root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
    el.dataset.text = el.textContent ?? '';
    if (!motion) return;
    if (el.hasAttribute('data-intro')) { intro.add(() => { scramble(el, undefined, 0.9); }, 0.2); return; }
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el, undefined, 0.8) });
  });

  // masked line reveals
  if (motion) {
    root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const isIntro = el.hasAttribute('data-intro');
      const delay = parseFloat(el.dataset.delay || '0');
      let done = false, requested = false;
      let tween: gsap.core.Tween | undefined;
      if (isIntro) intro.add(() => { requested = true; tween?.play(); }, 0.15);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'split-line',
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          if (done) return;
          tween = gsap.from(self.lines, {
            yPercent: 110, duration: 1.1, stagger: 0.07, ease: 'expo.out', delay,
            paused: isIntro && !requested, onComplete: () => { done = true; },
            scrollTrigger: isIntro ? undefined : { trigger: el, start: 'top 88%', once: true },
          });
          return tween;
        },
      });
    });
    root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      const kind = el.dataset.reveal || 'up';
      const delay = parseFloat(el.dataset.delay || '0');
      gsap.set(el, { visibility: 'visible' });
      const from: gsap.TweenVars = kind === 'clip' ? { clipPath: 'inset(100% 0% 0% 0%)' } : kind === 'fade' ? { autoAlpha: 0 } : { y: 60, autoAlpha: 0 };
      const to: gsap.TweenVars = kind === 'clip' ? { clipPath: 'inset(0% 0% 0% 0%)' } : { y: 0, autoAlpha: 1 };
      const isIntro = el.hasAttribute('data-intro');
      const t = gsap.fromTo(el, from, { ...to, duration: 1.3, ease: 'expo.out', delay, paused: isIntro, scrollTrigger: isIntro ? undefined : { trigger: el, start: 'top 90%', once: true } });
      if (isIntro) intro.add(() => { t.play(); }, 0.1);
    });
    root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const a = parseFloat(el.dataset.parallax || '0.12') * 100;
      gsap.fromTo(el, { yPercent: -a }, { yPercent: a, ease: 'none', scrollTrigger: { trigger: el.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // sections that change the colour of the whole page while they are in view
  root.querySelectorAll<HTMLElement>('[data-theme-zone]').forEach((el) => {
    const base = document.documentElement.dataset.theme!;
    const set = (t: string) => { document.documentElement.dataset.theme = t; };
    ScrollTrigger.create({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onEnter: () => set(el.dataset.themeZone!), onEnterBack: () => set(el.dataset.themeZone!),
      onLeave: () => set(base), onLeaveBack: () => set(base),
    });
  });

  // images settle the layout late: re-measure every scroll trigger when they do
  let rf = 0;
  const refresh = () => { clearTimeout(rf); rf = window.setTimeout(() => ScrollTrigger.refresh(), 120); };
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
  off.push(() => clearTimeout(rf));

  // films play only while visible
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    });
  }, { threshold: 0.25 });
  root.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach((v) => io.observe(v));
  off.push(() => io.disconnect());

  // hover: links re-decode, buttons lean toward the pointer
  if (fine() && motion) root.querySelectorAll<HTMLElement>('[data-scramble-hover]').forEach(bindScrambleHover);
  // everything declared as a body joins the spring world
  off.push(jellify(root));
  return () => off.forEach((f) => f());
}

export function bindScrambleHover(el: HTMLElement) {
  el.dataset.text = el.textContent ?? '';
  el.addEventListener('pointerenter', () => scramble(el, undefined, 0.45));
}
export function initShellHovers() {
  if (!fine() || reduced()) return;
  document.querySelectorAll<HTMLElement>('.bar [data-scramble-hover]').forEach(bindScrambleHover);
  jellify(document.querySelector('.site-head')!);
}
