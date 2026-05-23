#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const isDev = process.env.NODE_ENV !== 'production';
const log = {
  info: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
};

const IMAGE_SYNC_CONFIGS = [
  { source: 'src/content/posts/attachments', target: 'public/posts/attachments', name: 'posts' },
  { source: 'src/content/pages/attachments', target: 'public/pages/attachments', name: 'pages' },
];

async function findImageFiles(dir, relativePath = '') {
  const imageFiles = [];
  try {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        const subImages = await findImageFiles(itemPath, itemRelativePath);
        imageFiles.push(...subImages);
      } else if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|tif|ico|mp3|wav|ogg|m4a|3gp|flac|aac|mp4|webm|ogv|mov|mkv|avi|pdf)$/i.test(item)) {
        if (item.toLowerCase().endsWith('.webp')) {
          const originalName = item.replace(/\.webp$/i, '');
          const hasOriginal = items.some(i => {
            const nameWithoutExt = i.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '');
            return nameWithoutExt === originalName && /\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(i);
          });
          if (hasOriginal) continue;
        }
        imageFiles.push({ sourcePath: itemPath, relativePath: itemRelativePath });
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
  }
  return imageFiles;
}

async function syncFolderBasedImages(contentType) {
  const contentDir = `src/content/${contentType}`;
  const publicContentDir = `public/${contentType}`;
  try {
    const items = await fs.readdir(contentDir);
    let totalSynced = 0;
    let totalSkipped = 0;

    for (const item of items) {
      const itemPath = path.join(contentDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        const targetDir = path.join(publicContentDir, item);
        const imageFiles = await findImageFiles(itemPath);

        for (const imageFile of imageFiles) {
          let targetRelativePath = imageFile.relativePath;
          if (targetRelativePath.startsWith('attachments/') || targetRelativePath.startsWith('attachments\\')) {
            targetRelativePath = targetRelativePath.replace(/^attachments[/\\]/, '');
          }

          const targetPath = path.join(targetDir, targetRelativePath);
          const targetDirForFile = path.dirname(targetPath);
          await ensureDir(targetDirForFile);

          let needsUpdate = true;
          if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
            const webpPath = path.join(targetDir, targetRelativePath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp'));
            try {
              const sourceStats = await fs.stat(imageFile.sourcePath);
              const webpStats = await fs.stat(webpPath);
              needsUpdate = sourceStats.mtime > webpStats.mtime;
            } catch { needsUpdate = true; }
          } else {
            try {
              const sourceStats = await fs.stat(imageFile.sourcePath);
              const targetStats = await fs.stat(targetPath);
              needsUpdate = sourceStats.mtime > targetStats.mtime || sourceStats.size !== targetStats.size;
            } catch { needsUpdate = true; }
          }

          if (needsUpdate) {
            if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
              try {
                const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
                const isGif = imageFile.sourcePath.toLowerCase().endsWith('.gif');
                await sharp(imageFile.sourcePath, { animated: isGif }).webp({ quality: 85 }).toFile(webpPath);
                totalSynced++;
              } catch (error) {
                log.warn(`Could not optimize ${imageFile.relativePath}, copying original:`, error.message);
                await fs.copyFile(imageFile.sourcePath, targetPath);
                totalSynced++;
              }
            } else {
              await fs.copyFile(imageFile.sourcePath, targetPath);
              totalSynced++;
            }
          } else {
            totalSkipped++;
          }
        }
      }
    }

    if (totalSynced > 0 || totalSkipped > 0) {
      log.info(`Syncing folder-based ${contentType} images...`);
      if (totalSynced > 0) log.info(`   Synced ${totalSynced} files`);
      if (totalSkipped > 0) log.info(`   Skipped ${totalSkipped} unchanged`);
    }

    return { synced: totalSynced, skipped: totalSkipped };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.error(`Error syncing folder-based ${contentType} images:`, error);
    }
    return { synced: 0, skipped: 0 };
  }
}

async function ensureDir(dir) {
  try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
}

function extractImageFromFrontmatter(content) {
  const match = content.match(/^image:\s*['"]?([^\s'"\n]+)['"]?/m);
  return match ? match[1].trim() : null;
}

