// Case study. It opens on the film, not on a screenshot. The title starts as a poster and,
// as you scroll, shrinks into a running head. Every picture is a body you can pull.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import walkMap from '../walk.json';
import { nextOf, projects, type Film, type Media, type Project } from '../data';
import { jellyLetters, pokeEl } from '../lib/jelly';
import { reduced } from '../lib/text';
import type { Page } from '../main';

const figure = (g: Media, cls = '') => `
  <figure class="shot ${cls}">
    <div class="shot__body" data-jelly="drag" data-jelly-gain="0.3" data-cursor="Pull me">
      <div class="shot__clip" data-reveal="clip"><img src="${g.src}" alt="${g.alt}" loading="lazy" draggable="false" /></div>
    </div>
    <figcaption>${g.alt}</figcaption>
  </figure>`;

function gallery(items: Media[]) {
  // rhythm: one wide frame, then a staggered pair, and again
  let out = '';
  let i = 0;
  while (i < items.length) {
    out += `<div class="gal__wide">${figure(items[i])}</div>`;
    i++;
    if (i < items.length) {
      const a = items[i], b = items[i + 1];
      out += `<div class="gal__pair">${figure(a)}${b ? figure(b, 'shot--drop') : ''}</div>`;
      i += 2;
    }
  }
  return out;
}

const player = (f: Film, title: string) => `
  <figure class="film${f.vertical ? ' film--tall' : ''}">
    <div class="film__body" data-jelly="drag" data-jelly-gain="0.3">
      <button class="film__frame" type="button" data-film data-cursor="Play with sound" aria-label="Play ${title}: ${f.label}, with sound">
        <video src="${f.src}" poster="${f.poster}" playsinline preload="none"></video>
        <span class="film__play" aria-hidden="true"><i></i></span>
      </button>
    </div>
    <figcaption><strong>${f.label}</strong><span>${f.length}</span></figcaption>
  </figure>`;

