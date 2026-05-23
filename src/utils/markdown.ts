import type { Post } from '@/types';

export function shouldShowPost(post: Post): boolean {
  if (!post?.data) return false;
  // Show drafts in dev mode, hide in production/preview
  if (post.data.draft && import.meta.env.PROD) return false;
  return true;
}

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.data.published);
    const dateB = new Date(b.data.published);
    return dateB.getTime() - dateA.getTime();
  });
}

export function formatDate(date: Date): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNum = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${monthNames[date.getUTCMonth()]} ${dayNum}, ${year}`;
}

/**
 * Find related posts for a given post.
 * Priority: directly linked posts (by link count, then recency),
 * then tag-matching posts (by shared tag count, then recency).
 */
export function getRelatedPosts(
  currentPost: Post,
  allPosts: Post[],
  limit: number = 3
): Post[] {
  const otherPosts = allPosts.filter(
    (p) => p.id !== currentPost.id && shouldShowPost(p)
  );
  if (otherPosts.length === 0) return [];

  const body = currentPost.body || '';

  // Count direct links to other posts via wikilinks and markdown links
  const linkCounts = new Map<string, number>();

  for (const post of otherPosts) {
    let count = 0;
    const slug = post.id;
    const title = post.data.title;

    // Match wikilinks: [[slug]] or [[slug|display]]
    const wikiPattern = new RegExp(
      `\\[\\[${escapeRegex(slug)}(\\|[^\\]]*)?\\]\\]`,
      'gi'
    );
    const wikiMatches = body.match(wikiPattern);
    if (wikiMatches) count += wikiMatches.length;

    // Match wikilinks by title
    const wikiTitlePattern = new RegExp(
      `\\[\\[${escapeRegex(title)}(\\|[^\\]]*)?\\]\\]`,
      'gi'
    );
    const wikiTitleMatches = body.match(wikiTitlePattern);
    if (wikiTitleMatches) count += wikiTitleMatches.length;

    // Match markdown links: [text](/posts/slug)
    const mdPattern = new RegExp(
      `\\]\\(/posts/${escapeRegex(slug)}[/)\\s]`,
      'gi'
    );
    const mdMatches = body.match(mdPattern);
    if (mdMatches) count += mdMatches.length;

    if (count > 0) {
      linkCounts.set(post.id, count);
    }
  }

  // Score posts: linked posts get high priority
  const scored = otherPosts.map((post) => {
    const directLinks = linkCounts.get(post.id) || 0;
    const currentTags = currentPost.data.tags || [];
    const postTags = post.data.tags || [];
    const sharedTags = currentTags.filter((t) =>
      postTags.some((pt) => pt.toLowerCase() === t.toLowerCase())
    ).length;
    const recency = new Date(post.data.published).getTime();

    return { post, directLinks, sharedTags, recency };
  });

  // Sort: direct links first (desc), then shared tags (desc), then recency (desc)
  scored.sort((a, b) => {
    if (a.directLinks !== b.directLinks) return b.directLinks - a.directLinks;
    if (a.sharedTags !== b.sharedTags) return b.sharedTags - a.sharedTags;
    return b.recency - a.recency;
  });

  // Only return posts that have at least some connection (linked or shared tags)
  const related = scored.filter(
    (s) => s.directLinks > 0 || s.sharedTags > 0
  );

  return related.slice(0, limit).map((s) => s.post);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
