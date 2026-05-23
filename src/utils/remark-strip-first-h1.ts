import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

/**
 * Strips the first h1 heading from markdown content.
 * Layouts render the title from frontmatter, so any h1 in the
 * markdown body would duplicate it.
 */
const remarkStripFirstH1: Plugin<[], Root> = () => {
  return (tree) => {
    let removed = false;
    visit(tree, 'heading', (node, index, parent) => {
      if (removed) return;
      if (node.depth !== 1 || !parent || index === undefined) return;
      parent.children.splice(index, 1);
      removed = true;
      return index;
    });
  };
};

export default remarkStripFirstH1;
