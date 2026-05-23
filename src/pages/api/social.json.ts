import type { APIRoute } from 'astro';
import { siteConfig } from '@/config';
import { socialIconSvg } from '@/utils/icons';

const platformsWithIcons = siteConfig.navigation.social.map((p) => ({
  ...p,
  icon: socialIconSvg(p.icon || p.title, { size: 16, class: 'shrink-0', style: 'opacity:0.5' }),
}));

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(platformsWithIcons), {
    headers: { 'Content-Type': 'application/json' },
  });
};
