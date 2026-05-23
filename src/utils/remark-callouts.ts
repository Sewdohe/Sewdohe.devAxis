import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';
import { lucideSvg } from './icons';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CalloutMapping {
  type: string;
  icon: string;
  title: string;
  color?: string;
}

function extractTextFromNode(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.children && Array.isArray(node.children)) {
    return node.children.map((child: any) => extractTextFromNode(child)).join('');
  }
  return '';
}

function getIconSVG(iconName: string): string {
  const svg = lucideSvg(iconName, { size: 16, class: 'callout-icon' });
  if (svg) return svg;
  return lucideSvg('info', { size: 16, class: 'callout-icon' });
}

// ─── Default Obsidian callout mappings ───

const calloutMappings: Record<string, CalloutMapping> = {
  // Blue (note)
  note: { type: 'note', icon: 'pencil', title: 'Note' },
  info: { type: 'note', icon: 'info', title: 'Info' },
  todo: { type: 'note', icon: 'circle-check', title: 'Todo' },
  // Cyan (tip / important / summary)
  tip: { type: 'tip', icon: 'flame', title: 'Tip' },
  hint: { type: 'tip', icon: 'flame', title: 'Hint' },
  important: { type: 'important', icon: 'flame', title: 'Important' },
  abstract: { type: 'important', icon: 'clipboard-list', title: 'Abstract' },
  summary: { type: 'important', icon: 'clipboard-list', title: 'Summary' },
  tldr: { type: 'important', icon: 'clipboard-list', title: 'TL;DR' },
  // Orange (warning / question)
  warning: { type: 'warning', icon: 'triangle-alert', title: 'Warning' },
  attention: { type: 'warning', icon: 'triangle-alert', title: 'Attention' },
  question: { type: 'warning', icon: 'circle-help', title: 'Question' },
  help: { type: 'warning', icon: 'circle-help', title: 'Help' },
  faq: { type: 'warning', icon: 'circle-help', title: 'FAQ' },
  // Red (caution / error / fail / bug)
  caution: { type: 'caution', icon: 'triangle-alert', title: 'Caution' },
  danger: { type: 'caution', icon: 'zap', title: 'Danger' },
  error: { type: 'caution', icon: 'zap', title: 'Error' },
  failure: { type: 'caution', icon: 'x', title: 'Failure' },
  fail: { type: 'caution', icon: 'x', title: 'Fail' },
  missing: { type: 'caution', icon: 'x', title: 'Missing' },
  bug: { type: 'caution', icon: 'bug', title: 'Bug' },
  // Green (success)
  success: { type: 'success', icon: 'check', title: 'Success' },
  check: { type: 'success', icon: 'check', title: 'Check' },
  done: { type: 'success', icon: 'check', title: 'Done' },
  // Purple (example)
  example: { type: 'example', icon: 'list', title: 'Example' },
  // Gray (quote)
  quote: { type: 'quote', icon: 'quote', title: 'Quote' },
  cite: { type: 'quote', icon: 'quote', title: 'Cite' },
};

// ─── Load custom callouts from callout-manager plugin ───

interface CalloutManagerData {
  callouts?: {
    custom?: Array<{
      type: string;
      color?: string;
      icon?: string;
    }>;
    settings?: Record<string, {
      color?: string;
      icon?: string;
    }>;
  };
}

let customCalloutsCSS = '';

function loadCustomCallouts() {
  const possiblePaths = [
    resolve('src/content/.obsidian/plugins/callout-manager/data.json'),
    resolve('.obsidian/plugins/callout-manager/data.json'),
  ];

  for (const dataPath of possiblePaths) {
    try {
      const raw = readFileSync(dataPath, 'utf-8');
      const data: CalloutManagerData = JSON.parse(raw);

      if (data.callouts?.custom) {
        for (const callout of data.callouts.custom) {
          const key = callout.type.toLowerCase();
          if (calloutMappings[key]) continue;
          calloutMappings[key] = {
            type: key,
            icon: callout.icon || 'info',
            title: callout.type.charAt(0).toUpperCase() + callout.type.slice(1),
            color: callout.color,
          };
          if (callout.color) {
            customCalloutsCSS += `.callout-${key} { --callout-color: ${callout.color}; --callout-bg: ${callout.color}11; }\n`;
            customCalloutsCSS += `.dark .callout-${key} { --callout-bg: ${callout.color}16; }\n`;
          }
        }
      }

      if (data.callouts?.settings) {
        for (const [key, settings] of Object.entries(data.callouts.settings)) {
          const lower = key.toLowerCase();
          if (calloutMappings[lower]) {
            if (settings.icon) calloutMappings[lower].icon = settings.icon;
            if (settings.color) {
              calloutMappings[lower].color = settings.color;
              customCalloutsCSS += `.callout-${calloutMappings[lower].type} { --callout-color: ${settings.color}; --callout-bg: ${settings.color}11; }\n`;
              customCalloutsCSS += `.dark .callout-${calloutMappings[lower].type} { --callout-bg: ${settings.color}16; }\n`;
            }
          }
        }
      }

      break;
    } catch {
      // File not found, try next path
    }
  }
}

