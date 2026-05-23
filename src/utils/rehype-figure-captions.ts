import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

export function rehypeFigureCaptions() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (
        node.tagName !== 'img' ||
        !node.properties?.['dataCaption'] ||
        index === undefined ||
        !parent ||
        !('children' in parent)
      ) return;

      // Skip if already inside a <figure>
      if ((parent as Element).tagName === 'figure') return;

      const caption = String(node.properties['dataCaption']);

      const figure: Element = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['image-figure'] },
        children: [
          node,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: caption }],
          },
        ],
      };

      (parent as Element).children[index] = figure;
    });
  };
}

export default rehypeFigureCaptions;
