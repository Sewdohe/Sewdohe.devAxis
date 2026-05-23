import type { Plugin } from 'unified';
import type { Root } from 'mdast';

/**
 * Like remark-breaks, converts soft line breaks to hard breaks (<br>),
 * but skips content inside blockquotes to avoid interfering with
 * Obsidian-style callout processing.
 */
const remarkBreaksSafe: Plugin<[], Root> = () => {
  function processNode(node: any, insideBlockquote: boolean) {
    if (node.type === 'blockquote') {
      insideBlockquote = true;
    }

    if (node.type === 'softBreak' && !insideBlockquote) {
      node.type = 'break';
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        processNode(child, insideBlockquote);
      }
    }
  }

  return (tree) => {
    processNode(tree, false);
  };
};

export default remarkBreaksSafe;
