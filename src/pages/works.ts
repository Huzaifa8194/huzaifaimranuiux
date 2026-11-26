// Works: an endless vertical wheel. One number (progress) places every thumbnail, index and
// title, and decides which image fills the stage.
import { gsap } from 'gsap';
import { projects } from '../data';
import { addBody, poke, removeBody } from '../lib/jelly';
import { reduced, scramble } from '../lib/text';
import type { Page } from '../main';

const pad = (i: number) => String(i + 1).padStart(3, '0');

export function works(): Page {
  const n = projects.length;
  const rows = [0, 1, 2].map((s) => projects.map((p, i) => `
    <li class="wheel__row" data-i="${i}"${s !== 1 ? ' aria-hidden="true"' : ''}>
      <a href="/works/${p.slug}" ${s !== 1 ? 'tabindex="-1"' : ''}>
        <span class="wheel__idx">(${pad(i)})</span>
        <span class="wheel__ttl">${p.title.filter(Boolean).join('<br>')}</span>
      </a>
    </li>`).join('')).join('');
  const thumbs = [0, 1, 2].map(() => projects.map((p) => `<li class="wheel__thumb"><img src="${p.cover}" alt="" loading="lazy" /></li>`).join('')).join('');
  return {
    title: 'Works | Huzaifa Imran',
    lines: ['Works'],
    locked: true,
    bar: `001 / ${pad(n - 1)}`,
    html: `
    <section class="works">
      <h1 class="sr-only">Works</h1>
      <div class="works__floor" aria-hidden="true"></div>
      <ol class="wheel" aria-label="Projects">${rows}</ol>
      <p class="works__kind" aria-hidden="true"></p>
      <ul class="wheel__thumbs" aria-hidden="true">${thumbs}</ul>
      <a class="works__stage" href="/works/${projects[0].slug}" data-flip data-cursor="View project" aria-label="Open project">
        <span class="works__frame" data-flip-src>
          ${projects.map((p, i) => `<img src="${p.cover}" alt="" data-i="${i}" draggable="false" />`).join('')}
        </span>
      </a>
    </section>`,
    mount({ root, intro, go }) {
      const rowsEl = [...root.querySelectorAll<HTMLElement>('.wheel__row')];
      const thumbsEl = [...root.querySelectorAll<HTMLElement>('.wheel__thumb')];
      const stage = root.querySelector<HTMLAnchorElement>('.works__stage')!;
      const frame = root.querySelector<HTMLElement>('.works__frame')!;
      const imgs = [...frame.querySelectorAll<HTMLImageElement>('img')];
      const kind = root.querySelector<HTMLElement>('.works__kind')!;
      const floor = root.querySelector<HTMLElement>('.works__floor')!;
      const mid = document.querySelector<HTMLElement>('[data-bar-mid]')!;
      const total = rowsEl.length; // 3n
      const motion = !reduced();

      // the staged picture is a body: it pops when the project changes and can be pulled about
      const body = motion ? addBody(frame, 'drag', { mass: 1, scroll: false }) : null;
      let vp = 0;
      let p = 0, target = 0, active = -1, idle: number | undefined, z = 1;
      let dragging = false, lastY = 0, moved = 0;
      const mod = (a: number, b: number) => ((a % b) + b) % b;

      const setActive = (i: number, dir: number) => {
        if (i === active) return;
        active = i;
        const pr = projects[i];
        stage.href = `/works/${pr.slug}`;
        mid.textContent = `${pad(i)} / ${pad(n - 1)}`;
        scramble(kind, pr.kind.toUpperCase(), 0.5);
        const img = imgs[i];
        img.style.zIndex = String(++z);
        if (body) poke(body, 4.5 * dir, 0, dir * -260);
        if (motion) {
          gsap.fromTo(img, { clipPath: dir >= 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', scale: 1.25 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'expo.out', overwrite: true });
        }
      };

      const snap = () => { target = Math.round(target); };
      const nudge = (d: number) => { target += d; clearTimeout(idle); idle = window.setTimeout(snap, 160); };
      const onWheel = (e: WheelEvent) => nudge(gsap.utils.clamp(-1.2, 1.2, e.deltaY / 240));
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') { target = Math.round(target) + 1; }
        if (e.key === 'ArrowUp') { target = Math.round(target) - 1; }
      };
      const onDown = (e: PointerEvent) => { if (e.pointerType === 'mouse' && (e.target as HTMLElement).closest('.works__stage')) return; dragging = true; lastY = e.clientY; moved = 0; };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const d = e.clientY - lastY; lastY = e.clientY; moved += Math.abs(d);
        nudge(-d / (innerHeight * 0.16));
      };
      const onUp = () => { dragging = false; };
      addEventListener('wheel', onWheel, { passive: true });
      addEventListener('keydown', onKey);
      root.addEventListener('pointerdown', onDown);
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerup', onUp);

      // a click on a row that is not centred turns the wheel to it first
      rowsEl.forEach((li, j) => {
        const a = li.querySelector('a')!;
        a.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (moved > 8) return;
          const d = dist(j);
          if (Math.abs(d) < 0.5 || e.detail === 0) go(a.getAttribute('href')!, frame);
          else target = Math.round(p) + Math.round(d);
        });
        a.addEventListener('focus', () => { if (li.getAttribute('aria-hidden') !== 'true') target = Math.round(p) + Math.round(dist(j)); });
      });
      stage.addEventListener('click', (e) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);

      const dist = (j: number) => {
        let d = mod(j - p, total);
        if (d > total / 2) d -= total;
        return d;
      };

      let vel = 0;
      const tick = (_t: number, delta: number) => {
        const dt = Math.min(delta, 34) / 1000;
        const prev = p;
        // an underdamped spring: the wheel overshoots the project it lands on and wobbles back
        vp += ((target - p) * 70 - vp * 9) * dt;
        p += vp * dt;
        const v = p - prev;
        vel += (v - vel) * 0.2;
        const h = innerHeight, w = innerWidth;
        const small = w < 760;
        const gap = h * (small ? 0.085 : 0.092);
        const push = h * (small ? 0.2 : 0.19); // room for the stage in the middle
        for (let j = 0; j < total; j++) {
          const d = dist(j);
          const near = Math.exp(-Math.abs(d) * 0.95); // 1 at the centre, falls off fast
          const y = d * gap + gsap.utils.clamp(-1, 1, d) * push;
          const li = rowsEl[j];
          const off = Math.abs(d) > 6.5;
          li.style.visibility = off ? 'hidden' : 'visible';
          if (!off) {
            li.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
            li.style.setProperty('--near', near.toFixed(3));
            li.style.opacity = gsap.utils.clamp(0, 1, 4.4 - Math.abs(d)).toFixed(2);
            li.classList.toggle('is-active', Math.abs(d) < 0.5);
          }
          const th = thumbsEl[j];
          th.style.visibility = off ? 'hidden' : 'visible';
          if (!off) th.style.transform = `translate3d(${(-near * w * 0.075 + Math.abs(d) * Math.abs(d) * -1.2).toFixed(1)}px,${(d * gap * 0.92 + gsap.utils.clamp(-1, 1, d) * push * 0.55).toFixed(1)}px,0) rotate(${(d * 1.4 + gsap.utils.clamp(-18, 18, vel * 420)).toFixed(2)}deg)`;
        }
        if (motion) {
          floor.style.setProperty('--bend', `${(14 + gsap.utils.clamp(-10, 10, vel * 140)).toFixed(1)}vh`);
        }
        const a = mod(Math.round(p), n);
        if (a !== active) setActive(a, v >= 0 ? 1 : -1);
      };
      gsap.ticker.add(tick);
      setActive(0, 1);

      if (motion) {
        intro
          .add(() => { p = -2.4; }, 0)
          .fromTo(stage, { clipPath: 'inset(50% 20% 50% 20%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' }, 0.05)
          .fromTo(floor, { yPercent: 100 }, { yPercent: 0, duration: 1.4, ease: 'expo.out' }, 0.2);
      }

      return () => {
        gsap.ticker.remove(tick);
        if (body) removeBody(body);
        clearTimeout(idle);
        removeEventListener('wheel', onWheel);
        removeEventListener('keydown', onKey);
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerup', onUp);
      };
    },
  };
}
