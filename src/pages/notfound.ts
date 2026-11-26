import type { Page } from '../main';

export function notFound(): Page {
  return {
    title: 'Not found | Huzaifa Imran',
    lines: ['Lost', 'signal'],
    theme: 'ink',
    locked: true,
    bar: '404',
    html: `
    <section class="lost">
      <h1 class="lost__n" data-scramble data-intro>404</h1>
      <p class="statement"><b>This page</b> <i>never</i><br><b>decoded.</b></p>
      <div class="cta">
        <a class="big-btn big-btn--solid" href="/" data-magnetic="0.15"><span>Back home</span><i aria-hidden="true">↗</i></a>
        <a class="big-btn" href="/works" data-magnetic="0.15"><span>View all works</span></a>
      </div>
    </section>`,
  };
}
