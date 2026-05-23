import type { APIRoute } from 'astro';
import { getSiteBase } from '@/config';

export const GET: APIRoute = () => {
  const base = getSiteBase();

  const robotsTxt = `# Content Signals (https://contentsignals.org/, IETF draft-romm-aipref-contentsignals)
# declare AI usage preferences. Recognized by AI/agent crawlers and Cloudflare;
# Semrush's strict RFC 9309 audit flags it as "invalid format" — known false
# positive, the directive is intentionally non-standard.
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=no
Allow: /
Disallow: /api/

Sitemap: ${base}/sitemap-index.xml

# See ${base}/llms.txt for machine-readable site content.
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
