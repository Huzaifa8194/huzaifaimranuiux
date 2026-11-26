// Each case study borrows a little of its product's own world: a tinted paper, the product's
// dark ground, its signal colour (one cut for light paper, one for the dark zone) and a faint
// backdrop pattern (drawn in CSS, keyed by the slug). Just enough to tell which room you are in.
export type Skin = { paper: string; ink: string; accent: string; accentInk: string };

export const skins: Record<string, Skin> = {
  // radar night, risk red
  digiinn360: { paper: '#e4e9f1', ink: '#03070f', accent: '#f0283a', accentInk: '#ff3341' },
  // stone and amber
  shadowad: { paper: '#ebe7dd', ink: '#0e0f12', accent: '#d98200', accentInk: '#f5a524' },
  // ink-blue flood, forge gold
  sysbastion: { paper: '#dbe5f8', ink: '#0d1a36', accent: '#1d3461', accentInk: '#d6a55c' },
  // hardware black, cyan
  'aegis-shield': { paper: '#e3eaee', ink: '#050608', accent: '#0796b8', accentInk: '#35d0f0' },
  // cutting-mat teal
  aeronexus: { paper: '#dcf3ec', ink: '#071018', accent: '#0c9488', accentInk: '#2dd4bf' },
  // night purple, lime light
  darkintel360: { paper: '#efe5fb', ink: '#2a1145', accent: '#8a2fd0', accentInk: '#c6f36d' },
  // glass teal and lavender
  appsiege: { paper: '#e6ecef', ink: '#070a0d', accent: '#6a55f0', accentInk: '#4fe3cf' },
};

const KEYS: [keyof Skin, string][] = [['paper', '--skin-paper'], ['ink', '--skin-ink'], ['accent', '--skin-accent'], ['accentInk', '--skin-accent-ink']];

export function applySkin(slug?: string) {
  const html = document.documentElement;
  const s = slug ? skins[slug] : undefined;
  if (!s) {
    delete html.dataset.skin;
    KEYS.forEach(([, v]) => html.style.removeProperty(v));
    return;
  }
  html.dataset.skin = slug!;
  KEYS.forEach(([k, v]) => html.style.setProperty(v, s[k]));
}
