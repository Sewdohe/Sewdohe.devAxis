import type { Plugin } from 'unified';
import { visit, SKIP } from 'unist-util-visit';
import type { Root, Text, Paragraph } from 'mdast';

/** Recursively extract plain text from any mdast node */
function extractText(node: any): string {
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}

export const remarkObsidianComments: Plugin<[], Root> = () => {
  return (tree: Root) => {
    const nodesToRemove: Array<{ parent: any; index: number }> = [];

    // Pass 1: Remove whole-paragraph comments where the serialized text
    // starts with %% and ends with %%. This handles cases where URLs or
    // other formatting inside the comment create non-text child nodes
    // (e.g. autolinked URLs become link nodes, splitting the %% markers
    // across different text nodes so the per-node regex can't match).
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      const fullText = node.children.map(extractText).join('').trim();
      if (fullText.startsWith('%%') && fullText.endsWith('%%')) {
        nodesToRemove.push({ parent, index });
        return SKIP;
      }
    });

    // Pass 2: Strip inline %% ... %% within individual text nodes
    visit(tree, 'text', (node: Text) => {
      if (typeof node.value === 'string') {
        node.value = node.value.replace(/%%[\s\S]*?%%/g, '');
      }
    });

    // Pass 3: Clean up paragraphs left empty by inline comment removal
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (nodesToRemove.some((n) => n.parent === parent && n.index === index)) return;

      const hasContent = node.children.some((child: any) => {
        if (child.type === 'text') return child.value.trim().length > 0;
        return true;
      });

      if (!hasContent) {
        nodesToRemove.push({ parent, index });
      }
    });

    // Remove marked nodes in reverse index order
    nodesToRemove
      .sort((a, b) => b.index - a.index)
      .forEach(({ parent, index }) => {
        if (Array.isArray(parent.children)) {
          parent.children.splice(index, 1);
        }
      });
  };
};
