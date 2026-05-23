import type { Plugin } from 'unified';
import type { Root, Paragraph, Math as MdastMath } from 'mdast';
import type { InlineMath } from 'mdast-util-math';

/**
 * Obsidian renders single-line `$$expr$$` as display math, but remark-math v6
 * only does so when the fences are on their own lines. This plugin promotes
 * paragraphs containing exactly one `inlineMath` whose source begins with `$$`
 * to a top-level `math` (display) node.
 */
const remarkObsidianDisplayMath: Plugin<[], Root> = () => (tree, file) => {
  const source = String(file.value);

  function walk(parent: any) {
    if (!parent.children) return;
    for (let i = 0; i < parent.children.length; i++) {
      const node = parent.children[i];
      if (node.type === 'paragraph') {
        const p = node as Paragraph;
        if (
          p.children.length === 1 &&
          p.children[0].type === 'inlineMath' &&
          p.position?.start.offset != null &&
          source.startsWith('$$', p.position.start.offset)
        ) {
          const im = p.children[0] as InlineMath;
          const mathNode: MdastMath = {
            type: 'math',
            value: im.value,
            position: p.position,
            data: {
              hName: 'pre',
              hChildren: [
                {
                  type: 'element',
                  tagName: 'code',
                  properties: { className: ['language-math', 'math-display'] },
                  children: [{ type: 'text', value: im.value }],
                },
              ],
            },
          };
          parent.children[i] = mathNode;
          continue;
        }
      }
      walk(node);
    }
  }

  walk(tree);
};

export default remarkObsidianDisplayMath;
