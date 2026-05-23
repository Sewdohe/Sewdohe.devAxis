/**
 * Theme colors for the Local Graph component.
 * Reads from Axis's CSS custom properties (--bg, --text, --muted, --accent, etc.)
 */

export interface GraphThemeColors {
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  currentNodeFill: string;
  linkStroke: string;
  highlight: string;
  tagFill: string;
  background: string;
}

export function getGraphThemeColors(): GraphThemeColors {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  const get = (name: string, fallback: string): string => {
    const val = style.getPropertyValue(name).trim();
    return val || fallback;
  };

  return {
    nodeFill: get('--muted', '#7a6f65'),
    nodeStroke: get('--border', '#e8e0d6'),
    nodeText: get('--text', '#1a1714'),
    currentNodeFill: get('--accent', '#b85c38'),
    linkStroke: get('--muted', '#7a6f65'),
    highlight: get('--accent', '#b85c38'),
    tagFill: get('--accent', '#b85c38'),
    background: get('--bg', '#faf8f5'),
  };
}
