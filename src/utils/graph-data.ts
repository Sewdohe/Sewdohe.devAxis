/**
 * Server-side check: does the graph have at least 2 connected nodes for this slug?
 * Used to avoid rendering the graph widget when there's nothing to show (no pop-in, no gap).
 */
import { readFileSync } from "fs";
import { join } from "path";

let cached: { nodes: { id: string }[]; connections: { source: string; target: string }[] } | null = null;

function loadGraphData(): typeof cached {
  if (cached) return cached;
  try {
    const filePath = join(process.cwd(), "public", "graph", "graph-data.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as { nodes: { id: string }[]; connections: { source: string; target: string }[] };
    cached = data;
    return data;
  } catch {
    return null;
  }
}

export function hasGraphDataForSlug(slug: string): boolean {
  if (!slug) return false;
  const data = loadGraphData();
  if (!data) return false;
  const node = data.nodes.find((n) => n.id === slug);
  if (!node) return false;
  const connected = new Set([slug]);
  for (const c of data.connections) {
    if (c.source === slug || c.target === slug) {
      connected.add(c.source);
      connected.add(c.target);
    }
  }
  return connected.size >= 2;
}
