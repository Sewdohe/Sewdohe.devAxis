import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/config';
import { heroSvg } from '@/utils/icons';

const SPECIAL_URLS: Record<string, string> = {
  home: '/',
  posts: `/${siteConfig.routes?.postsBase || 'posts'}/`,
  projects: `/${siteConfig.routes?.projectsBase || 'projects'}/`,
  docs: `/${siteConfig.routes?.docsBase || 'docs'}/`,
  social: '/social/',
};

const EXCLUDE_SPECIAL = ['404'];

// Build config page icon map (URL → SVG)
const configPageIcons: Record<string, string> = {};
for (const page of siteConfig.pages) {
  const isExternal = page.url.startsWith('http');
  const defaultIcon = isExternal ? 'external-link' : 'file';
  configPageIcons[page.url] = heroSvg((page as any).icon || defaultIcon, {
    size: 16,
    class: 'shrink-0',
    style: 'opacity:0.5',
  });
}

const defaultPageIcon = heroSvg('file', { size: 16, class: 'shrink-0', style: 'opacity:0.5' });
const defaultExternalIcon = heroSvg('external-link', { size: 16, class: 'shrink-0', style: 'opacity:0.5' });

function getPageIcon(url: string): string {
  if (configPageIcons[url]) return configPageIcons[url];
  if (url.startsWith('http')) return defaultExternalIcon;
  return defaultPageIcon;
}

export const GET: APIRoute = async () => {
  const allPages = await getCollection('pages');
  const pages = allPages
    .filter((page: any) => !page.data.noIndex && !page.data.draft)
    .map((page: any) => {
      const url = `/${page.id}/`;
      return {
        title: page.data.title,
        description: page.data.description || '',
        url,
        icon: getPageIcon(url),
      };
    });

  // Include indexable special pages (social, etc.)
  const allSpecial = await getCollection('special');
  for (const sp of allSpecial) {
    const slug = sp.id.replace(/\/index$/, '');
    if (EXCLUDE_SPECIAL.includes(slug)) continue;
    const url = SPECIAL_URLS[slug] || `/${slug}/`;
    pages.push({
      title: sp.data.title,
      description: sp.data.description || '',
      url,
      icon: getPageIcon(url),
    });
  }

  // Include indexed redirects as searchable pages
  const allRedirects = await getCollection('redirects');
  for (const r of allRedirects) {
    if (!(r.data as any).indexed) continue;
    const link = (r.data as any).link || '';
    const isExt = link.startsWith('http');
    pages.push({
      title: (r.data as any).title,
      description: '',
      url: isExt ? link : `/${r.id}/`,
      external: isExt,
      icon: defaultExternalIcon,
    });
  }

  return new Response(JSON.stringify(pages), {
    headers: { 'Content-Type': 'application/json' },
  });
};
