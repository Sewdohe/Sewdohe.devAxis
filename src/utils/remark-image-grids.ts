import type { Root, Paragraph, Image } from 'mdast';
import { visit } from 'unist-util-visit';

export function remarkImageGrids() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
      if (!node.children || node.children.length === 0) return;

      const images: Image[] = [];
      const otherNodes: any[] = [];

      node.children.forEach((child) => {
        if (child.type === 'image') {
          images.push(child as Image);
        } else if (
          child.type === 'link' &&
          child.children &&
          child.children.some((linkChild: any) => linkChild.type === 'image')
        ) {
          otherNodes.push(child);
        } else if (child.type !== 'text' || (child as any).value.trim() !== '') {
          otherNodes.push(child);
        }
      });

      if (images.length >= 2 && otherNodes.length === 0) {
        if (!node.data) node.data = {};
        if (!node.data.hProperties) node.data.hProperties = {};

        const hProperties = node.data.hProperties as Record<string, any>;
        const existingClasses = (hProperties.class || '').split(' ').filter(Boolean);
        const filteredClasses = existingClasses.filter((cls: string) => !cls.startsWith('image-grid'));
        const gridClass = `image-grid-${Math.min(images.length, 6)}`;
        hProperties.class = [...filteredClasses, 'image-grid', gridClass].join(' ');
      }
    });
  };
}

export default remarkImageGrids;
