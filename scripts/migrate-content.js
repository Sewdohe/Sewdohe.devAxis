#!/usr/bin/env node

/**
 * Content Migration Script
 *
 * 1. Copies all post folders from the existing davidvkimball.com
 * 2. Updates frontmatter: removes category (adds to tags), removes altText, removes empty image strings
 * 3. Extracts post-to-post redirects from netlify.toml and adds as aliases
 */

import { promises as fs } from 'fs';
import path from 'path';

const SOURCE_POSTS = 'C:/Users/david/Development/davidvkimball.com/src/content/posts';
const TARGET_POSTS = 'C:/Users/david/Development/davidvkimball-new/src/content/posts';

// Post-to-post redirects from netlify.toml (old slug -> current slug)
// These become aliases on the target posts
const POST_ALIASES = {
  'digital-flow': ['posts/digital-functional-optimization'],
  'llm-seo-get-cited-in-ai-responses': ['posts/how-to-get-your-website-mentioned-in-ai-responses-llm-seo'],
  'download-windows-10-icons': ['posts/download-windows-10-custom-folder-icons'],
  'windows-10-tips-and-tricks': ['posts/some-windows-10-tips-tricks'],
  'zunes-design-language-and-how-it-evolved-into-windows-phone': ['blog/origins-of-the-design-language-formerly-known-as-metro'],
  'a-note-about-project-m-36-content-integrity-and-legacy-te': ['a-note-about-project-m-36-content-integrity'],
};

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const items = await fs.readdir(src, { withFileTypes: true });
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

function migrateFrontmatter(content, slug) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return content;

  const frontmatterText = match[1];
  const body = match[2];
  const lines = frontmatterText.split('\n');

  const result = [];
  let category = null;
  let tags = [];
  let inTags = false;
  let skipLine = false;
  let hasImage = false;
  let imageIsEmpty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip altText lines
    if (trimmed.startsWith('altText:')) {
      continue;
    }

    // Handle category -> merge into tags
    if (trimmed.startsWith('category:')) {
      const val = trimmed.replace('category:', '').trim().replace(/^["']|["']$/g, '');
      if (val) category = val;
      continue;
    }

    // Track if image is empty string
    if (trimmed.startsWith('image:')) {
      const val = trimmed.replace('image:', '').trim();
      if (val === '""' || val === "''" || val === '') {
        imageIsEmpty = true;
        continue; // Skip empty image
      }
      hasImage = true;
    }

    // Collect tags
    if (trimmed === 'tags:') {
      inTags = true;
      result.push(line);
      continue;
    }

    if (inTags) {
      if (trimmed.startsWith('-')) {
        const tag = trimmed.replace(/^-\s*/, '').replace(/^["']|["']$/g, '');
        tags.push(tag);
        result.push(line);
        continue;
      } else {
        inTags = false;
      }
    }

    result.push(line);
  }

  // If category exists and isn't already in tags, add it
  if (category && !tags.includes(category)) {
    // Find the tags section and add category
    const tagsIndex = result.findIndex(l => l.trim() === 'tags:');
    if (tagsIndex !== -1) {
      // Find the last tag item after tagsIndex
      let lastTagIndex = tagsIndex;
      for (let i = tagsIndex + 1; i < result.length; i++) {
        if (result[i].trim().startsWith('-')) {
          lastTagIndex = i;
        } else {
          break;
        }
      }
      result.splice(lastTagIndex + 1, 0, `  - ${category}`);
    }
  }

  // Add aliases if this post has any
  if (POST_ALIASES[slug]) {
    const aliases = POST_ALIASES[slug];
    result.push('aliases:');
    for (const alias of aliases) {
      result.push(`  - ${alias}`);
    }
  }

  return `---\n${result.join('\n')}\n---\n${body}`;
}

async function migratePost(postDir) {
  const slug = path.basename(postDir);
  const srcDir = path.join(SOURCE_POSTS, slug);
  const destDir = path.join(TARGET_POSTS, slug);

  // Skip the "draft" folder (it's a template)
  if (slug === 'draft') return { slug, status: 'skipped' };

  // Copy the folder
  await copyDir(srcDir, destDir);

  // Find and update index.md
  const indexPath = path.join(destDir, 'index.md');
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    const migrated = migrateFrontmatter(content, slug);
    if (migrated !== content) {
      await fs.writeFile(indexPath, migrated, 'utf-8');
      return { slug, status: 'migrated' };
    }
    return { slug, status: 'copied' };
  } catch {
    return { slug, status: 'no-index' };
  }
}

async function main() {
  console.log('Starting content migration...\n');

  // Remove test post
  const testPostPath = path.join(TARGET_POSTS, 'test-post');
  try {
    await fs.rm(testPostPath, { recursive: true });
    console.log('Removed test-post.');
  } catch {}

  // Get all post directories
  const items = await fs.readdir(SOURCE_POSTS, { withFileTypes: true });
  const postDirs = items.filter(i => i.isDirectory()).map(i => i.name);

  console.log(`Found ${postDirs.length} posts to migrate.\n`);

  let migrated = 0;
  let copied = 0;
  let skipped = 0;
  let errors = 0;

  for (const dir of postDirs) {
    try {
      const result = await migratePost(dir);
      switch (result.status) {
        case 'migrated':
          migrated++;
          console.log(`  Migrated: ${result.slug}`);
          break;
        case 'copied':
          copied++;
          break;
        case 'skipped':
          skipped++;
          break;
        case 'no-index':
          console.log(`  Warning: No index.md in ${result.slug}`);
          break;
      }
    } catch (error) {
      errors++;
      console.error(`  Error migrating ${dir}:`, error.message);
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Migrated (frontmatter updated): ${migrated}`);
  console.log(`  Copied (no changes needed): ${copied}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main();
