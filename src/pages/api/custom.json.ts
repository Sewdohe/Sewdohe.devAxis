import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/config';

type CustomType = NonNullable<typeof siteConfig.customContentTypes>[number];

export const GET: APIRoute = async () => {
  const defs = (siteConfig.customContentTypes ?? []).filter(
    (t: CustomType) => t.enabled && t.showInCommandPalette !== false
  );

  if (defs.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const all: any[] = [];
  for (const def of defs) {
    try {
      const entries = await getCollection(def.id);
      for (const entry of entries as any[]) {
        if (entry.data?.draft && import.meta.env.PROD) continue;
        all.push({
          id: `${def.id}:${entry.id}`,
          title: entry.data?.title || entry.id,
          description: entry.data?.description ? `${def.label} — ${entry.data.description}` : def.label,
          url: `/${def.routeBase}/${entry.id}/`,
          section: def.label,
        });
      }
    } catch {
      // Collection may not exist yet (until plugin codegen runs)
    }
  }

  return new Response(JSON.stringify(all), {
    headers: { 'Content-Type': 'application/json' },
  });
};

