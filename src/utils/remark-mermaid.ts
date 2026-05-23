import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';

const remarkMermaid: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'mermaid') return;
      if (!node.value || typeof node.value !== 'string') return;

      const diagramId = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      const mermaidHtml: any = {
        type: 'html',
        value: `<div class="mermaid-diagram" data-mermaid-id="${diagramId}" data-mermaid-source="${encodeURIComponent(node.value)}">
          <div class="mermaid-diagram-content">
            <pre class="mermaid-diagram-source"><code>${node.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        </div>`
      };

      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, mermaidHtml);
      }
    });
  };
};

export default remarkMermaid;
