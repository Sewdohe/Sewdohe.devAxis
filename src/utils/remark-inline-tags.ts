import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text } from 'mdast';

const remarkInlineTags: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;

      const text = node.value;
      const tagPattern = /(?:^|[\s\p{P}])#([\w-]+)/gu;
      const matches: Array<{ tag: string; start: number; end: number; hasPrefix: boolean }> = [];

      let match;
      while ((match = tagPattern.exec(text)) !== null) {
        const tag = match[1];
        const fullMatch = match[0];
        const hasPrefix = fullMatch.length > tag.length + 1;
        const start = match.index + (hasPrefix ? 1 : 0);
        const end = start + tag.length + 1;
        matches.push({ tag, start, end, hasPrefix });
      }

      if (matches.length === 0) return;

      const newChildren: any[] = [];
      let lastIndex = 0;

      matches.forEach(({ tag, start, end }) => {
        if (start > lastIndex) {
          const beforeText = text.slice(lastIndex, start);
          if (beforeText) {
            newChildren.push({ type: 'text', value: beforeText });
          }
        }

        // Render as plain styled text (no link to tag pages)
        newChildren.push({
          type: 'html',
          value: `<span class="inline-tag">#${tag}</span>`
        });

        lastIndex = end;
      });

      if (lastIndex < text.length) {
        const afterText = text.slice(lastIndex);
        if (afterText) {
          newChildren.push({ type: 'text', value: afterText });
        }
      }

      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
};

export default remarkInlineTags;
