import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Image } from 'mdast';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.3gp', '.flac', '.aac'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.mov', '.mkv', '.avi'];
const PDF_EXTENSIONS = ['.pdf'];
const SVG_EXTENSIONS = ['.svg'];

const YOUTUBE_PATTERNS = [
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
  /^https?:\/\/youtu\.be\/([^&\n?#]+)/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/
];


const TWITTER_PATTERNS = [
  /^https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/,
  /^https?:\/\/(?:www\.)?x\.com\/\w+\/status\/(\d+)/
];

function getFileExtension(url: string): string {
  const pathname = new URL(url, 'http://example.com').pathname;
  const lastDot = pathname.lastIndexOf('.');
  return lastDot !== -1 ? pathname.substring(lastDot).toLowerCase() : '';
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTwitterPostId(url: string): string | null {
  for (const pattern of TWITTER_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function createHtmlNode(html: string): any {
  return { type: 'html', value: html };
}

/**
 * Resolve a relative URL to an absolute path for folder-based content.
 * Files live directly in the post/page folder (no attachments subfolder).
 * e.g. src/content/posts/my-post/sound.wav -> /posts/my-post/sound.wav
 */
function resolveRelativeUrl(url: string, filePath: string): string {
  if (!filePath || url.startsWith('/') || url.startsWith('http')) return url;

  // Normalize to forward slashes for cross-platform (Windows) compatibility
  const normalized = filePath.replace(/\\/g, '/');
  const isFolderPost = normalized.includes('/posts/') && normalized.endsWith('/index.md');
  const isFolderPage = normalized.includes('/pages/') && normalized.endsWith('/index.md');

  if (isFolderPost || isFolderPage) {
    const pathParts = normalized.split('/');
    const collection = isFolderPage ? 'pages' : 'posts';
    const contentIndex = pathParts.indexOf(collection);
    const contentSlug = pathParts[contentIndex + 1];

    // Strip attachments/ or images/ prefix if present (legacy support)
    const cleanUrl = url.replace(/^(attachments|images)\//, '');
    return `/${collection}/${contentSlug}/${cleanUrl}`;
  }

  // File-based content fallback
  const collection = normalized.includes('/pages/') ? 'pages' : 'posts';
  return `/${collection}/${url}`;
}

export const remarkObsidianEmbeds: Plugin<[], Root> = () => {
  return (tree: Root, file: any) => {
    const filePath = file.path || file.history?.[0] || '';


    visit(tree, 'image', (node: Image, index, parent) => {
      if (!node.url || !parent || typeof index !== 'number') return;

      let url = node.url;
      const pipeIndex = url.indexOf('|');
      if (pipeIndex !== -1) url = url.slice(0, pipeIndex);
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) url = url.slice(0, hashIndex);

      const alt = node.alt || '';
      const extension = getFileExtension(url);

      // Web embeds (YouTube, X)
      if (isExternalUrl(url)) {
        const twitterPostId = extractTwitterPostId(url);
        if (twitterPostId) {
          const title = alt || 'X post';
          const html = `<blockquote class="twitter-tweet" data-twitter-embed data-conversation="none" title="${title}"><a href="https://twitter.com/x/status/${twitterPostId}"></a></blockquote>`;
          parent.children[index] = createHtmlNode(html);
          return;
        }

        const youtubeVideoId = extractYouTubeVideoId(url);
        if (youtubeVideoId) {
          const title = alt || 'YouTube video';
          const html = `<lite-youtube class="video-embed" videoid="${youtubeVideoId}" videotitle="${title}"><a class="lite-youtube-fallback" href="https://www.youtube.com/watch?v=${youtubeVideoId}">Watch on YouTube: "${title}"</a></lite-youtube>`;
          parent.children[index] = createHtmlNode(html);
          return;
        }

      }

      // Resolve relative URLs for local media files
      const resolvedUrl = resolveRelativeUrl(url, filePath);

      // Audio
      if (AUDIO_EXTENSIONS.includes(extension)) {
        const title = alt || url.split('/').pop() || 'Audio file';
        parent.children[index] = createHtmlNode(`<div class="audio-embed"><audio class="audio-player" controls src="${resolvedUrl}" title="${title}"></audio></div>`);
        return;
      }

      // Video
      if (VIDEO_EXTENSIONS.includes(extension)) {
        const title = alt || url.split('/').pop() || 'Video file';
        parent.children[index] = createHtmlNode(`<div class="video-embed"><video class="video-player" controls preload="metadata" src="${resolvedUrl}" title="${title}"></video></div>`);
        return;
      }

      // PDF
      if (PDF_EXTENSIONS.includes(extension)) {
        const originalUrl = node.url;
        const hashIdx = originalUrl.indexOf('#');
        const fragment = hashIdx !== -1 ? originalUrl.slice(hashIdx) : '';
        const filename = url.split('/').pop() || 'document.pdf';
        const title = alt || filename;
        const pdfUrl = resolvedUrl + fragment;
        parent.children[index] = createHtmlNode(`<div class="pdf-embed"><iframe class="pdf-viewer" src="${pdfUrl}" title="${title}"></iframe><div class="pdf-info"><span class="pdf-filename">${filename}</span><a href="${pdfUrl}" download class="pdf-download-link" target="_blank">Download PDF</a></div></div>`);
        return;
      }

      // SVG
      if (SVG_EXTENSIONS.includes(extension)) {
        parent.children[index] = createHtmlNode(`<div class="svg-embed"><img src="${resolvedUrl}" alt="${alt}" class="svg-image" /></div>`);
        return;
      }
    });

  };
};
