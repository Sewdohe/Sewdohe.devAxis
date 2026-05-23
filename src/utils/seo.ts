import type { Post, Page, SEOData } from '@/types';
import { siteConfig } from '@/config';

export function extractImagePath(image: string): string {
  if (!image || typeof image !== 'string') return '';
  if (image.startsWith('[[') && image.endsWith(']]')) {
    return image.slice(2, -2);
  }
  if (image.startsWith('"[[') && image.endsWith(']]"')) {
    return image.slice(3, -3);
  }
  return image;
}

function resolveImageUrl(imagePath: string, contentType: string, slug: string): string {
  if (imagePath.startsWith('http')) return imagePath;

  // Convert image extensions to .webp (sync-images.js converts them)
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');

  // Handle attachments path
  if (webpPath.includes('attachments/')) {
    const afterAttachments = webpPath.replace(/^.*attachments\//, '');
    return `/${contentType}/${slug}/${afterAttachments}`;
  }

  return `/${contentType}/${slug}/${webpPath}`;
}

export function generatePostSEO(post: Post, url: string): SEOData {
  const { title, description, image, imageOG, tags, published } = post.data;

  let ogImage: string | undefined;

  if (image && imageOG) {
    const imagePath = extractImagePath(image);
    const resolvedPath = resolveImageUrl(imagePath, 'posts', post.id);
    ogImage = imagePath.startsWith('http') ? imagePath : `${siteConfig.site}${resolvedPath}`;
  } else {
    ogImage = `${siteConfig.site}/open-graph/${post.id}.png`;
  }

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || `Post: ${title}`,
    canonicalUrl: url,
    ogImage,
    ogType: 'article',
    publishedTime: published instanceof Date ? published.toISOString() : new Date(published).toISOString(),
    tags: tags?.filter((tag: string | null) => tag !== null) as string[] || undefined,
  };
}

export function generatePageSEO(page: Page, url: string): SEOData {
  const { title, description } = page.data;

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || '',
    canonicalUrl: url,
    ogImage: `${siteConfig.site}/open-graph/${page.id}.png`,
    ogType: 'website',
  };
}

export function generateHomeSEO(url: string): SEOData {
  return {
    title: siteConfig.title,
    description: siteConfig.description,
    canonicalUrl: url,
    ogImage: `${siteConfig.site}/open-graph/index.png`,
    ogType: 'website',
  };
}

export function generateStructuredData(
  type: 'blog' | 'article' | 'website',
  data: Record<string, unknown>,
) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type === 'blog' ? 'Blog' : type === 'article' ? 'BlogPosting' : 'WebSite',
    ...data,
  });
}
