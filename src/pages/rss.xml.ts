import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig, siteUrl } from '@/config';
import { shouldShowPost, sortPostsByDate } from '@/utils/markdown';
import type { Post } from '@/types';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const parser = new MarkdownIt();
const siteBase = (import.meta.env.SITE || siteConfig.site).replace(/\/+$/, '') + '/';
const siteBaseNoSlash = (import.meta.env.SITE || siteConfig.site).replace(/\/+$/, '');

/** Resolve post image to same path as PostLayout (e.g. /posts/{id}/name.webp). */
function resolvePostImage(image: string, postId: string): string {
  let clean = image.replace(/^\.\//, '');
  if (clean.startsWith('images/') || clean.startsWith('attachments/')) {
    clean = clean.replace(/^(images|attachments)\//, '');
  }
  if (!clean.toLowerCase().endsWith('.svg') && !clean.toLowerCase().endsWith('.webp')) {
    clean = clean.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
  }
  return `/posts/${postId}/${clean}`;
}

function getOgImageUrl(post: Post): string {
  if (post.data.imageOG && post.data.image) {
    const img = post.data.image;
    if (img.startsWith('http')) return img;
    const path = resolvePostImage(img, post.id);
    return `${siteBaseNoSlash}${path.startsWith('/') ? path : '/' + path}`;
  }
  return `${siteBaseNoSlash}/open-graph/${post.id}.png`;
}

function getMimeType(url: string): string {
  if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
  if (url.endsWith('.webp')) return 'image/webp';
  if (url.endsWith('.gif')) return 'image/gif';
  if (url.endsWith('.svg')) return 'image/svg+xml';
  return 'image/png';
}

export async function GET() {
  const allPosts = await getCollection('posts') as unknown as Post[];
  const posts = sortPostsByDate(allPosts.filter(shouldShowPost));

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteBase,
    items: posts.map((post) => {
      const ogUrl = getOgImageUrl(post);
      const mimeType = getMimeType(ogUrl);
      const content = post.body
        ? sanitizeHtml(parser.render(post.body), {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          })
        : '';
      return {
        title: post.data.title,
        description: post.data.description || '',
        pubDate: post.data.published instanceof Date ? post.data.published : new Date(post.data.published),
        link: siteUrl(`posts/${post.id}`),
        categories: post.data.tags || [],
        author: siteConfig.author,
        content,
        customData: `<media:content type="${mimeType}" width="564" height="296" url="${ogUrl}"/>`,
      };
    }),
    customData: `
      <language>en</language>
      <copyright>Copyright ${new Date().getFullYear()} ${siteConfig.author}</copyright>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>Astro RSS</generator>
      <ttl>60</ttl>
    `,
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
      media: 'http://search.yahoo.com/mrss/',
    },
  });
}
