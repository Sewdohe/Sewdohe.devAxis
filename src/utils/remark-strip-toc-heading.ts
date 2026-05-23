import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

/**
 * Strips standalone "## Contents" / "## Table of Contents" / "## TOC" headings
 * that were used by remark-toc. Since we have our own TOC component, these
 * headings are no longer needed.
 */
const remarkStripTocHeading: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'heading', (node, index, parent) => {
      if (node.depth !== 2 || !parent || index === undefined) return;

      const text = node.children
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.value)
        .join('')
        .trim()
        .toLowerCase();

      if (text === 'contents' || text === 'table of contents' || text === 'toc') {
        parent.children.splice(index, 1);
        return index; // revisit this index since we removed a node
      }
    });
  };
};

export default remarkStripTocHeading;