/** Sync cover images for flat posts (single .md + sibling image). Folder-based handled by syncFolderBasedImages. */
async function syncFlatPostImages() {
  const contentDir = 'src/content/posts';
  const publicDir = 'public/posts';
  try {
    const items = await fs.readdir(contentDir);
    let totalSynced = 0;
    for (const item of items) {
      const itemPath = path.join(contentDir, item);
      const stat = await fs.stat(itemPath);
      if (!stat.isFile() || !/\.(md|mdx)$/i.test(item)) continue;
      const slug = item.replace(/\.(md|mdx)$/i, '');
      const content = await fs.readFile(itemPath, 'utf8');
      const imageVal = extractImageFromFrontmatter(content);
      if (!imageVal) continue;
      let clean = imageVal.replace(/^\.\//, '');
      if (clean.startsWith('images/') || clean.startsWith('attachments/')) {
        clean = clean.replace(/^(images|attachments)\//, '');
      }
      const baseName = path.basename(clean);
      const contentDirResolved = path.resolve(contentDir);
      const sourceCandidates = [
        path.join(contentDir, baseName),
        path.join(contentDir, clean),
      ];
      let sourcePath = null;
      for (const p of sourceCandidates) {
        const resolved = path.resolve(p);
        if (!resolved.startsWith(contentDirResolved) || resolved.includes('..')) continue;
        try {
          await fs.access(resolved);
          sourcePath = resolved;
          break;
        } catch { /* skip */ }
      }
      if (!sourcePath) continue;
      const targetDir = path.join(publicDir, slug);
      await ensureDir(targetDir);
      const isRaster = /\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(baseName);
      const targetName = isRaster ? baseName.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp') : baseName;
      const targetPath = path.join(targetDir, targetName);
      let needsUpdate = true;
      try {
        const srcStat = await fs.stat(sourcePath);
        const tgtStat = await fs.stat(targetPath);
        needsUpdate = srcStat.mtime > tgtStat.mtime;
      } catch { /* needsUpdate stays true */ }
      if (!needsUpdate) continue;
      if (isRaster) {
        try {
          const isGif = sourcePath.toLowerCase().endsWith('.gif');
          await sharp(sourcePath, { animated: isGif }).webp({ quality: 85 }).toFile(targetPath);
        } catch (err) {
          log.warn(`Could not convert ${baseName} for ${slug}, copying:`, err.message);
          await fs.copyFile(sourcePath, targetPath);
        }
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
      totalSynced++;
    }
    if (totalSynced > 0) log.info(`Synced ${totalSynced} flat post cover image(s).`);
    return totalSynced;
  } catch (err) {
    if (err.code !== 'ENOENT') log.error('Error syncing flat post images:', err);
    return 0;
  }
}

async function syncImagesForConfig(config) {
  await ensureDir(config.target);
  try {
    let sourceFiles = [];
    try { sourceFiles = await fs.readdir(config.source); } catch (error) {
      if (error.code === 'ENOENT') return { synced: 0, skipped: 0 };
      throw error;
    }

    const imageFiles = await findImageFiles(config.source);
    let synced = 0;
    let skipped = 0;

    for (const imageFile of imageFiles) {
      const targetPath = path.join(config.target, imageFile.relativePath);
      const targetDirForFile = path.dirname(targetPath);
      await ensureDir(targetDirForFile);

      let needsUpdate = true;
      if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
        const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
        try {
          const sourceStats = await fs.stat(imageFile.sourcePath);
          const webpStats = await fs.stat(webpPath);
          needsUpdate = sourceStats.mtime > webpStats.mtime;
        } catch { needsUpdate = true; }
      } else {
        try {
          const sourceStats = await fs.stat(imageFile.sourcePath);
          const targetStats = await fs.stat(targetPath);
          needsUpdate = sourceStats.mtime > targetStats.mtime || sourceStats.size !== targetStats.size;
        } catch { needsUpdate = true; }
      }

      if (needsUpdate) {
        if (/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i.test(imageFile.relativePath)) {
          try {
            const webpPath = targetPath.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|tif)$/i, '.webp');
            const isGif = imageFile.sourcePath.toLowerCase().endsWith('.gif');
            await sharp(imageFile.sourcePath, { animated: isGif }).webp({ quality: 85 }).toFile(webpPath);
            synced++;
          } catch (error) {
            log.warn(`Could not optimize ${imageFile.relativePath}, copying original:`, error.message);
            await fs.copyFile(imageFile.sourcePath, targetPath);
            synced++;
          }
        } else {
          await fs.copyFile(imageFile.sourcePath, targetPath);
          synced++;
        }
      } else {
        skipped++;
      }
    }

    return { synced, skipped };
  } catch (error) {
    log.error(`Error syncing ${config.name} images:`, error);
    return { synced: 0, skipped: 0 };
  }
}

async function syncAllImages() {
  log.info('Syncing images from content to public directory...');

  for (const config of IMAGE_SYNC_CONFIGS) {
    const result = await syncImagesForConfig(config);
    if (result.synced > 0 || result.skipped > 0) {
      log.info(`Syncing ${config.name} images: ${result.synced} synced, ${result.skipped} unchanged`);
    }
  }

  const contentTypes = ['posts', 'pages', 'projects', 'docs'];
  for (const contentType of contentTypes) {
    await syncFolderBasedImages(contentType);
  }

  await syncFlatPostImages();

  log.info('Image sync complete!');
}

syncAllImages();
