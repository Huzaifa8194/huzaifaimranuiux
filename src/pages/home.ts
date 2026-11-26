// Home: one screen. A reel of projects hangs from the top edge and never ends.
// The reel is a spring. Its acceleration is the single driver: it slants the wordmark and
// makes every card swing from its top edge like a slab of jelly.
import { gsap } from 'gsap';
import { me, projects } from '../data';
import { addBody, jellyLetters, poke, removeBody, type Body } from '../lib/jelly';
import { reduced, scramble } from '../lib/text';
import type { Page } from '../main';

const HEIGHTS = [36, 43, 50, 56, 40, 47, 53]; // vh, a staircase that repeats

const card = (i: number, set: number) => {
  const p = projects[i];
  const hidden = set !== 1 ? ' aria-hidden="true" tabindex="-1"' : '';
  return `
  <a class="card" href="/works/${p.slug}" data-flip data-cursor="View project" style="--h:${HEIGHTS[i % HEIGHTS.length]};--ar:${p.ar}"${hidden}>
    <span class="card__media" data-flip-src>
      <img src="${p.cover}" alt="${set === 1 ? `${p.title.join('')}, ${p.kind.toLowerCase()}` : ''}" draggable="false" ${i < 4 && set === 1 ? '' : 'loading="lazy"'} />
      ${p.loop ? `<video src="${p.loop}" muted loop playsinline preload="none"></video>` : ''}
    </span>
    <span class="card__cap">
      <strong data-cap-title>${p.title.join(' ')}</strong>
      <em data-cap-kind>${p.kind}</em>
    </span>
  </a>`;
};

