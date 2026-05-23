import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';
import { existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const dimensionCache = new Map<string, { width: number; height: number } | null>();

async function getImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  if (dimensionCache.has(src)) return dimensionCache.get(src)!;

  // Resolve to file on disk: /posts/foo/bar.webp -> public/posts/foo/bar.webp
  // Also try the original extension if .webp doesn't exist yet (dev mode)
  const candidates = [join(process.cwd(), 'public', src)];
  if (src.endsWith('.webp')) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.gif']) {
      candidates.push(join(process.cwd(), 'public', src.replace(/\.webp$/, ext)));
    }
  }

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      try {
        const metadata = await sharp(filePath).metadata();
        if (metadata.width && metadata.height) {
          const dims = { width: metadata.width, height: metadata.height };
          dimensionCache.set(src, dims);
          return dims;
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  dimensionCache.set(src, null);
  return null;
}

export function rehypeImageAttributes() {
  return async (tree: Root) => {
    const imgNodes: Element[] = [];

    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') {
        imgNodes.push(node);
      }
    });

    // Process all images (including async dimension reads)
    await Promise.all(imgNodes.map(async (node) => {
      const properties = node.properties || {};
      const src = (properties.src as string) || '';

      // Convert image paths to WebP if applicable
      if (src && typeof src === 'string' && !src.startsWith('http') && !src.toLowerCase().endsWith('.webp') && !src.toLowerCase().endsWith('.svg')) {
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(src)) {
          properties.src = src.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
        }
      }

      // Obsidian image resize syntax: ![alt|width](url) or ![alt|widthxheight](url)
      const alt = (properties.alt as string) || '';
      const pipeIndex = alt.lastIndexOf('|');
      if (pipeIndex !== -1) {
        const dimensionStr = alt.substring(pipeIndex + 1).trim();
        const cleanAlt = alt.substring(0, pipeIndex).trim();
        const dimMatch = dimensionStr.match(/^(\d+)(?:x(\d+))?$/);
        if (dimMatch) {
          properties.width = dimMatch[1];
          if (dimMatch[2]) properties.height = dimMatch[2];
          properties.alt = cleanAlt;
        }
      }

      if (!properties.loading) properties.loading = 'lazy';
      if (!properties.decoding) properties.decoding = 'async';
      if (!properties.alt) properties.alt = '';

      // Inject width/height to prevent layout shift (only for local images without existing dimensions)
      const finalSrc = (properties.src as string) || '';
      if (finalSrc && !finalSrc.startsWith('http') && !properties.width && !properties.height) {
        const dims = await getImageDimensions(finalSrc);
        if (dims) {
          properties.width = String(dims.width);
          properties.height = String(dims.height);
        }
      }
    }));
  };
}

export default rehypeImageAttributes;
