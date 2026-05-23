import { siteConfig } from '@/config';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Bump this when you change the template design to regenerate all images
const TEMPLATE_VERSION = 2;

const CACHE_DIR = join(process.cwd(), '.cache', 'og-images');

const fontCache = new Map<string, ArrayBuffer>();

function resolveFontFile(fontName: string, weight: number): string | null {
  const slug = fontName.toLowerCase().replace(/\s+/g, '-');
  const nm = join(process.cwd(), 'node_modules');

  // Try fontsource (specific weight, .woff only - Satori can't read .woff2)
  const fontsourcePath = join(nm, '@fontsource', slug, 'files', `${slug}-latin-${weight}-normal.woff`);
  if (existsSync(fontsourcePath)) return fontsourcePath;

  // Try nearby weights (.woff only)
  for (const w of [700, 600, 500, 400]) {
    const altPath = join(nm, '@fontsource', slug, 'files', `${slug}-latin-${w}-normal.woff`);
    if (existsSync(altPath)) return altPath;
  }

  // Try public/fonts/ (.ttf or .woff)
  const publicDir = join(process.cwd(), 'public', 'fonts');
  if (existsSync(publicDir)) {
    const weightName = weight >= 700 ? 'Bold' : 'Regular';
    for (const ext of ['.ttf', '.woff']) {
      for (const name of [
        `${fontName.replace(/\s+/g, '')}-${weightName}${ext}`,
        `${fontName.replace(/\s+/g, '')}${weightName}${ext}`,
        `${slug}-${weightName.toLowerCase()}${ext}`,
      ]) {
        const p = join(publicDir, name);
        if (existsSync(p)) return p;
      }
    }
    // Any .ttf or .woff in public/fonts/
    const files = readdirSync(publicDir) as string[];
    const font = files.find((f: string) => f.endsWith('.ttf') || f.endsWith('.woff'));
    if (font) return join(publicDir, font);
  }

  return null;
}

function loadFont(fontName: string, weight: number): ArrayBuffer | null {
  const key = `${fontName}-${weight}`;
  if (fontCache.has(key)) return fontCache.get(key)!;
  const fontPath = resolveFontFile(fontName, weight);
  if (!fontPath) return null;
  const data = readFileSync(fontPath).buffer as ArrayBuffer;
  fontCache.set(key, data);
  return data;
}

function getCacheKey(title: string): string {
  return createHash('sha256')
    .update(`v${TEMPLATE_VERSION}:${title}`)
    .digest('hex');
}

function getCachedImage(title: string): Buffer | null {
  const key = getCacheKey(title);
  const cachePath = join(CACHE_DIR, `${key}.png`);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }
  return null;
}

function setCachedImage(title: string, buffer: Buffer): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  const key = getCacheKey(title);
  writeFileSync(join(CACHE_DIR, `${key}.png`), buffer);
}

/**
 * OG Image Template
 *
 * Edit the template below to change how OG images look.
 * Preview your changes by opening /og-preview in dev mode.
 * Remember to bump TEMPLATE_VERSION above to bust the cache.
 *
 * Satori supports a subset of CSS flexbox. See:
 * https://github.com/vercel/satori#css
 */
export function ogTemplate(title: string) {
  const domain = siteConfig.site.replace(/https?:\/\//, '');
  const headingFont = siteConfig.fonts.families.heading;
  const bodyFont = siteConfig.fonts.families.body;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        width: '100%',
        height: '100%',
        backgroundColor: '#161616',
        padding: '60px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center' as const,
              gap: '16px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '48px',
                    fontWeight: 700,
                    fontFamily: headingFont,
                    color: '#fafafa',
                    lineHeight: 1.2,
                    maxWidth: '900px',
                    textAlign: 'center' as const,
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    fontFamily: bodyFont,
                    color: '#888888',
                  },
                  children: domain,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function generateOgImage(title: string): Promise<Buffer> {
  const cached = getCachedImage(title);
  if (cached) return cached;

  const headingFont = siteConfig.fonts.families.heading;
  const bodyFont = siteConfig.fonts.families.body;
  const headingFontData = loadFont(headingFont, 700);

  if (!headingFontData) {
    throw new Error(`[og-image] Could not find a Satori-compatible font (.ttf or .woff) for heading font "${headingFont}". Add one to public/fonts/.`);
  }

  const fonts: any[] = [
    {
      name: headingFont,
      data: headingFontData,
      weight: 700,
      style: 'normal' as const,
    },
  ];

  // Add body font if different and available (falls back to heading font in the template if missing)
  if (bodyFont !== headingFont) {
    const bodyFontData = loadFont(bodyFont, 400);
    if (bodyFontData) {
      fonts.push({
        name: bodyFont,
        data: bodyFontData,
        weight: 400,
        style: 'normal' as const,
      });
    }
  }

  const svg = await satori(ogTemplate(title), {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });

  const pngData = resvg.render();
  const buffer = Buffer.from(pngData.asPng());

  setCachedImage(title, buffer);

  return buffer;
}

export function ogResponse(pngBuffer: Buffer): Response {
  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
