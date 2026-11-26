import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter-tight';
import '@fontsource/instrument-serif/400-italic.css';
import './styles.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cover, reveal } from './lib/curtain';
import { reduced, scramble } from './lib/text';
import { closeMenu, initCommon, initCursor, initMenu, initShellHovers, markCurrent, resetCursor } from './lib/ui';
import { setScrollVelocity } from './lib/jelly';
import { bySlug } from './data';
import { home } from './pages/home';
import { works } from './pages/works';
import { project } from './pages/project';
import { archivePage } from './pages/archive';
import { about } from './pages/about';
import { notFound } from './pages/notfound';

gsap.registerPlugin(ScrollTrigger);

export type PageCtx = { root: HTMLElement; intro: gsap.core.Timeline; go: (path: string, from?: HTMLElement | null) => void };
export type Page = {
  title: string;
  lines: string[]; // what the curtain announces
  html: string;
  theme?: 'paper' | 'ink' | 'accent';
  skin?: string; // a product's own colours and backdrop, see skins.ts
  locked?: boolean; // the page drives its own wheel, the document does not scroll
  bar?: string; // small label in the middle of the footer bar
  mount?: (ctx: PageCtx) => void | (() => void);
};

import { applySkin } from './skins';

const app = document.getElementById('app')!;
const html = document.documentElement;
let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
let cleanups: (() => void)[] = [];
let busy = false;

function resolve(path: string): Page {
  const p = path.replace(/\/+$/, '') || '/';
  if (p === '/') return home();
  if (p === '/works') return works();
  if (p === '/archive') return archivePage();
  if (p === '/about') return about();
  const m = p.match(/^\/works\/([\w-]+)$/);
  const found = m && bySlug(m[1]);
  return found ? project(found) : notFound();
}

function mountPage(page: Page) {
  document.title = page.title;
  html.dataset.theme = page.theme ?? 'paper';
  applySkin(page.skin);
  html.classList.toggle('is-locked', !!page.locked);
  app.innerHTML = page.html;
  const mid = document.querySelector<HTMLElement>('[data-bar-mid]')!;
  mid.textContent = page.bar ?? '';
  if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); page.locked ? lenis.stop() : lenis.start(); }
  scrollTo(0, 0);
  const intro = gsap.timeline({ paused: true });
  ctx = gsap.context(() => {
    cleanups.push(initCommon(app, intro));
    const c = page.mount?.({ root: app, intro, go });
    if (typeof c === 'function') cleanups.push(c);
  });
  markCurrent(location.pathname);
  requestAnimationFrame(() => ScrollTrigger.refresh());
  return intro;
}

function unmountPage() {
  cleanups.splice(0).forEach((c) => c());
  ctx?.revert();
  ctx = null;
  resetCursor();
}

async function go(path: string, from?: HTMLElement | null, push = true) {
  if (busy) return;
  if (push && path === location.pathname) return;
  busy = true;
  closeMenu();
  resetCursor();
  const page = resolve(path);
  lenis?.stop();
  await cover({ lines: page.lines, from });
  unmountPage();
  if (push) history.pushState({}, '', path);
  const intro = mountPage(page);
  app.focus({ preventScroll: true });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const target = from ? app.querySelector<HTMLElement>('[data-flip-target]') : null;
  const out = reveal(target);
  gsap.delayedCall(reduced() ? 0 : 0.45, () => intro.play());
  await out;
  busy = false;
}

/* ---------- first load ---------- */
async function loader() {
  const root = document.getElementById('loader')!;
  const count = root.querySelector<HTMLElement>('[data-loader-count]')!;
  const panel = document.querySelector<HTMLElement>('.curtain__panel')!;
  const curtain = document.getElementById('curtain')!;
  if (reduced()) {
    await document.fonts.ready;
    root.hidden = true;
    return;
  }
  const started = performance.now();
  const n = { v: 0 };
  const show = () => { count.textContent = String(Math.round(n.v)).padStart(3, '0'); };
  const tl = gsap.timeline();
  tl.fromTo('.loader__name', { yPercent: 105 }, { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.1);
  tl.fromTo('.loader__sub', { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' }, 0.45);
  tl.to(n, { v: 62, duration: 1.1, ease: 'power2.out', onUpdate: show }, 0.1);
  // real work: fonts and the images of the first screen
  const imgs = [...app.querySelectorAll<HTMLImageElement>('img')].slice(0, 6);
  await Promise.race([
    Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {})))]),
    new Promise((r) => setTimeout(r, 2400)),
  ]);
  const wait = Math.max(0, 1300 - (performance.now() - started));
  await new Promise((r) => setTimeout(r, wait));
  curtain.dataset.tone = 'ink';
  gsap.set(curtain, { autoAlpha: 1 });
  gsap.set(['.curtain__title', '.curtain__count'], { autoAlpha: 0 });
  const end = gsap.timeline();
  end.to(n, { v: 100, duration: 0.9, ease: 'power2.inOut', onUpdate: show }, 0);
  end.fromTo(panel, { y: '118vh' }, { y: '0vh', duration: 1.05, ease: 'expo.inOut' }, 0);
  end.to('.loader__mark', { y: '-4vh', duration: 1.05, ease: 'expo.inOut' }, 0);
  end.to(['.loader__name', '.loader__sub'], { yPercent: -110, duration: 0.7, ease: 'expo.in', stagger: 0.06 }, 1.0);
  end.to(count, { autoAlpha: 0, duration: 0.3 }, 1.2);
  end.add(() => { html.classList.add('is-loaded'); }, 1.45);
  end.to(panel, { y: '-118vh', duration: 1.05, ease: 'expo.inOut' }, 1.5);
  end.set(curtain, { autoAlpha: 0 });
  end.set(['.curtain__title', '.curtain__count'], { autoAlpha: 1 });
  await end.then();
  root.hidden = true;
}

async function boot() {
  if (!reduced()) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    setScrollVelocity(() => (lenis && !html.classList.contains('is-locked') ? lenis.velocity : 0));
  }
  initCursor();
  initMenu();
  initShellHovers();

  // one router for every internal link
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = (e.target as HTMLElement).closest?.('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/') || a.target === '_blank' || a.hasAttribute('download')) return;
    e.preventDefault();
    go(href, a.hasAttribute('data-flip') ? a.querySelector<HTMLElement>('[data-flip-src]') ?? a : null);
  });
  addEventListener('popstate', () => go(location.pathname, null, false));

  const intro = mountPage(resolve(location.pathname));
  lenis?.stop();
  await loader();
  html.classList.add('is-loaded');
  if (!html.classList.contains('is-locked')) lenis?.start();
  document.querySelectorAll<HTMLElement>('.bar a, .bar__left > span:not(.bar__sep)').forEach((el, i) => scramble(el, undefined, 0.8, i * 0.04));
  intro.play();
}

boot();
