import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig, siteUrl } from '@/config';
import { shouldShowPost, sortPostsByDate, formatDate } from '@/utils/markdown';
import type { Post, Page } from '@/types';

export const GET: APIRoute = async () => {
  const allPosts = await getCollection('posts') as unknown as Post[];
  const posts = sortPostsByDate(allPosts.filter(shouldShowPost));

  const allPages = await getCollection('pages') as unknown as Page[];
  const pages = allPages.filter((p) => !p.data.draft);

  const baseUrl = siteConfig.site.replace(/\/+$/, '');

  const lines: string[] = [
    `# ${siteConfig.title}`,
    '',
    `> ${siteConfig.description}`,
    '',
    `Website: ${baseUrl}/`,
    `Author: ${siteConfig.author}`,
    `Built with: Astro, Tailwind CSS`,
    '',
    '## Pages',
    '',
  ];

  for (const page of pages) {
    const title = page.data.title;
    const url = siteUrl(page.id);
    const desc = page.data.description ? ` - ${page.data.description}` : '';
    lines.push(`- [${title}](${url})${desc}`);
  }

  lines.push('', '## Posts', '');

  for (const post of posts) {
    const title = post.data.title;
    const url = siteUrl(`posts/${post.id}`);
    const date = formatDate(post.data.published);
    const desc = post.data.description ? ` - ${post.data.description}` : '';
    const tags = post.data.tags?.length ? ` [${post.data.tags.join(', ')}]` : '';
    lines.push(`- ${date} [${title}](${url})${desc}${tags}`);
  }

  const socialLinks = siteConfig.navigation?.social ?? [];
  if (socialLinks.length > 0) {
    lines.push('', '## Social', '');
    for (const link of socialLinks) {
      lines.push(`- ${link.title}: ${link.url}`);
    }
  }

  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
