import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/config';
import type { Doc } from '@/types';

export const GET: APIRoute = async () => {
  if (!siteConfig.contentTypes.docs) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allDocs = await getCollection('docs') as unknown as Doc[];
  const docs = allDocs
    .filter(d => !d.data.draft)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

  const data = docs.map((doc) => ({
    id: doc.id,
    title: doc.data.title,
    description: doc.data.description || '',
    url: `/docs/${doc.id}/`,
    category: doc.data.category || '',
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
