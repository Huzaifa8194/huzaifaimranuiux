// The page transition. A lens shaped panel rises with its curved edge leading, the next page
// announces itself in two typefaces while a counter runs, then the panel leaves upward.
// When a project image was clicked it travels with the transition: list -> thumbnail -> hero.
import { gsap } from 'gsap';
import { mixTitle, reduced } from './text';
import { pokeEl } from './jelly';

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
let flip: HTMLElement | null = null;

export type CoverOpts = { lines: string[]; from?: HTMLElement | null; tone?: 'accent' | 'ink' };

export async function cover({ lines, from, tone = 'accent' }: CoverOpts) {
  const root = $('#curtain');
  const panel = $('.curtain__panel');
  const title = $('.curtain__title');
  const count = $('.curtain__count');
  const slot = $('.curtain__thumb');
  root.dataset.tone = tone;
  mixTitle(title, lines, 0); // lay the title out now so the thumbnail slot sits where it will stay
  gsap.set(title, { autoAlpha: 0 });
  count.textContent = '000';
  slot.style.display = from ? 'block' : 'none';

  if (reduced()) {
    gsap.set(panel, { y: 0 });
    await gsap.fromTo(root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
    return;
  }

  // lift the clicked image out of the page so it survives the swap
  const img = from?.tagName === 'IMG' ? (from as HTMLImageElement) : from?.querySelector('img');
  if (from && img) {
    const r = from.getBoundingClientRect();
    flip = document.createElement('div');
    flip.className = 'flip';
    const clone = document.createElement('img');
    clone.src = img.currentSrc || img.src;
    clone.alt = '';
    flip.appendChild(clone);
    document.body.appendChild(flip);
    gsap.set(flip, { left: r.left, top: r.top, width: r.width, height: r.height });
    from.style.visibility = 'hidden';
  }

  gsap.set(root, { autoAlpha: 1 });
  const tl = gsap.timeline();
  tl.fromTo(panel, { y: '118vh' }, { y: '0vh', duration: 0.95, ease: 'expo.inOut' }, 0);
  if (flip) {
    const s = slot.getBoundingClientRect();
    tl.to(flip, { left: s.left, top: s.top, width: s.width, height: s.height, duration: 1.15, ease: 'back.inOut(1.5)' }, 0);
  }
  tl.add(() => { gsap.set(title, { autoAlpha: 1 }); mixTitle(title, lines, 0.75); }, 0.5);
  tl.fromTo(title, { scale: 0.7 }, { scale: 1, duration: 1, ease: 'elastic.out(1, 0.45)' }, 0.5);
  tl.fromTo(count, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.5);
  const n = { v: 0 };
  tl.to(n, { v: 100, duration: 0.85, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0.5);
  await tl;
}

export async function reveal(target?: HTMLElement | null) {
  const root = $('#curtain');
  const panel = $('.curtain__panel');
  const title = $('.curtain__title');
  const count = $('.curtain__count');
  if (reduced()) {
    flip?.remove(); flip = null;
    await gsap.to(root, { autoAlpha: 0, duration: 0.2 });
    return;
  }
  const tl = gsap.timeline();
  tl.to([title, count], { autoAlpha: 0, duration: 0.25 }, 0);
  tl.to(panel, { y: '-118vh', duration: 1, ease: 'expo.inOut' }, 0.05);
  if (flip) {
    const f = flip;
    if (target) {
      const r = target.getBoundingClientRect();
      gsap.set(target, { autoAlpha: 0 });
      tl.to(f, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 1, ease: 'expo.inOut' }, 0.05);
      tl.add(() => { gsap.set(target, { autoAlpha: 1 }); f.remove(); pokeEl(target.closest('[data-jelly]'), 7); });
    } else {
      tl.to(f, { autoAlpha: 0, duration: 0.3 }, 0);
      tl.add(() => f.remove());
    }
    flip = null;
  }
  tl.set(root, { autoAlpha: 0 });
  tl.set([title, count], { autoAlpha: 1 });
  await tl;
}
