// About: night first, then paper, then the accent. The statement is set like a rebus,
// broken by glyphs and by the work itself.
import { gsap } from 'gsap';
import { me, projects } from '../data';
import { addBody, jellyLetters, removeBody } from '../lib/jelly';
import { reduced } from '../lib/text';
import type { Page } from '../main';

const pic = (i: number, cls = '') => `<a class="reb__pic ${cls}" href="/works/${projects[i].slug}" data-flip data-cursor="${projects[i].title.join('')}"><span data-flip-src data-jelly="drag"><img src="${projects[i].cover}" alt="${projects[i].title.join('')}" loading="lazy" draggable="false" /></span></a>`;

export function about(): Page {
  return {
    title: 'About | Huzaifa Imran',
    lines: ['About'],
    theme: 'ink',
    bar: 'Hello',
    html: `
    <article class="about">
      <header class="about__hero">
        <p class="about__word" aria-hidden="true"><span>HUZAIFA</span></p>
        <h1 class="sr-only">About Huzaifa Imran</h1>
      </header>

      <section class="reb wrap" aria-label="I make hard things easy to read.">
        <div class="reb__line" aria-hidden="true"><span><b>(I M</b><i>AK</i><b>E</b></span><u>✽</u><span><b>)</b></span><span class="reb__tag">©2026</span>${pic(1)}</div>
        <div class="reb__line" aria-hidden="true"><u class="reb__arrow">↳</u>${pic(5, 'reb__pic--s')}<span><b>HA</b><i>R</i><b>D</b></span></div>
        <div class="reb__line" aria-hidden="true"><span><b>TH</b><i>IN</i><b class="a">G</b><b>S,</b></span>${pic(3, 'reb__pic--l')}<u>✦</u></div>
        <div class="reb__line" aria-hidden="true">${pic(6, 'reb__pic--s')}<span><i>EA</i><b>S</b><b class="a">Y</b></span><span><b>TO</b></span></div>
        <div class="reb__line" aria-hidden="true"><span><b>./</b></span><span><i>R</i><b>EA</b><b class="a">D</b></span><u class="reb__arrow a">➵</u>${pic(4, 'reb__pic--s')}<span><b>(</b><i>.</i><b>)</b></span></div>
      </section>

      <div data-theme-zone="paper">
        <section class="about__body wrap">
          <div>
            <h2 class="label" data-scramble>About me</h2>
            <p class="about__lede" data-split>${me.about}</p>
            <a class="chip" href="/works" data-magnetic="0.25"><span>View all projects</span><i>07</i></a>
          </div>
          <div class="about__skills">
            ${me.skills.map((s) => `<div><h2 class="label" data-scramble>${s.name}</h2><ul class="plain">${s.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('')}
          </div>
        </section>
      </div>

      <div data-theme-zone="accent">
        <section class="about__cv wrap">
          <h2 class="arch__title"><span>Record</span> <em>${me.experience.length}</em></h2>
          <p class="label" data-scramble>Experience and education</p>
          <ol class="table table--4">
            ${me.experience.map((e) => `<li class="table__row" data-reveal="fade"><span>${e.when}</span><strong>${e.who}</strong><span>${e.what}</span><span>${e.note}</span></li>`).join('')}
          </ol>
        </section>
        <section class="about__end wrap">
          <p class="statement"><b>©Huzaifa</b> <i>Imran</i><br><b>designs the flow,</b><br><b>draws the</b> <i>interface,</i><br><b>and</b> <i>ships</i> <b>the front end.</b></p>
          <div class="cta">
            <a class="big-btn big-btn--solid" href="mailto:${me.email}" data-magnetic="0.15"><span>Get in touch</span><i aria-hidden="true">↗</i></a>
            <a class="big-btn" href="/works" data-magnetic="0.15"><span>View all projects</span></a>
          </div>
        </section>
      </div>
    </article>`,
    mount({ root, intro }) {
      if (reduced()) return;
      const word = root.querySelector<HTMLElement>('.about__word')!;
      const inner = word.querySelector<HTMLElement>('span')!;
      const letters = jellyLetters(inner);
      gsap.set(inner, { yPercent: 115 });
      intro.to(inner, { yPercent: 0, duration: 1.6, ease: 'elastic.out(1, 0.5)' }, 0.1).add(() => word.classList.add('is-open'), 1.5);
      gsap.to(word, { yPercent: -30, scale: 0.9, ease: 'none', scrollTrigger: { trigger: '.about__hero', start: 'top top', end: 'bottom top', scrub: true } });
      // the words of the statement are bodies too: pull any fragment
      const frags = [...root.querySelectorAll<HTMLElement>('.reb__line > span:not(.reb__tag) > *')].map((el) => addBody(el, 'drag'));

      // rebus: every fragment arrives on its own beat
      root.querySelectorAll<HTMLElement>('.reb__line').forEach((line) => {
        gsap.from(line.children, {
          yPercent: 60, autoAlpha: 0, rotate: () => gsap.utils.random(-10, 10), duration: 1.5, ease: 'elastic.out(1, 0.5)', stagger: 0.06,
          scrollTrigger: { trigger: line, start: 'top 88%', once: true },
        });
      });
      // glyphs keep turning slowly: the page is never fully at rest
      gsap.to(root.querySelectorAll('.reb u:not(.reb__arrow)'), { rotate: 360, duration: 14, ease: 'none', repeat: -1 });
      gsap.to(root.querySelectorAll('.reb__arrow'), { x: 14, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      return () => { letters.off(); frags.forEach(removeBody); };
    },
  };
}
