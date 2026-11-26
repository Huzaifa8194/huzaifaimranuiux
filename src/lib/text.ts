// Decode effects. Text arrives as noise and resolves into something you can read,
// which is the whole job this portfolio describes.
import { gsap } from 'gsap';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scramble an element's text and resolve it left to right. */
export function scramble(el: HTMLElement, to?: string, duration = 0.7, delay = 0) {
  const text = to ?? el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = text;
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', text);
  if (reduced()) {
    el.textContent = text;
    return gsap.timeline();
  }
  const state = { p: 0 };
  let frame = 0;
  gsap.killTweensOf(state);
  return gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: 'power2.out',
    onStart: () => { el.style.visibility = 'visible'; },
    onUpdate: () => {
      if (frame++ % 2) return;
      const done = Math.floor(state.p * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out += i < done || c === ' ' || c === '\n' ? c : /[a-z]/.test(c) ? rnd().toLowerCase() : rnd();
      }
      el.textContent = out;
    },
    onComplete: () => { el.textContent = text; },
  });
}

/**
 * Title set in two voices at once: an italic serif and a heavy grotesk, letter by letter.
 * While it decodes, both the glyph and the voice keep changing.
 */
export function mixTitle(el: HTMLElement, lines: string[], duration = 0.9) {
  el.innerHTML = '';
  const spans: { el: HTMLSpanElement; c: string }[] = [];
  lines.forEach((line) => {
    const row = document.createElement('span');
    row.className = 'mix__row';
    [...line].forEach((c) => {
      const s = document.createElement('span');
      s.className = 'mix__c ' + (Math.random() > 0.5 ? 'is-serif' : 'is-sans');
      s.textContent = c === ' ' ? ' ' : c;
      row.appendChild(s);
      spans.push({ el: s, c });
    });
    el.appendChild(row);
  });
  if (reduced() || !duration) return gsap.timeline();
  const state = { p: 0 };
  let frame = 0;
  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      if (frame++ % 3) return;
      const done = Math.floor(state.p * spans.length);
      spans.forEach((s, i) => {
        if (s.c === ' ') return;
        if (i < done) { s.el.textContent = s.c; return; }
        s.el.textContent = rnd();
        s.el.className = 'mix__c ' + (Math.random() > 0.5 ? 'is-serif' : 'is-sans');
      });
    },
    onComplete: () => spans.forEach((s) => { if (s.c !== ' ') s.el.textContent = s.c; }),
  });
}

/** Wrap each character of an element in a span (for per letter motion). Keeps it readable. */
export function chars(el: HTMLElement) {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.innerHTML = '';
  return [...text].map((c) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    return s;
  });
}