export function home(): Page {
  const sets = [0, 1, 2].map((s) => projects.map((_, i) => card(i, s)).join('')).join('');
  return {
    title: 'Huzaifa Imran, UI/UX designer and frontend engineer',
    lines: ['Huzaifa'],
    locked: true,
    html: `
    <section class="home">
      <h1 class="sr-only">Huzaifa Imran, UI/UX designer and frontend engineer</h1>
      <div class="strip" aria-label="Selected projects"><div class="strip__track">${sets}</div></div>
      <div class="home__word" aria-hidden="true"><span>HUZAIFA</span></div>
      <div class="home__copy">
        <p class="label" data-scramble data-intro>HUZAIFA IMRAN©</p>
        <p class="home__intro">${me.intro}</p>
        <p class="home__links">
          <a class="chip" href="/works"><span>All works</span><i>07</i></a>
          <a class="chip chip--ghost" href="/archive"><span>Archive</span><i>28</i></a>
        </p>
      </div>
    </section>`,
    mount({ root, intro }) {
      const strip = root.querySelector<HTMLElement>('.strip')!;
      const track = root.querySelector<HTMLElement>('.strip__track')!;
      const cards = [...track.querySelectorAll<HTMLElement>('.card')];
      const word = root.querySelector<HTMLElement>('.home__word span')!;
      const copy = root.querySelector<HTMLElement>('.home__copy')!;
      const introP = root.querySelector<HTMLElement>('.home__intro')!;
      const n = projects.length;
      const motion = !reduced();

      let setW = 0;
      const measure = () => { setW = cards[n].offsetLeft - cards[0].offsetLeft; };
      measure();
      let x = 0, v = 0, target = 0, hover = false, dragging = false, last = 0, moved = 0;

      const onWheel = (e: WheelEvent) => { target -= (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * 0.9; };
      const onDown = (e: PointerEvent) => { if (e.pointerType === 'mouse') return; /* mouse scrolls the reel with the wheel; only touch drags it */ dragging = true; last = e.clientX; moved = 0; };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const d = e.clientX - last; last = e.clientX; moved += Math.abs(d);
        target += d * (e.pointerType === 'touch' ? 1.6 : 1.2);
      };
      const onUp = () => { dragging = false; };
      const onClickCapture = (e: MouseEvent) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') target -= innerWidth * 0.3;
        if (e.key === 'ArrowLeft') target += innerWidth * 0.3;
      };
      addEventListener('wheel', onWheel, { passive: true });
      strip.addEventListener('pointerdown', onDown);
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerup', onUp);
      strip.addEventListener('click', onClickCapture, true);
      addEventListener('keydown', onKey);
      addEventListener('resize', measure);

      // every card hangs from the top edge as its own body, each with a different weight
      const hung: Body[] = motion
        ? cards.map((c, i) => addBody(c.querySelector<HTMLElement>('.card__media')!, 'hang', { mass: 0.75 + ((i * 3) % 7) * 0.11, scroll: false }))
        : [];
      const letters = motion ? jellyLetters(word) : null;

      // captions and loops follow the card under the pointer
      cards.forEach((c, i) => {
        const t = c.querySelector<HTMLElement>('[data-cap-title]')!;
        const k = c.querySelector<HTMLElement>('[data-cap-kind]')!;
        const vid = c.querySelector<HTMLVideoElement>('video');
        c.addEventListener('pointerenter', () => {
          hover = true;
          c.classList.add('is-hot');
          scramble(t, undefined, 0.5); scramble(k, undefined, 0.6);
          vid?.play().catch(() => {});
          // the neighbours feel it too
          [-1, 1].forEach((o) => { const b = hung[(i + o + hung.length) % hung.length]; if (b) poke(b, 1.4, o * 120); });
        });
        c.addEventListener('pointerleave', () => { hover = false; c.classList.remove('is-hot'); vid?.pause(); });
        c.addEventListener('focus', () => { c.classList.add('is-hot'); target = -(c.offsetLeft - setW) + innerWidth * 0.3; });
        c.addEventListener('blur', () => c.classList.remove('is-hot'));
      });

      const setSkewWord = gsap.quickSetter(word, 'skewX', 'deg');
      const setSkewCopy = gsap.quickSetter(copy, 'skewX', 'deg');
      const setX = gsap.quickSetter(track, 'x', 'px');
      let skew = 0;
      const tick = (_t: number, delta: number) => {
        const dt = Math.min(delta, 34) / 1000;
        if (motion && !hover && !dragging) target -= 21 * dt; // idle drift keeps the reel alive
        // the reel itself is a soft spring: it overshoots a little when it stops
        const pv = v;
        v += ((target - x) * 46 - v * 8.2) * dt;
        x += v * dt;
        const dv = v - pv; // change in speed this frame: what the cards feel
        setX((((x % setW) + setW) % setW) - setW);
        if (!motion) return;
        skew += (gsap.utils.clamp(-14, 14, v * 0.012) - skew) * 0.14;
        setSkewWord(-skew); setSkewCopy(-skew * 0.5);
        if (Math.abs(dv) > 0.4) {
          for (const b of hung) { if (b.inview) { b.vx -= (dv * 1.5) / b.mass; b.vq += Math.abs(dv) * 0.0016; b.awake = true; } }
          letters?.bodies.forEach((b) => { b.vx -= (dv * 0.55) / b.mass; b.vy -= (Math.abs(dv) * 0.25) / b.mass; b.awake = true; });
        }
      };
      gsap.ticker.add(tick);

      if (motion && letters) {
        gsap.set(cards, { yPercent: -105 });
        gsap.set(word, { yPercent: 115 });
        gsap.set([introP, '.home__links'], { autoAlpha: 0, y: 24 });
        intro
          .add(() => { x += innerWidth * 0.7; }, 0) // throw the reel in: speed slants and swings everything
          .to(cards, { yPercent: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)', stagger: { each: 0.05, from: n } }, 0)
          .fromTo(track, { rotate: -3 }, { rotate: 0, duration: 1.8, ease: 'elastic.out(1, 0.5)' }, 0)
          .to(word, { yPercent: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' }, 0.25)
          .to([introP, '.home__links'], { autoAlpha: 1, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)', stagger: 0.1 }, 0.7)
          .add(() => root.querySelector('.home__word')!.classList.add('is-open'), 1.6);
      }

      return () => {
        gsap.ticker.remove(tick);
        hung.forEach(removeBody);
        letters?.off();
        removeEventListener('wheel', onWheel);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
        removeEventListener('keydown', onKey);
        removeEventListener('resize', measure);
      };
    },
  };
}