loadCustomCallouts();

// ─── Plugin ───

const remarkCallouts: Plugin<[], Root> = () => {
  return (tree) => {
    let hasCallouts = false;

    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      const firstChild = node.children[0];
      if (!firstChild || firstChild.type !== 'paragraph') return;

      const firstParagraph = firstChild as Paragraph;
      const paragraphText = extractTextFromNode(firstParagraph);
      const calloutMatch = paragraphText.match(/^\[!([\w-]+)\]([+\-]?)(?:\s+([^\n]+))?/);
      if (!calloutMatch) return;

      hasCallouts = true;
      const [fullMatch, calloutType, collapseState, customTitle] = calloutMatch;
      const calloutKey = calloutType.toLowerCase();
      const mapping = calloutMappings[calloutKey] || {
        type: calloutKey,
        icon: 'info',
        title: calloutType.charAt(0).toUpperCase() + calloutType.slice(1)
      };

      const remainingText = paragraphText.slice(fullMatch.length).trim();
      const hasMultipleParagraphs = node.children.length > 1;

      const firstTextNode = firstParagraph.children.find((child: any) => child.type === 'text') as Text | undefined;
      const firstTextValue = firstTextNode?.value || '';
      const calloutStartsOnOwnLine = firstTextValue.match(/^\[![\w-]+\][+\-]?\s*\n/);

      const isCalloutOnOwnLine = hasMultipleParagraphs ||
                                calloutStartsOnOwnLine !== null ||
                                remainingText.length === 0;

      const calloutTitle = isCalloutOnOwnLine
        ? mapping.title
        : (customTitle || mapping.title);

      const isCollapsible = collapseState === '+' || collapseState === '-';
      const isCollapsed = collapseState === '-';

      let contentChildren = [...node.children];

      if (hasMultipleParagraphs) {
        contentChildren = contentChildren.slice(1);
      } else if (calloutStartsOnOwnLine) {
        if (firstTextNode) {
          const newlinePattern = /^\[![\w-]+\][+\-]?\s*\n\s*/;
          firstTextNode.value = firstTextNode.value.replace(newlinePattern, '');
        }
      } else if (remainingText.length === 0) {
        contentChildren = contentChildren.slice(1);
      } else if (remainingText) {
        const updateTextNode = (node: any): boolean => {
          if (node.type === 'text' && node.value) {
            const textValue = node.value as string;
            if (textValue.includes(fullMatch)) {
              const index = textValue.indexOf(fullMatch);
              const before = textValue.slice(0, index);
              const after = textValue.slice(index + fullMatch.length).replace(/^[\s\n]+/, '');
              node.value = before ? (before + ' ' + after) : after;
              return true;
            }
          }
          if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              if (updateTextNode(child)) return true;
            }
          }
          return false;
        };
        updateTextNode(firstParagraph);
      }

      const colorStyle = mapping.color
        ? ` style="--callout-color: ${mapping.color}; --callout-bg: ${mapping.color}11;"`
        : '';

      const toggleButton = isCollapsible ?
        `<button class="callout-toggle" aria-expanded="${!isCollapsed}" aria-label="Toggle callout content">
          <svg class="callout-toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        </button>` : '';

      const classes = `callout callout-${mapping.type}${isCollapsible ? ' callout-collapsible' : ''}${isCollapsed ? ' callout-collapsed' : ''}`;

      const calloutHtml: any = {
        type: 'html',
        value: `<div class="${classes}"${colorStyle}>
          <div class="callout-title">
            ${getIconSVG(mapping.icon)}
            <span>${calloutTitle}</span>
            ${toggleButton}
          </div>
          <div class="callout-content"${isCollapsed ? ' style="display: none;"' : ''}>`
      };

      const closeHtml: any = {
        type: 'html',
        value: '</div></div>'
      };

      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, calloutHtml, ...contentChildren, closeHtml);
      }
    });

    if (hasCallouts && customCalloutsCSS) {
      tree.children.unshift({
        type: 'html',
        value: `<style>${customCalloutsCSS}</style>`,
      } as any);
    }
  };
};

export default remarkCallouts;