export function project(p: Project): Page {
  const next = nextOf(p.slug);
  const idx = projects.indexOf(p);
  const title = p.title.filter(Boolean) as string[];
  const name = title.join('');
  const rest = p.films;
  const wm = (walkMap as Record<string, { len: number; stops: number[] }>)[p.slug];
  const beats = p.chapters.map((c, i) => ({ ...c, t: wm ? (wm.stops[c.stop ?? -1] ?? (wm.len * i) / p.chapters.length) : 0 }));
  const wide = rest.filter((f) => !f.vertical);
  const tall = rest.filter((f) => f.vertical);
  return {
    title: `${name}, ${p.kind.toLowerCase()} | Huzaifa Imran`,
    lines: title,
    bar: p.kind,
    html: `
    <article class="case">
      <div class="case__cover" style="--ar:${p.ar};--img:url('${p.cover}')">
        <div class="case__stage">
          <span class="case__shade" aria-hidden="true"></span>
          ${p.ui
            ? `<div class="case__frame" data-flip-target>
                <video src="${p.ui}" poster="${p.hero}" muted loop playsinline preload="auto" data-ambient aria-label="The hero section of the ${name} page, recorded"></video>
                <span class="film__tag" aria-hidden="true"><i></i><b>The hero</b><em>Live page, recorded</em></span>
              </div>`
            : `<div class="case__frame" data-flip-target><img src="${p.cover}" alt="${name}: opening screen" draggable="false" /></div>`}
        </div>
      </div>
      <div class="case__sheet">
      <header class="case__head">
        <h1 class="case__title" aria-label="${title.join(' ')}">${title.map((t) => `<span class="mask"><span>${t}</span></span>`).join('')}</h1>
        <p class="case__kind">${p.kind}</p>
      </header>

      <section class="case__meta wrap">
        <p class="case__year">©${p.year}<br><span>(${String(idx + 1).padStart(3, '0')})</span></p>
        <div>
          <h2 class="label" data-scramble>Features</h2>
          <ul class="plain">${p.features.map((f) => `<li>${f}</li>`).join('')}</ul>
        </div>
        <div>
          <h2 class="label" data-scramble>Description</h2>
          <p class="case__lede" data-split>${p.lede}</p>
          <p class="case__role">${p.role}</p>
          <a class="btn" href="${p.live}" target="_blank" rel="noopener" data-magnetic="0.3" data-cursor="Open live"><span>Visit the live site</span><i aria-hidden="true">↗</i></a>
        </div>
      </section>

      ${p.walk && wm ? `
      <section class="story${beats.length > 11 ? ' story--long' : ''}" data-len="${wm.len}" aria-label="The page, scrolled">
        <div class="story__pin wrap">
          <div class="story__side">
            <h2 class="label" data-scramble>Scroll the page</h2>
            <ol class="story__list">
              ${beats.map((c, i) => `<li class="story__item${i ? '' : ' is-on'}" data-t="${c.t}"><span>${c.n}</span><div><strong>${c.name}</strong><p>${c.note}</p></div></li>`).join('')}
            </ol>
            <p class="story__hint label" aria-hidden="true">Your scroll drives the recording</p>
          </div>
          <div class="story__stage" data-jelly data-jelly-gain="0.25">
            <video src="${p.walk}" poster="${p.cover}" muted playsinline preload="auto" aria-label="${name}: the whole page being scrolled"></video>
            <span class="story__bar" aria-hidden="true"><i></i></span>
          </div>
        </div>
      </section>` : ''}

      <section class="case__text wrap">
        <h2 class="label" data-scramble>Challenge</h2>
        <p data-split>${p.challenge}</p>
      </section>

      <section class="case__dark" data-theme-zone="ink">
        <div class="gal wrap">${gallery(p.gallery)}</div>
        <dl class="facts wrap">
          ${p.facts.map((f) => `<div class="fact" data-reveal><dt>${f.label}</dt><dd><span data-jelly="drag" data-jelly-gain="0.35">${f.value}</span></dd></div>`).join('')}
        </dl>
      </section>

      <section class="case__text wrap">
        <h2 class="label" data-scramble>Solution</h2>
        <div>${p.solution.map((s) => `<p data-split>${s}</p>`).join('')}</div>
      </section>

      ${rest.length ? `
      <section class="case__films wrap">
        <h2 class="label" data-scramble>Motion content I made for the launch</h2>
        ${wide.length ? `<div class="films films--${Math.min(wide.length, 2)}">${wide.map((f) => player(f, name)).join('')}</div>` : ''}
        ${tall.length ? `<div class="films films--tall">${tall.map((f) => player(f, name)).join('')}</div>` : ''}
      </section>` : ''}

      <section class="case__system wrap">
        <div>
          <h2 class="label" data-scramble>Palette</h2>
          <ul class="swatches">
            ${p.palette.map((c) => `<li data-reveal><i style="background:${c.hex}" data-jelly="drag" data-jelly-gain="0.35"></i><span>${c.name}</span><code>${c.hex.toUpperCase()}</code></li>`).join('')}
          </ul>
        </div>
        <div>
          <h2 class="label" data-scramble>Type</h2>
          <p>${p.type}</p>
          <h2 class="label" data-scramble>Built with</h2>
          <p>${p.stack}</p>
          ${p.study ? `<h2 class="label" data-scramble>Reference</h2><p>${p.study}</p>` : ''}
        </div>
      </section>

      <section class="case__closing wrap">${figure(p.closing)}</section>

      <a class="next" href="/works/${next.slug}" data-flip data-cursor="Next project">
        <span class="label" data-scramble>Next project</span>
        <span class="next__img" style="--ar:${next.ar}"><span data-flip-src data-jelly data-jelly-gain="0.3"><img src="${next.cover}" alt="" loading="lazy" draggable="false" /></span></span>
        <span class="next__ttl"><strong>${next.title.filter(Boolean).join('<br>')}</strong><em>${next.kind}</em></span>
      </a>
      </div>
    </article>`,
    mount({ root, intro }) {
      // the screen recording plays silently while it is on screen
      const ambient = root.querySelector<HTMLVideoElement>('video[data-ambient]');
      // launch films wait for a click and play with sound, one at a time
      const films = [...root.querySelectorAll<HTMLElement>('[data-film]')];
      const vids = films.map((f) => f.querySelector('video')!);
      const stop = (except?: HTMLVideoElement) => vids.forEach((v, i) => {
        if (v === except) return;
        v.pause();
        films[i].classList.remove('is-loud');
        films[i].dataset.cursor = 'Play with sound';
      });
      films.forEach((f, i) => {
        const v = vids[i];
        f.addEventListener('click', () => {
          if (f.classList.contains('is-loud')) { stop(); return; }
          stop(v);
          if (v.ended) v.currentTime = 0;
          v.play().catch(() => {});
          f.classList.add('is-loud');
          f.dataset.cursor = 'Pause';
        });
        v.addEventListener('ended', () => { f.classList.remove('is-loud'); f.dataset.cursor = 'Play with sound'; });
      });
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (v === ambient) { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); return; }
        if (!e.isIntersecting && !v.paused) stop();
      }), { threshold: 0.2 });
      [...vids, ...(ambient ? [ambient] : [])].forEach((v) => io.observe(v));
      const offFilms = () => { io.disconnect(); vids.forEach((v) => v.pause()); ambient?.pause(); };

      // scroll story: the visitor's scroll is the playhead of the recording
      const story = root.querySelector<HTMLElement>('.story');
      let offStory = () => {};
      if (story) {
        const v = story.querySelector('video')!;
        const stage = story.querySelector<HTMLElement>('.story__stage')!;
        const bar = story.querySelector<HTMLElement>('.story__bar i')!;
        const items = [...story.querySelectorAll<HTMLElement>('.story__item')];
        const times = items.map((li) => parseFloat(li.dataset.t || '0'));
        const len = parseFloat(story.dataset.len || '1');
        if (reduced()) { v.controls = true; }
        else {
          let target = 0, cur = 0, active = 0;
          ScrollTrigger.create({
            trigger: story, start: 'top top', end: () => `+=${innerHeight * Math.max(4, items.length * 0.95)}`,
            pin: story.querySelector<HTMLElement>('.story__pin'), scrub: true, invalidateOnRefresh: true,
            refreshPriority: 1, // measure the pin before the colour zones further down the page
            onUpdate: (self) => { target = self.progress * (len - 0.06); },
          });
          const tick = (_t: number, delta: number) => {
            cur += (target - cur) * (1 - Math.exp(-Math.min(delta, 100) * 0.011));
            if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - cur) > 0.02) v.currentTime = cur;
            bar.style.transform = `scaleX(${(cur / len).toFixed(4)})`;
            let a = 0;
            for (let i = 0; i < times.length; i++) if (times[i] <= cur + 0.6) a = i;
            if (a !== active) {
              active = a;
              items.forEach((li, i) => li.classList.toggle('is-on', i === a));
              pokeEl(stage, 2);
            }
          };
          gsap.ticker.add(tick);
          offStory = () => gsap.ticker.remove(tick);
        }
      }

      if (reduced()) return offFilms;
      const head = root.querySelector<HTMLElement>('.case__head')!;
      const lines = [...root.querySelectorAll<HTMLElement>('.case__title .mask > span')];
      const letters = lines.map((l) => jellyLetters(l, { gain: 0.45 }));

      // the banner does not wobble. It stays put while the page rises over it like a sheet whose
      // leading edge is the same lens the page transition uses; the faster you scroll, the more it
      // bulges. Under it the recording is pushed back and darkens while the footage zooms in,
      // a small dolly zoom, and the glow behind it drifts off
      const cover = root.querySelector<HTMLElement>('.case__cover')!;
      const sheet = root.querySelector<HTMLElement>('.case__sheet')!;
      const stage = cover.querySelector<HTMLElement>('.case__stage')!;
      const frame = cover.querySelector<HTMLElement>('.case__frame')!;
      const media = frame.querySelector<HTMLElement>('video, img')!;
      const shade = cover.querySelector<HTMLElement>('.case__shade')!;
      const tag = cover.querySelector<HTMLElement>('.film__tag');
      const lens = gsap.quickTo(sheet, '--lens', { duration: 0.7, ease: 'power3.out' });
      const out = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: cover, start: 'top top', end: () => `+=${cover.offsetHeight}`, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => lens(Math.sin(Math.PI * self.progress) * 7 + Math.min(6, Math.abs(self.getVelocity()) / 400)),
          // once the sheet covers it, the banner stops drawing and its recording stops playing
          onLeave: () => { lens(0); cover.style.visibility = 'hidden'; ambient?.pause(); },
          onEnterBack: () => { cover.style.visibility = ''; ambient?.play().catch(() => {}); },
        },
      });
      out
        .fromTo(cover, { '--drift': 0 }, { '--drift': 1 }, 0)
        .fromTo(stage, { scale: 1, yPercent: 0 }, { scale: 0.84, yPercent: 4, ease: 'power1.in' }, 0)
        .fromTo([frame, shade], { borderRadius: 4 }, { borderRadius: 28 }, 0)
        .fromTo(media, { scale: 1 }, { scale: 1.14, ease: 'power1.in' }, 0)
        .fromTo(shade, { opacity: 0 }, { opacity: 0.65, ease: 'power2.in' }, 0);
      if (tag) out.to(tag, { autoAlpha: 0, y: 12, duration: 0.25 }, 0);

      // poster title -> running head; the category line keeps its size while the title shrinks
      const k = () => Math.max(0.1, Math.min(0.26, (190 / head.offsetWidth) * (innerWidth < 760 ? 0.7 : 1)));
      const st = { trigger: head, start: 'top 58%', end: () => `+=${innerHeight * 0.75}`, scrub: true, invalidateOnRefresh: true };
      gsap.to(head, { scale: k, ease: 'none', scrollTrigger: st });
      gsap.to('.case__kind', { scale: () => 1 / k(), ease: 'none', scrollTrigger: { ...st } });

      gsap.set(lines, { yPercent: 110 });
      intro
        .to(lines, { yPercent: 0, duration: 1.5, ease: 'elastic.out(1, 0.6)', stagger: 0.09 }, 0.15)
        .add(() => head.classList.add('is-open'), 1.4) // letters may now leave their masks
        .fromTo('.case__kind', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.7);

      // the next project swells as the page runs out
      gsap.fromTo('.next__img', { scale: 0.7 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top bottom', end: 'bottom bottom', scrub: true } });
      return () => { offFilms(); offStory(); letters.forEach((l) => l.off()); };
    },
  };
}
