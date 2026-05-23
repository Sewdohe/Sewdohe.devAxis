#!/usr/bin/env node

/**
 * Graph Data Generation Script
 *
 * This script generates graph data for the local graph feature by analyzing
 * post connections (both wikilinks and standard links) and tag relationships.
 *
 * The generated data includes:
 * - Post nodes with metadata (title, slug, date, tags)
 * - Tag nodes with metadata (name, color)
 * - Connections between posts (direct links)
 * - Connections between posts and tags (shared tags)
 *
 * This data is used by the LocalGraph component to render an Obsidian-like graph view.
 *
 * ID Generation Strategy:
 * - Uses path-based IDs (no frontmatter required)
 * - Single files: "my-post.md" → ID: "my-post"
 * - Folder-based: "my-folder/index.md" → ID: "my-folder"
 * - Nested content: "category/my-post.md" → ID: "category-my-post"
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Configuration
const OUTPUT_DIR = join(projectRoot, "public", "graph");
const OUTPUT_FILE = join(OUTPUT_DIR, "graph-data.json");

/**
 * Read maxNodes from config file
 */
function getMaxNodesFromConfig() {
  try {
    const configPath = join(projectRoot, "src", "config.ts");
    const configContent = readFileSync(configPath, "utf-8");

    // Extract maxNodes value from config
    const maxNodesMatch = configContent.match(/maxNodes:\s*(\d+)/);
    if (maxNodesMatch) {
      return parseInt(maxNodesMatch[1], 10);
    }

    // Default fallback
    return 100;
  } catch (error) {
    log.warn("Could not read config file, using default maxNodes: 100");
    return 100;
  }
}

// Simple logging utility
const isDev = process.env.NODE_ENV !== "production" && !process.argv.includes("--production");
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
};

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate a stable ID from file path
 * @param {string} filePath - The file path
 * @param {string} collectionType - The collection type (e.g., 'posts')
 * @returns {string} - The generated ID
 */
function generateNodeId(filePath, collectionType) {
  // Remove collection prefix and extension
  let id = filePath.replace(`src/content/${collectionType}/`, "");
  id = id.replace(".md", "");
  id = id.replace("/index", ""); // Handle folder-based posts

  // Clean up the ID: lowercase, replace spaces/special chars with hyphens
  id = id.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Remove multiple consecutive hyphens
  id = id.replace(/-+/g, "-");

  // Remove leading/trailing hyphens
  id = id.replace(/^-+|-+$/g, "");

  return id;
}

/**
 * Extract wikilinks from content (Obsidian-style)
 */
function extractWikilinks(content) {
  const matches = [];
  const wikilinkRegex = /!?\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const [fullMatch, linkContent] = match;
    const isImageWikilink = fullMatch.startsWith("!");

    // Skip image wikilinks, only process link wikilinks
    if (!isImageWikilink) {
      const [link, displayText] = linkContent.includes("|")
        ? linkContent.split("|", 2)
        : [linkContent, linkContent];

      // Parse anchor if present
      const anchorIndex = link.indexOf("#");
      const baseLink =
        anchorIndex === -1 ? link : link.substring(0, anchorIndex);

      const targetId = "post:" + generateNodeId(baseLink, "posts");
      matches.push({
        link: baseLink,
        display: displayText.trim(),
        slug: targetId,
      });
    }
  }

  return matches;
}

/**
 * Extract standard markdown links from content.
 * Returns matches with slug = "type:id" (e.g. "post:hello", "page:about").
 */
function extractStandardLinks(content) {
  const matches = [];
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [displayText, url] = [match[1], match[2]];
    if (!isInternalLink(url)) continue;
    const parsed = extractLinkTextFromUrl(url);
    if (parsed.type === "skip" || !parsed.linkText) continue;
    const type = parsed.type || "post";
    const targetId = `${type}:${parsed.linkText}`;
    matches.push({
      link: parsed.linkText,
      display: displayText.trim(),
      slug: targetId,
    });
  }
  return matches;
}

/**
 * Check if a URL is an internal link
 */
