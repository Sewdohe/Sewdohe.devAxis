import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { shouldShowPost, sortPostsByDate } from '@/utils/markdown';
import type { Post } from '@/types';

export const GET: APIRoute = async () => {
  const allPosts = await getCollection('posts') as unknown as Post[];
  const posts = sortPostsByDate(allPosts.filter(shouldShowPost));

  const data = posts.map((post) => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description || '',
    url: `/posts/${post.id}/`,
    tags: post.data.tags || [],
  }));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
