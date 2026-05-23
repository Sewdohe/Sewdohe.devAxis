#!/usr/bin/env node

/**
 * Axis Update Script
 *
 * Validates your license key, downloads the latest release from
 * releases.davidvkimball.com, replaces framework files, and preserves
 * your content and assets.
 *
 * After updating, open Obsidian and click "Apply all settings" in the
 * Axis Settings plugin to rewrite config.ts with your saved settings.
 *
 * Usage: pnpm run update
 */

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, cpSync, rmSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { get as httpsGet, request as httpsRequest } from 'https';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';

const ROOT = resolve(import.meta.dirname, '..');
const RELEASES_HOST = 'releases.davidvkimball.com';
const PRODUCT = 'axis';

// Files and directories that belong to the USER and must be preserved
const USER_PATHS = [
  'src/content',              // All user content + .obsidian vault
  'public/assets',            // User-uploaded images via sync-images
  'public/favicon.png',
  'public/favicon-dark.png',
  'public/favicon-light.png',
  '.env',
  '.env.local',
  '.env.production',
];

// Directories that should never be touched
const SKIP_PATHS = [
  'node_modules',
  '.git',
  '.astro',
  '.netlify',
  'dist',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) { console.log(`  ${msg}`); }
function logStep(msg) { console.log(`\n> ${msg}`); }
function logError(msg) { console.error(`\n  ERROR: ${msg}`); }

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
  return pkg.version;
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': 'axis-updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON from ${url}`)); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    httpsGet(url, { headers: { 'User-Agent': 'axis-updater' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode === 401 || res.statusCode === 403) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const err = JSON.parse(body);
            reject(new Error(err.error || 'License validation failed'));
          } catch {
            reject(new Error(`Access denied (HTTP ${res.statusCode})`));
          }
        });
        return;
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
      }
      const ws = createWriteStream(dest);
      pipeline(res, ws).then(resolve, reject);
    }).on('error', reject);
  });
}

function copyIfExists(src, dest) {
  if (!existsSync(src)) return false;
  const stat = statSync(src);
  if (stat.isDirectory()) {
    cpSync(src, dest, { recursive: true });
  } else {
    const dir = join(dest, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cpSync(src, dest);
  }
  return true;
}

// ── License key management ──────────────────────────────────────────────────

function getLicenseKey() {
  // Check .env file
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^AXIS_LICENSE_KEY=(.+)$/m);
    if (match) return match[1].trim();
  }
  return null;
}

function saveLicenseKey(key) {
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    let content = readFileSync(envPath, 'utf-8');
    if (content.match(/^AXIS_LICENSE_KEY=/m)) {
      content = content.replace(/^AXIS_LICENSE_KEY=.*$/m, `AXIS_LICENSE_KEY=${key}`);
    } else {
      content = content.trimEnd() + `\nAXIS_LICENSE_KEY=${key}\n`;
    }
    writeFileSync(envPath, content);
  } else {
    writeFileSync(envPath, `AXIS_LICENSE_KEY=${key}\n`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nAxis Updater');
  console.log('============');

  // 1. Get license key
  let licenseKey = getLicenseKey();
  if (!licenseKey) {
    console.log('\n  No license key found.');
    console.log('  Enter your Axis license key (from your purchase receipt).\n');
    licenseKey = await prompt('  License key: ');
    if (!licenseKey) {
      logError('License key is required to download updates.');
      process.exit(1);
    }
    saveLicenseKey(licenseKey);
    log('License key saved to .env');
  } else {
    log('License key found in .env');
  }

  // 2. Get current version
  const currentVersion = getCurrentVersion();
  log(`Current version: ${currentVersion}`);

  // 3. Check latest release
  logStep('Checking for updates...');
  let latest;
  try {
    latest = await fetchJSON(`https://${RELEASES_HOST}/latest?product=${PRODUCT}`);
  } catch (err) {
    logError(`Could not check for updates: ${err.message}`);
    process.exit(1);
  }

  const latestVersion = latest.version;
  log(`Latest version:  ${latestVersion}`);

  if (currentVersion === latestVersion) {
    log('Already up to date!');
    process.exit(0);
  }

  // 4. Download release (license validated server-side)
  logStep(`Downloading v${latestVersion}...`);
  const tempDir = join(tmpdir(), `axis-update-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  const zipPath = join(tempDir, 'release.zip');

  try {
    await downloadFile(
      `https://${RELEASES_HOST}/download?product=${PRODUCT}&key=${encodeURIComponent(licenseKey)}`,
      zipPath
    );
  } catch (err) {
    logError(err.message);
    if (err.message.includes('license') || err.message.includes('License') || err.message.includes('expired')) {
      log('If your license key changed, delete AXIS_LICENSE_KEY from .env and try again.');
    }
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(1);
  }
  log('Downloaded successfully.');

  // 5. Extract
  logStep('Extracting...');
  const extractDir = join(tempDir, 'extracted');
  mkdirSync(extractDir, { recursive: true });

  try {
    if (process.platform === 'win32') {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'pipe' });
    } else {
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`, { stdio: 'pipe' });
    }
  } catch (err) {
    logError(`Extraction failed: ${err.message}`);
    rmSync(tempDir, { recursive: true, force: true });
    process.exit(1);
  }

  // The zip may contain a single root directory or files directly
  const extractedContents = readdirSync(extractDir);
  let sourceDir = extractDir;
  if (extractedContents.length === 1) {
    const singleEntry = join(extractDir, extractedContents[0]);
    if (statSync(singleEntry).isDirectory()) {
      sourceDir = singleEntry;
    }
  }
  log('Extracted successfully.');

  // 6. Back up user files
  logStep('Backing up user content...');
  const backupDir = join(tempDir, 'backup');
  mkdirSync(backupDir, { recursive: true });

  let backedUp = 0;
  for (const userPath of USER_PATHS) {
    const src = join(ROOT, userPath);
    const dest = join(backupDir, userPath);
    if (copyIfExists(src, dest)) {
      log(`  Backed up: ${userPath}`);
      backedUp++;
    }
  }

  // Back up user-added public/ files not in the new release
  const publicDir = join(ROOT, 'public');
  const newPublicDir = join(sourceDir, 'public');
  if (existsSync(publicDir)) {
    for (const entry of readdirSync(publicDir)) {
      const fullPath = join(publicDir, entry);
      const alreadyBacked = USER_PATHS.some(p => p === `public/${entry}`);
      if (!alreadyBacked && statSync(fullPath).isFile()) {
        if (!existsSync(join(newPublicDir, entry))) {
          mkdirSync(join(backupDir, 'public'), { recursive: true });
          cpSync(fullPath, join(backupDir, 'public', entry));
          log(`  Backed up (user asset): public/${entry}`);
          backedUp++;
        }
      }
    }
  }

  log(`${backedUp} item(s) backed up.`);

  // 7. Replace framework files
  logStep('Updating framework files...');

  function listPaths(dir, base = '') {
    const results = [];
    for (const entry of readdirSync(dir)) {
      const rel = base ? `${base}/${entry}` : entry;
      const full = join(dir, entry);

      if (SKIP_PATHS.includes(rel)) continue;
      if (USER_PATHS.includes(rel)) continue;

      if (statSync(full).isDirectory()) {
        results.push(...listPaths(full, rel));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const newFiles = listPaths(sourceDir);
  let updated = 0;

  for (const relPath of newFiles) {
    const src = join(sourceDir, relPath);
    const dest = join(ROOT, relPath);
    const destDir = join(dest, '..');

    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    cpSync(src, dest);
    updated++;
  }
  log(`${updated} framework file(s) updated.`);

  // 8. Restore user files
  logStep('Restoring user content...');
  let restored = 0;

  for (const userPath of USER_PATHS) {
    const src = join(backupDir, userPath);
    const dest = join(ROOT, userPath);
    if (copyIfExists(src, dest)) {
      log(`  Restored: ${userPath}`);
      restored++;
    }
  }

  // Restore user-added public/ files
  const backupPublicDir = join(backupDir, 'public');
  if (existsSync(backupPublicDir)) {
    for (const file of readdirSync(backupPublicDir)) {
      const alreadyRestored = USER_PATHS.some(p => p === `public/${file}`);
      if (!alreadyRestored) {
        cpSync(join(backupPublicDir, file), join(ROOT, 'public', file));
        log(`  Restored (user asset): public/${file}`);
        restored++;
      }
    }
  }

  log(`${restored} item(s) restored.`);

  // 9. Install dependencies
  logStep('Installing dependencies...');
  try {
    execSync('pnpm install', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    logError('pnpm install failed. You may need to run it manually.');
  }

  // 10. Clean up
  rmSync(tempDir, { recursive: true, force: true });

  // 11. Done
  console.log('\n============================');
  console.log(`  Updated to v${latestVersion}!`);
  console.log('============================');
  console.log('\n  Next steps:');
  console.log('  1. Open your vault in Obsidian');
  console.log('  2. Go to Axis Settings');
  console.log('  3. Click "Apply all settings" to write');
  console.log('     your saved settings to the new config.ts');
  console.log('  4. Run `pnpm dev` to verify everything works');
  console.log('');
}

main().catch(err => {
  logError(err.message);
  process.exit(1);
});
