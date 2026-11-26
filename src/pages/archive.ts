// Archive: the engineering led work. No pictures on purpose, a ledger instead.
import { gsap } from 'gsap';
import { archive } from '../data';
import { jellyLetters } from '../lib/jelly';
import { reduced } from '../lib/text';
import type { Page } from '../main';

export function archivePage(): Page {
  const row = (a: (typeof archive)[number], i: number) => {
    const cells = `
      <span class="ledger__n">${String(i + 1).padStart(2, '0')}</span>
      <strong>${a.name}</strong>
      <span>${a.kind}</span>
      <span class="ledger__note">${a.note}</span>
      <span class="ledger__go">${a.live ? 'Live ↗' : 'Private'}</span>`;
    return a.live
      ? `<li><a class="ledger__row" href="${a.live}" target="_blank" rel="noopener" data-cursor="Open live">${cells}</a></li>`
      : `<li><div class="ledger__row is-private">${cells}</div></li>`;
  };
  return {
    title: 'Archive | Huzaifa Imran',
    lines: ['Archive'],
    theme: 'accent',
    bar: `${archive.length} projects`,
    html: `
    <section class="arch wrap">
      <header class="arch__head">
        <h1 class="arch__title"><span class="mask"><span>Archive</span></span> <em class="mask"><span>${archive.length}</span></em></h1>
        <p class="arch__intro" data-split data-intro>The other ${archive.length}. Platforms, dashboards, billing flows and wallets where most of the work sat behind the screen. Less to look at, plenty to click through.</p>
      </header>
      <p class="label" data-scramble>Project / Kind / What I did</p>
      <ol class="ledger">${archive.map(row).join('')}</ol>
      <footer class="arch__foot">
        <p class="statement"><b>Seven</b> <i>projects</i> <b>have</b><br><i>full</i> <b>case studies.</b></p>
        <div class="cta">
          <a class="big-btn big-btn--solid" href="/works" data-magnetic="0.15"><span>View all works</span><i aria-hidden="true">↗</i></a>
          <a class="big-btn" href="mailto:huzaifa8195@gmail.com" data-magnetic="0.15"><span>Get in touch</span></a>
        </div>
      </footer>
    </section>`,
    mount({ root, intro }) {
      if (reduced()) return;
      const t = root.querySelectorAll('.arch__title .mask > span');
      gsap.set(t, { yPercent: 110 });
      const letters = jellyLetters(t[0] as HTMLElement);
      intro.to(t, { yPercent: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)', stagger: 0.1 }, 0.1)
        .add(() => root.querySelector('.arch__title')!.classList.add('is-open'), 1.5);
      gsap.from(root.querySelectorAll('.ledger li'), {
        autoAlpha: 0, y: 40, duration: 1.2, ease: 'elastic.out(1, 0.6)', stagger: 0.035,
        scrollTrigger: { trigger: '.ledger', start: 'top 85%', once: true },
      });
      return () => letters.off();
    },
  };
}
