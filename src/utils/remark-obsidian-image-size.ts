/**
 * remark-obsidian-image-size
 *
 * Supports Obsidian-style image sizing in markdown:
 *   ![alt|200](img.png)       -> width: 200px
 *   ![alt|100x150](img.png)   -> width: 100px, height: 150px
 *
 * Parses the pipe-separated size from the alt text and applies
 * width/height as hProperties on the image node.
 */
import { visit } from 'unist-util-visit';

export default function remarkObsidianImageSize() {
  return function transformer(tree: any) {
    visit(tree, 'image', (node: any) => {
      if (!node.alt || typeof node.alt !== 'string') return;

      const pipeIndex = node.alt.lastIndexOf('|');
      if (pipeIndex === -1) return;

      const sizeStr = node.alt.substring(pipeIndex + 1).trim();
      const cleanAlt = node.alt.substring(0, pipeIndex).trim();

      // Match WxH or just W
      const sizeMatch = sizeStr.match(/^(\d+)(?:x(\d+))?$/);
      if (!sizeMatch) return;

      const width = sizeMatch[1];
      const height = sizeMatch[2];

      // Update alt text to remove size suffix
      node.alt = cleanAlt;

      // Set hProperties for width/height
      if (!node.data) node.data = {};
      if (!node.data.hProperties) node.data.hProperties = {};
      node.data.hProperties.width = width;
      if (height) {
        node.data.hProperties.height = height;
      }
    });
  };
}
