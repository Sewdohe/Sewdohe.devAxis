import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

function ensureTrailingSlash(href: string): string {
  if (!href || href === '/' || href.startsWith('#')) return href;
  const hashIndex = href.indexOf('#');
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
  if (path.endsWith('/')) return href;
  return path + '/' + hash;
}

export function rehypeNormalizeAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index: number | undefined, parent: any) => {
      if (node.tagName === 'a') {
        const className = node.properties?.className;

        let hasAnchorLinkClass = false;
        if (Array.isArray(className)) {
          hasAnchorLinkClass = className.some((c: any) =>
            typeof c === 'string' && c.includes('anchor-link')
          );
        } else if (typeof className === 'string') {
          hasAnchorLinkClass = className.includes('anchor-link');
        }

        if (hasAnchorLinkClass) return;

        if (parent && typeof parent === 'object' && 'tagName' in parent) {
          const parentTag = String(parent.tagName || '').toLowerCase();
          if (/^h[1-6]$/.test(parentTag)) return;
        }

        const hrefValue = node.properties?.href;
        let href: string | null = null;

        if (typeof hrefValue === 'string') {
          href = hrefValue;
        } else if (Array.isArray(hrefValue) && hrefValue.length > 0 && typeof hrefValue[0] === 'string') {
          href = hrefValue[0];
        }

        if (!href) return;

        if (href.startsWith('/') && href.length > 1 && !href.startsWith('//')) {
          const normalized = ensureTrailingSlash(href);
          if (normalized !== href && node.properties) {
            node.properties.href = normalized;
          }
        }

        if (href.startsWith('#') && href.length > 1) {
          if (parent && typeof parent === 'object' && 'tagName' in parent) {
            const parentTag = String(parent.tagName || '').toLowerCase();
            if (/^h[1-6]$/.test(parentTag)) return;
          }

          let anchorText = href.substring(1);

          try {
            const decoded = decodeURIComponent(anchorText);
            if (decoded !== anchorText) anchorText = decoded;
          } catch {}

          const anchorSlug = anchorText
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');

          if (!node.properties) node.properties = {};
          node.properties.href = `#${anchorSlug}`;

          let existingClasses: string[] = [];
          if (node.properties.className) {
            if (Array.isArray(node.properties.className)) {
              existingClasses = node.properties.className.filter((c): c is string => typeof c === 'string');
            } else if (typeof node.properties.className === 'string') {
              existingClasses = node.properties.className.split(/\s+/).filter(Boolean);
            }
          }

          if (!existingClasses.includes('wikilink')) {
            existingClasses.push('wikilink');
          }

          node.properties.className = existingClasses.join(' ');
        }
      }
    });
  };
}