function isInternalLink(url) {
  url = url.trim();

  if (url.startsWith("http://") || url.startsWith("https://")) return false;
  if (url.startsWith("mailto:")) return false;
  if (url.startsWith("#")) return false;

  const path = url.replace(/#.*$/, "").replace(/\/$/, "");
  return (
    path.endsWith(".md") ||
    path.startsWith("/posts/") ||
    path.startsWith("posts/") ||
    path.startsWith("/pages/") ||
    path.startsWith("pages/") ||
    path.startsWith("/projects/") ||
    path.startsWith("projects/") ||
    path.startsWith("/docs/") ||
    path.startsWith("docs/") ||
    !path.includes("/")
  );
}

/**
 * Normalize path to slug (no leading/trailing slashes, no /index, no .md)
 */
function pathToSlug(path) {
  let s = path.replace(/\/$/, "").replace(/\.md$/, "").replace(/\/index$/, "");
  const parts = s.split("/");
  return parts.length > 1 ? parts[parts.length - 1] : s;
}

/** Index/special paths we do not add as graph nodes or connections (home, index pages, 404). */
const SKIP_PATHS = new Set(["", "posts", "projects", "docs", "404", "home"]);

/**
 * Extract link text and content type from internal URL.
 * Returns { linkText, type, anchor } or { linkText: null, type: 'skip' } for index/special.
 */
function extractLinkTextFromUrl(url) {
  url = url.trim();
  const anchorIndex = url.indexOf("#");
  const link = anchorIndex === -1 ? url : url.substring(0, anchorIndex);
  const anchor = anchorIndex === -1 ? null : url.substring(anchorIndex + 1);

  const normalized = link.replace(/^\/+|\/+$/g, "").replace(/\.md$/, "").replace(/\/index$/, "") || "";
  if (SKIP_PATHS.has(normalized)) return { linkText: null, type: "skip", anchor };

  const slug = pathToSlug(link);

  if (link.startsWith("posts/") || link.startsWith("/posts/")) {
    return { linkText: pathToSlug(link.replace(/^\/*posts\//, "")), type: "post", anchor };
  }
  if (link.startsWith("pages/") || link.startsWith("/pages/")) {
    return { linkText: pathToSlug(link.replace(/^\/*pages\//, "")), type: "page", anchor };
  }
  if (link.startsWith("projects/") || link.startsWith("/projects/")) {
    return { linkText: pathToSlug(link.replace(/^\/*projects\//, "")), type: "project", anchor };
  }
  if (link.startsWith("docs/") || link.startsWith("/docs/")) {
    return { linkText: pathToSlug(link.replace(/^\/*docs\//, "")), type: "doc", anchor };
  }

  if (link.endsWith(".md") || !link.includes("/")) {
    return { linkText: slug, type: "post", anchor };
  }
  return { linkText: null, anchor: null };
}

/**
 * Read and parse markdown files from a content directory.
 * @param {string} dirPath - Full path to dir (e.g. src/content/posts)
 * @param {string} contentType - Singular type: 'post'|'page'|'project'|'doc'
 * @returns {Array<{ id: string, type: string, slug: string, data: object, body: string }>}
 */
function readContentFiles(dirPath, contentType) {
  const results = [];
  try {
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      let slug;
      let content;
      if (stat.isDirectory()) {
        const indexPath = join(itemPath, "index.md");
        if (!existsSync(indexPath)) continue;
        content = readFileSync(indexPath, "utf-8");
        slug = item;
      } else if (item.endsWith(".md")) {
        content = readFileSync(itemPath, "utf-8");
        slug = item.replace(".md", "");
      } else {
        continue;
      }
      const parsed = parseMarkdownFile(content, slug);
      if (parsed) {
        results.push({
          id: `${contentType}:${slug}`,
          type: contentType,
          slug,
          data: parsed.data,
          body: parsed.body,
        });
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") log.error("Error reading content directory:", error);
  }
  return results;
}

/**
 * Parse markdown file and extract frontmatter and content
 */
function parseMarkdownFile(content, slug) {
  try {
    // Extract frontmatter (handle both \n and \r\n line endings)
    const frontmatterMatch = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
    );
    if (!frontmatterMatch) {
      return null;
    }

    const [, frontmatter, body] = frontmatterMatch;
    const lines = frontmatter.split(/\r?\n/);
    const data = {};

    // Parse frontmatter (improved YAML parser)
    let currentKey = null;
    let currentArray = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Check if this is a key-value pair
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0 && !line.startsWith(" ")) {
        // Save previous array if we have one
        if (currentKey && currentArray.length > 0) {
          data[currentKey] = [...currentArray];
          currentArray = [];
        }

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Check if this is an array key (next line starts with dash)
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("- ")) {
          currentKey = key;
          currentArray = [];
        } else {
          // Single value
          if (key === "date") {
            data[key] = new Date(value);
          } else if (key === "draft") {
            data[key] = value === "true";
          } else if (
            key === "imageOG" ||
            key === "hideCoverImage" ||
            key === "noIndex" ||
            key === "featured"
          ) {
            data[key] = value === "true";
          } else {
            data[key] = value;
          }
        }
      } else if (trimmedLine.startsWith("- ")) {
        // This is an array item
        const item = trimmedLine.substring(2).trim();
        currentArray.push(item);
      }
    }

    // Save final array if we have one
    if (currentKey && currentArray.length > 0) {
      data[currentKey] = [...currentArray];
    }

    return {
      id: slug,
      data,
      body,
    };
  } catch (error) {
    log.warn(`Error parsing file ${slug}:`, error.message);
    return null;
  }
}

/**
 * Generate graph data from posts, pages, projects, and docs
 */
async function generateGraphData() {
  log.info("🔍 Analyzing content connections...");

  try {
    const maxNodes = getMaxNodesFromConfig();
    const isDev = process.env.NODE_ENV !== "production" && !process.argv.includes("--production");
    const contentRoot = join(projectRoot, "src", "content");

    const collections = [
      { dir: join(contentRoot, "posts"), type: "post" },
      { dir: join(contentRoot, "pages"), type: "page" },
      { dir: join(contentRoot, "projects"), type: "project" },
      { dir: join(contentRoot, "docs"), type: "doc" },
      { dir: join(contentRoot, "special"), type: "special" },
    ];

    // Discover custom content types from config.ts
    try {
      const configPath = join(projectRoot, "src", "config.ts");
      const configContent = readFileSync(configPath, "utf-8");
      const customMatch = configContent.match(/customContentTypes:\s*\[([\s\S]*?)\]/);
      if (customMatch) {
        const idMatches = customMatch[1].matchAll(/id:\s*'([^']+)'/g);
        for (const m of idMatches) {
          const id = m[1];
          // Skip if already in the built-in list
          if (!collections.some(c => c.type === id)) {
            collections.push({ dir: join(contentRoot, id), type: id });
          }
        }
      }
    } catch {
      // Silent - custom content types are optional
    }

    const specialSkipSlugs = new Set(["404"]);
    const allEntries = [];
    for (const { dir, type } of collections) {
      if (!existsSync(dir)) continue;
      const entries = readContentFiles(dir, type);
      const visible =
        type === "special"
          ? entries.filter((e) => !specialSkipSlugs.has(e.slug))
          : entries.filter((e) => (isDev || e.data.draft !== true) && e.data.noIndex !== true);
      allEntries.push(...visible);
      if (visible.length) log.info(`📄 ${type}: ${visible.length}`);
    }

    const nodeIds = new Set(allEntries.map((e) => e.id));
    const nodes = allEntries.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.data.title || e.slug,
      slug: e.slug,
      connections: 0,
      ...(e.data.draft ? { draft: true } : {}),
    }));
    const connections = [];

    for (const entry of allEntries) {
      const wikilinks = extractWikilinks(entry.body);
      const standardLinks = extractStandardLinks(entry.body);
      for (const link of [...wikilinks, ...standardLinks]) {
        const targetId = link.slug;
        if (targetId.startsWith("special:") || !nodeIds.has(targetId) || targetId === entry.id) continue;
        connections.push({ source: entry.id, target: targetId, type: "link" });
        const srcNode = nodes.find((n) => n.id === entry.id);
        const tgtNode = nodes.find((n) => n.id === targetId);
        if (srcNode) srcNode.connections++;
        if (tgtNode) tgtNode.connections++;
      }
    }

    // Generate tag nodes and tag connections from post frontmatter
    const tagNodes = [];
    const tagConnections = [];
    const tagSet = new Map();
    for (const entry of allEntries) {
      const tags = entry.data.tags;
      if (!Array.isArray(tags)) continue;
      for (const tag of tags) {
        const tagSlug = tag.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
        if (!tagSlug) continue;
        const tagId = `tag:${tagSlug}`;
        if (!tagSet.has(tagSlug)) {
          tagSet.set(tagSlug, { id: tagId, type: "tag", title: `#${tag}`, slug: tagSlug, connections: 0 });
        }
        const exists = tagConnections.some(c => c.source === entry.id && c.target === tagId);
        if (!exists) {
          tagConnections.push({ source: entry.id, target: tagId, type: "tag" });
          tagSet.get(tagSlug).connections++;
          const srcNode = nodes.find((n) => n.id === entry.id);
          if (srcNode) srcNode.connections++;
        }
      }
    }
    for (const tagNode of tagSet.values()) {
      tagNodes.push(tagNode);
    }

    let filteredNodes = nodes;
    let filteredConnections = connections;

    if (maxNodes && nodes.length > maxNodes) {
      const sorted = [...nodes].sort((a, b) => b.connections - a.connections);
      filteredNodes = sorted.slice(0, maxNodes);
      const selectedIds = new Set(filteredNodes.map((n) => n.id));
      filteredConnections = connections.filter(
        (c) => selectedIds.has(c.source) && selectedIds.has(c.target)
      );
    }

    const graphData = {
      nodes: filteredNodes,
      connections: filteredConnections,
      tagNodes,
      tagConnections,
      metadata: {
        totalNodes: filteredNodes.length,
        totalConnections: filteredConnections.length,
        totalTagNodes: tagNodes.length,
        totalTagConnections: tagConnections.length,
        maxNodesApplied: maxNodes && nodes.length > maxNodes,
        originalNodeCount: nodes.length,
      },
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(graphData, null, 2));

    log.info("✅ Graph data generated successfully!");
    log.info(
      `📊 ${graphData.metadata.totalNodes} nodes, ${graphData.metadata.totalConnections} connections`
    );
    log.info(`💾 Saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    log.error("❌ Error generating graph data:", error);
    process.exit(1);
  }
}

// Run the script
generateGraphData();
