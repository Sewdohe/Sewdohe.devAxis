import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/config';
import type { Project } from '@/types';

export const GET: APIRoute = async () => {
  if (!siteConfig.contentTypes.projects) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allProjects = await getCollection('projects') as unknown as Project[];
  const projects = allProjects
    .filter(p => !p.data.draft)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const data = projects.map((project) => ({
    id: project.id,
    title: project.data.title,
    description: project.data.description || '',
    url: `/projects/${project.id}/`,
    tags: project.data.tags || [],
  }));

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
