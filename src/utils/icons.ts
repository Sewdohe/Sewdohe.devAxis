import { library, icon as faIcon } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { icons as lucideIcons } from 'lucide';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

library.add(fab);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert a kebab-case icon name to PascalCase for lucide lookup.
 */
function toPascalCase(name: string): string {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

/**
 * Get an SVG string for a Lucide icon by kebab-case name.
 * Returns empty string if icon not found.
 */
export function lucideSvg(
  name: string,
  opts: { size?: number; class?: string; style?: string } = {},
): string {
  const { size = 16, class: cls, style } = opts;
  const pascal = toPascalCase(name);
  const iconData = (lucideIcons as Record<string, [string, Record<string, string>][]>)[pascal];
  if (!iconData) return '';

  const elements = iconData
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr}/>`;
    })
    .join('');

  const classAttr = cls ? ` class="${cls}"` : '';
  const styleAttr = style ? ` style="${style}"` : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${classAttr}${styleAttr}>${elements}</svg>`;
}

/**
 * Heroicons outline 24x24 — loaded from the heroicons npm package at build time.
 * All 324 icons are available by their exact kebab-case name.
 * Browse: https://heroicons.com
 */
const heroiconsCache = new Map<string, string | null>();

function loadHeroicon(name: string): string | null {
  if (heroiconsCache.has(name)) return heroiconsCache.get(name)!;

  try {
    const require = createRequire(import.meta.url);
    const heroiconsPath = require.resolve('heroicons/package.json');
    const svgPath = join(heroiconsPath, '..', '24', 'outline', `${name}.svg`);
    const svg = readFileSync(svgPath, 'utf-8');
    // Extract inner content (everything between <svg ...> and </svg>)
    const inner = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();
    heroiconsCache.set(name, inner);
    return inner;
  } catch {
    heroiconsCache.set(name, null);
    return null;
  }
}

/**
 * Get an SVG string for a Heroicons outline icon by exact name.
 * Uses the full heroicons library (324 icons). Names are kebab-case.
 * Browse all icons at https://heroicons.com
 * Returns empty string if icon not found.
 */
export function heroSvg(
  name: string,
  opts: { size?: number; class?: string; style?: string; title?: string } = {},
): string {
  const { size = 16, class: cls, style, title } = opts;

  const inner = loadHeroicon(name);

  if (!inner) {
    if (import.meta.env.DEV) console.warn(`[icons] Unknown Heroicon: "${name}" — browse https://heroicons.com for valid names`);
    return '';
  }

  const classAttr = cls ? ` class="${cls}"` : '';
  const styleAttr = style ? ` style="${style}"` : '';
  const titleTag = title ? `<title>${escapeHtml(title)}</title>` : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${classAttr}${styleAttr} aria-hidden="true">${titleTag}${inner}</svg>`;
}

/**
 * Get an SVG string for a Font Awesome brand icon by name.
 * Returns empty string if icon not found.
 */
export function faBrandSvg(
  name: string,
  opts: { size?: number; class?: string; style?: string; title?: string } = {},
): string {
  const { size = 16, class: cls, style, title } = opts;
  const result = faIcon({ prefix: 'fab', iconName: name as any });
  if (!result) return '';

  // FA returns full SVG HTML; extract the path data and rebuild at our size
  const [width, height, , , pathData] = result.icon;
  const classAttr = cls ? ` class="${cls}"` : '';
  const styleAttr = style ? ` style="${style}"` : '';
  const paths = Array.isArray(pathData)
    ? pathData.map((d: string) => `<path fill="currentColor" d="${d}"/>`).join('')
    : `<path fill="currentColor" d="${pathData}"/>`;
  const titleTag = title ? `<title>${escapeHtml(title)}</title>` : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${width} ${height}" fill="currentColor"${classAttr}${styleAttr} aria-hidden="true">${titleTag}${paths}</svg>`;
}

/**
 * Map a social service name to its Font Awesome brand icon name.
 * Handles common aliases and edge cases.
 * Returns null if no match found.
 */
const SERVICE_TO_FA: Record<string, string> = {
  '500px': '500px',
  behance: 'behance',
  bluesky: 'bluesky',
  codepen: 'codepen',
  deviantart: 'deviantart',
  discord: 'discord',
  dribbble: 'dribbble',
  ebay: 'ebay',
  facebook: 'facebook',
  flickr: 'flickr',
  github: 'github',
  gitlab: 'gitlab',
  goodreads: 'goodreads',
  instagram: 'instagram',
  'itch.io': 'itch-io',
  'last.fm': 'lastfm',
  lastfm: 'lastfm',
  letterboxd: 'letterboxd',
  linkedin: 'linkedin',
  mastodon: 'mastodon',
  medium: 'medium',
  mix: 'mix',
  npm: 'npm',
  patreon: 'patreon',
  pinterest: 'pinterest',
  'product hunt': 'product-hunt',
  producthunt: 'product-hunt',
  quora: 'quora',
  reddit: 'reddit',
  scribd: 'scribd',
  slideshare: 'slideshare',
  snapchat: 'snapchat',
  soundcloud: 'soundcloud',
  spotify: 'spotify',
  'stack overflow': 'stack-overflow',
  stackoverflow: 'stack-overflow',
  steam: 'steam',
  telegram: 'telegram',
  threads: 'threads',
  tiktok: 'tiktok',
  tumblr: 'tumblr',
  twitch: 'twitch',
  twitter: 'x-twitter',
  vimeo: 'vimeo',
  vk: 'vk',
  wikipedia: 'wikipedia-w',
  x: 'x-twitter',
  xbox: 'xbox',
  youtube: 'youtube',
};

export function matchFaBrandName(serviceName: string): string | null {
  const lower = serviceName.toLowerCase().trim();

  // Direct match
  if (SERVICE_TO_FA[lower]) return SERVICE_TO_FA[lower];

  // Try the name itself as a FA icon name
  const direct = faIcon({ prefix: 'fab', iconName: lower as any });
  if (direct) return lower;

  // Try kebab-case version
  const kebab = lower.replace(/\s+/g, '-');
  const kebabResult = faIcon({ prefix: 'fab', iconName: kebab as any });
  if (kebabResult) return kebab;

  return null;
}

/**
 * Get the best icon SVG for a page/nav item.
 * Tries Heroicons first, then FA brands, then falls back to a default.
 */
export function pageIconSvg(
  iconName: string,
  isExternal: boolean,
  opts: { size?: number; class?: string; style?: string } = {},
): string {
  // Try Heroicon first
  const hero = heroSvg(iconName, opts);
  if (hero) return hero;
  // Try FA brand
  const faName = matchFaBrandName(iconName);
  if (faName) {
    const svg = faBrandSvg(faName, opts);
    if (svg) return svg;
  }
  // Fallback based on link type
  return heroSvg(isExternal ? 'arrow-top-right-on-square' : 'document-text', opts);
}

/**
 * Get the best icon SVG for a social service.
 * Tries FA brand icon first, falls back to Heroicons link icon.
 */
export function socialIconSvg(
  serviceName: string,
  opts: { size?: number; class?: string; style?: string; title?: string } = {},
): string {
  const faName = matchFaBrandName(serviceName);
  if (faName) {
    const svg = faBrandSvg(faName, opts);
    if (svg) return svg;
  }
  return heroSvg('link', opts);
}
