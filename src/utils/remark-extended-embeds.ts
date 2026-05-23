/**
 * Remark plugin: Extended Embeds
 * Transforms ```embed code blocks into rich media embeds.
 * Companion to the obsidian-extended-embeds plugin.
 */
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';

// ─── URL Patterns ───

const SPOTIFY_PATTERN = /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;
const SPOTIFY_PODCAST_PATTERN = /(?:podcasters|creators)\.spotify\.com\/pod\/(?:show|profile)\/([a-zA-Z0-9_-]+)\/(?:embed\/)?episodes\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)/;
const APPLE_MUSIC_PATTERN = /music\.apple\.com\/([a-z]{2})\/(album|playlist|song|music-video|station)\/([^?#]+)/;
const SOUNDCLOUD_PATTERN = /soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;
const BANDCAMP_PATTERN = /([a-zA-Z0-9_-]+)\.bandcamp\.com\/(track|album)\/([a-zA-Z0-9_-]+)/;
const VIMEO_PATTERNS = [
  /^https?:\/\/(?:www\.)?vimeo\.com\/manage\/videos\/(\d+)/,
  /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/,
  /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/,
];
const CODEPEN_PATTERN = /codepen\.io\/([a-zA-Z0-9_-]+)\/pen\/([a-zA-Z0-9]+)/;
const FIGMA_PATTERN = /figma\.com\/(file|proto|design|board|slides|deck)\/([a-zA-Z0-9]+)/;
const GITHUB_REPO_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/?$/;
const GITHUB_ISSUE_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/(issues|pull)\/(\d+)\/?$/;
const GITHUB_GIST_PATTERN = /gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+)/;
const REDDIT_PATTERN = /^https?:\/\/(?:www\.|old\.|np\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/;
const BLUESKY_PATTERN = /^https?:\/\/bsky\.app\/profile\/([a-zA-Z0-9._:-]+)\/post\/([a-zA-Z0-9]+)\/?$/;
const MASTODON_PATTERN = /^https?:\/\/([a-zA-Z0-9.-]+)\/@([a-zA-Z0-9_]+)\/(\d+)\/?$/;
const LINKEDIN_PATTERN = /linkedin\.com\/(?:embed\/)?(?:posts\/.*?(activity)-|feed\/update\/urn:li:(share|activity|ugcPost):)([0-9]+)/;
const STEAM_APP_PATTERN = /store\.steampowered\.com\/app\/(\d+)/;
const STEAM_BUNDLE_PATTERN = /store\.steampowered\.com\/bundle\/(\d+)/;
const STEAM_SUB_PATTERN = /store\.steampowered\.com\/sub\/(\d+)/;

// ─── HTML Builders ───

function createHtmlNode(html: string): { type: string; value: string } {
  return { type: 'html', value: html };
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function parseSource(source: string): { url: string; width?: number; height?: number } | null {
  const lines = source.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const url = lines[0];
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return null;

  let width: number | undefined;
  let height: number | undefined;
  if (lines.length > 1 && lines[1]) {
    const dimMatch = lines[1].match(/^(\d+)(?:x(\d+))?$/);
    if (dimMatch) {
      if (dimMatch[1]) width = parseInt(dimMatch[1], 10);
      if (dimMatch[2]) height = parseInt(dimMatch[2], 10);
    }
  }
  return { url, width, height };
}

// ─── Provider Renderers ───

function renderSpotify(url: string): string {
  const match = url.match(SPOTIFY_PATTERN);
  if (!match) return '';
  const [, type, id] = match;
  const isCompact = type === 'track';
  return `<div class="ee ee-spotify"><iframe src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="width:100%;height:${isCompact ? '152px' : '352px'};border-radius:12px"></iframe></div>`;
}

function renderSpotifyPodcast(url: string): string {
  const match = url.match(SPOTIFY_PODCAST_PATTERN);
  if (!match) return '';
  const [, user, episodePath] = match;
  const embedUrl = `https://podcasters.spotify.com/pod/show/${user}/embed/episodes/${episodePath}`;
  return `<div class="ee ee-spotify"><iframe src="${embedUrl}" frameborder="0" scrolling="no" loading="lazy" style="width:100%;height:102px;border-radius:12px;overflow:hidden"></iframe></div>`;
}

function renderAppleMusic(url: string): string {
  const match = url.match(APPLE_MUSIC_PATTERN);
  if (!match) return '';
  const type = match[2];
  const isSingle = type === 'song' || url.includes('?i=');
  const embedUrl = url.replace('music.apple.com', 'embed.music.apple.com');
  return `<div class="ee ee-apple-music"><iframe src="${esc(embedUrl)}" frameborder="0" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" loading="lazy" style="width:100%;height:${isSingle ? '175px' : '450px'};border-radius:10px;overflow:hidden"></iframe></div>`;
}

function renderSoundCloud(url: string): string {
  const encoded = encodeURIComponent(url);
  return `<div class="ee ee-soundcloud"><iframe src="https://w.soundcloud.com/player/?url=${encoded}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false" frameborder="0" loading="lazy" style="width:100%;height:166px;border-radius:8px;overflow:hidden"></iframe></div>`;
}

// ─── Build-time fetch helpers ───

import * as fs from 'node:fs';
import * as path from 'node:path';

const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const githubHeaders: Record<string, string> = {
  'User-Agent': 'axis-build',
  Accept: 'application/vnd.github+json',
};
if (githubToken) githubHeaders.Authorization = `Bearer ${githubToken}`;

// Persistent disk cache so a successful fetch survives across builds — no
// re-fetching when GitHub's 60/hour anonymous rate limit is exhausted, and
// no flickering between rich cards (when fetch succeeds) and fallback cards
// (when it fails). Cached entries also have a 24h TTL so stars/forks stay
// reasonably fresh.
const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'extended-embeds.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry { data: any; ts: number; }
type CacheStore = Record<string, CacheEntry>;

let diskCache: CacheStore = {};
let diskCacheLoaded = false;
let diskCacheDirty = false;

function loadDiskCache(): CacheStore {
  if (diskCacheLoaded) return diskCache;
  diskCacheLoaded = true;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      diskCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as CacheStore;
    }
  } catch {
    diskCache = {};
  }
  return diskCache;
}

function persistDiskCache(): void {
  if (!diskCacheDirty) return;
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(diskCache, null, 2));
    diskCacheDirty = false;
  } catch {}
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Fetch with persistent disk caching. On a successful response, the value is
 * cached for 24h. If a fresh fetch fails (e.g. rate-limited), any prior cached
 * value — even if stale — is returned so the rendered card stays rich.
 */
async function cachedFetchJson<T>(cacheKey: string, url: string, headers: Record<string, string> = {}): Promise<T | null> {
  const cache = loadDiskCache();
  const entry = cache[cacheKey];
  const now = Date.now();
  if (entry && now - entry.ts < CACHE_TTL_MS) {
    return entry.data as T;
  }
  const fresh = await fetchJson<T>(url, headers);
  if (fresh) {
    cache[cacheKey] = { data: fresh, ts: now };
    diskCacheDirty = true;
    // Save eagerly so a Ctrl-C mid-build doesn't lose the work
    persistDiskCache();
    return fresh;
  }
  // Fresh fetch failed — fall back to stale cache if we have one
  if (entry) return entry.data as T;
  return null;
}

const githubRepoCache = new Map<string, any>();
const githubIssueCache = new Map<string, any>();
const githubGistCache = new Map<string, any>();
const redditCache = new Map<string, any>();

const langColors: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Rust: '#dea584',
  Go: '#00ADD8', Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Astro: '#ff5a03', Vue: '#41b883', Svelte: '#ff3e00',
  Dart: '#00B4AB', Lua: '#000080',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Bandcamp item_id cache (populated at build time)
const bandcampCache = new Map<string, string>();

async function fetchBandcampItemId(url: string, type: string): Promise<string | null> {
  if (bandcampCache.has(url)) return bandcampCache.get(url)!;
  try {
    const res = await fetch(url);
    const html = await res.text();
    // Try multiple patterns to extract item_id
    let m = html.match(/"item_id"\s*[:,]\s*(\d+)/);
    if (!m) m = html.match(/data-tralbum-id="(\d+)"/);
    if (!m) m = html.match(/\/(?:track|album)=(\d+)/);
    if (m) {
      bandcampCache.set(url, m[1]);
      return m[1];
    }
  } catch {}
  return null;
}

function renderBandcamp(url: string, itemId: string | null): string {
  const match = url.match(BANDCAMP_PATTERN);
  if (!match) return '';
  const isAlbum = match[2] === 'album';
  const typeParam = isAlbum ? 'album' : 'track';

  if (!itemId) {
    // Fallback: styled link card
    return `<div class="ee ee-card ee-bandcamp-card"><div class="ee-card-inner"><div class="ee-card-header"><a href="${esc(url)}" target="_blank" class="ee-repo-name">${esc(match[3])}</a><span class="ee-stat" style="margin-left:auto;font-size:0.85em;color:var(--muted)">Bandcamp ${match[2]}</span></div></div></div>`;
  }

  return `<div class="ee ee-bandcamp" data-ee-type="bandcamp" data-ee-type-param="${typeParam}" data-ee-item-id="${itemId}"><div class="ee-loading">Loading...</div></div>`;
}

function extractVimeoId(url: string): string | null {
  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function renderVimeo(url: string): string {
  const videoId = extractVimeoId(url);
  if (!videoId) return '';
  return `<lite-vimeo class="video-embed" videoid="${videoId}" videotitle="Vimeo video"><a class="lite-vimeo-fallback" href="https://vimeo.com/${videoId}">Watch on Vimeo</a></lite-vimeo>`;
}

function renderCodePen(url: string): string {
  const match = url.match(CODEPEN_PATTERN);
  if (!match) return '';
  const [, user, pen] = match;
  return `<div class="ee ee-codepen"><iframe src="https://codepen.io/${user}/embed/${pen}?default-tab=result" frameborder="0" loading="lazy" allowfullscreen style="width:100%;height:400px;border-radius:8px"></iframe></div>`;
}

function renderFigma(url: string): string {
  const encoded = encodeURIComponent(url);
  return `<div class="ee ee-figma"><iframe src="https://www.figma.com/embed?embed_host=astro&url=${encoded}" frameborder="0" loading="lazy" allowfullscreen style="width:100%;height:450px;border-radius:8px"></iframe></div>`;
}

// ─── GitHub: fetched at build time so visitors never hit GitHub's
// 60-req/hour unauthenticated rate limit. Set GITHUB_TOKEN env var to
// raise the build-time quota to 5000/hour.

function renderGithubFallback(url: string, label: string): string {
  return `<div class="ee ee-card ee-github-fallback"><div class="ee-card-inner"><a href="${esc(url)}" target="_blank" class="ee-repo-name">${esc(label)}</a><span class="ee-stat" style="margin-left:auto;font-size:0.85em;color:var(--muted)">GitHub</span></div></div>`;
}

async function renderGithubRepo(url: string): Promise<string> {
  const match = url.match(GITHUB_REPO_PATTERN);
  if (!match) return '';
  const owner = match[1];
  const repo = match[2];
  const cacheKey = `${owner}/${repo}`;

  let d: any = githubRepoCache.get(cacheKey);
  if (d === undefined) {
    d = await cachedFetchJson<any>(`gh-repo:${cacheKey}`, `https://api.github.com/repos/${owner}/${repo}`, githubHeaders);
    githubRepoCache.set(cacheKey, d);
  }
  if (!d) return renderGithubFallback(url, `${owner}/${repo}`);

  const lc = d.language && langColors[d.language] ? langColors[d.language] : 'var(--muted)';
  const langChip = d.language ? `<span class="ee-stat"><span class="ee-lang-dot" style="background-color:${lc}"></span>${esc(d.language)}</span>` : '';
  const desc = d.description ? `<p class="ee-description">${esc(d.description)}</p>` : '';
  const stars = (d.stargazers_count ?? 0).toLocaleString();
  const forks = (d.forks_count ?? 0).toLocaleString();

  return `<div class="ee ee-card ee-github-repo"><div class="ee-card-inner"><div class="ee-card-header"><img class="ee-avatar" src="${esc(d.owner.avatar_url)}" width="20" height="20" alt="${esc(d.owner.login)} avatar" /><a class="ee-repo-name" href="${esc(d.html_url)}" target="_blank">${esc(d.full_name)}</a></div>${desc}<div class="ee-card-footer">${langChip}<span class="ee-stat">${stars} stars</span><span class="ee-stat">${forks} forks</span></div></div></div>`;
}

async function renderGithubIssue(url: string): Promise<string> {
  const match = url.match(GITHUB_ISSUE_PATTERN);
  if (!match) return '';
  const [, owner, repo, type, number] = match;
  const isPR = type === 'pull';
  const apiPath = isPR ? 'pulls' : 'issues';
  const cacheKey = `${owner}/${repo}/${apiPath}/${number}`;

  let d: any = githubIssueCache.get(cacheKey);
  if (d === undefined) {
    d = await cachedFetchJson<any>(`gh-issue:${cacheKey}`, `https://api.github.com/repos/${owner}/${repo}/${apiPath}/${number}`, githubHeaders);
    githubIssueCache.set(cacheKey, d);
  }
  if (!d) return renderGithubFallback(url, `${owner}/${repo} #${number}`);

  const merged = d.pull_request?.merged_at;
  const stateLabel = merged ? 'Merged' : d.state === 'open' ? 'Open' : 'Closed';
  const stateCls = merged ? 'ee-state-merged' : d.state === 'open' ? 'ee-state-open' : 'ee-state-closed';
  const date = fmtDate(d.created_at);
  const labels = (d.labels || []).slice(0, 3).map((l: any) =>
    `<span class="ee-label" style="background-color:#${esc(l.color)};color:${parseInt(l.color, 16) > 0x7fffff ? '#000' : '#fff'}">${esc(l.name)}</span>`
  ).join('');

  return `<div class="ee ee-card ee-github-issue"><div class="ee-card-inner"><div class="ee-card-header"><span class="ee-state-badge ${stateCls}">${stateLabel}</span><a class="ee-issue-title" href="${esc(d.html_url)}" target="_blank">${esc(d.title)}</a></div><p class="ee-subtitle">${esc(owner)}/${esc(repo)} #${esc(number)}</p><div class="ee-card-footer">${labels ? `<span class="ee-labels">${labels}</span>` : ''}<span class="ee-meta"><img class="ee-avatar-sm" src="${esc(d.user.avatar_url)}" width="16" height="16" alt="" />${esc(d.user.login)} on ${date}</span></div></div></div>`;
}

async function renderGithubGist(url: string): Promise<string> {
  const match = url.match(GITHUB_GIST_PATTERN);
  if (!match) return '';
  const gistId = match[2];

  let d: any = githubGistCache.get(gistId);
  if (d === undefined) {
    d = await cachedFetchJson<any>(`gh-gist:${gistId}`, `https://api.github.com/gists/${gistId}`, githubHeaders);
    githubGistCache.set(gistId, d);
  }
  if (!d) return renderGithubFallback(url, 'View gist');

  const files = Object.values(d.files || {}) as any[];
  const firstFile = files[0] || {};
  const title = d.description || firstFile.filename || 'View gist';
  const raw: string = firstFile.content || '';
  const allLines = raw.split('\n');
  let preview = allLines.slice(0, 12).join('\n');
  if (allLines.length > 12 || firstFile.truncated) preview += '\n...';
  const ownerHtml = d.owner
    ? `<img class="ee-avatar" src="${esc(d.owner.avatar_url)}" width="20" height="20" alt="" /><a class="ee-gist-owner" href="https://github.com/${esc(d.owner.login)}" target="_blank">${esc(d.owner.login)}</a>`
    : '';

  return `<div class="ee ee-card ee-github-gist"><div class="ee-card-inner ee-gist-card"><div class="ee-card-header">${ownerHtml}</div><a class="ee-gist-title" href="${esc(d.html_url)}" target="_blank">${esc(title)}</a><div class="ee-gist-file"><div class="ee-gist-file-header"><span class="ee-gist-filename">${esc(firstFile.filename || '')}</span></div><pre class="ee-gist-code"><code>${esc(preview)}</code></pre></div></div></div>`;
}

async function renderReddit(url: string): Promise<string> {
  const match = url.match(REDDIT_PATTERN);
  if (!match) return '';
  const subreddit = match[1];
  const postId = match[2];
  const cacheKey = `${subreddit}/${postId}`;

  let d: any = redditCache.get(cacheKey);
  if (d === undefined) {
    const data: any = await cachedFetchJson<any>(`reddit:${cacheKey}`, `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`, { 'User-Agent': 'axis-build' });
    d = data?.[0]?.data?.children?.[0]?.data || null;
    redditCache.set(cacheKey, d);
  }
  if (!d) return renderGithubFallback(url, `r/${subreddit}`);

  const date = fmtDate(new Date(d.created_utc * 1000).toISOString());
  const body = d.is_self && d.selftext
    ? (d.selftext.length > 300 ? d.selftext.substring(0, 300) + '...' : d.selftext)
    : '';
  const flair = d.link_flair_text ? `<span class="ee-reddit-flair">${esc(d.link_flair_text)}</span>` : '';

  return `<div class="ee ee-card ee-reddit"><div class="ee-card-inner"><div class="ee-card-header"><a class="ee-reddit-sub" href="https://www.reddit.com/${esc(d.subreddit_name_prefixed)}/" target="_blank">${esc(d.subreddit_name_prefixed)}</a><span class="ee-reddit-meta">Posted by <a class="ee-reddit-author" href="https://www.reddit.com/user/${esc(d.author)}/" target="_blank">u/${esc(d.author)}</a> on ${date}</span>${flair}</div><a class="ee-reddit-title" href="https://www.reddit.com${esc(d.permalink)}" target="_blank">${esc(d.title)}</a>${body ? `<p class="ee-reddit-body">${esc(body)}</p>` : ''}<div class="ee-card-footer"><span class="ee-stat">${(d.score ?? 0).toLocaleString()} upvotes</span><span class="ee-stat">${(d.num_comments ?? 0).toLocaleString()} comments</span></div></div></div>`;
}

function renderBluesky(url: string): string {
  const match = url.match(BLUESKY_PATTERN);
  if (!match) return '';
  const handle = match[1];
  const postId = match[2];
  return `<div class="ee ee-card ee-bluesky" data-ee-type="bluesky" data-ee-handle="${encodeURIComponent(handle)}" data-ee-post-id="${postId}" data-ee-url="${esc(url)}"><div class="ee-loading">Loading post...</div></div>`;
}

function renderMastodon(url: string): string {
  const match = url.match(MASTODON_PATTERN);
  if (!match) return '';
  const instance = match[1];
  const postId = match[3];
  return `<div class="ee ee-card ee-mastodon" data-ee-type="mastodon" data-ee-instance="${instance}" data-ee-post-id="${postId}"><div class="ee-loading">Loading post...</div></div>`;
}

function renderLinkedin(url: string): string {
  const match = url.match(LINKEDIN_PATTERN);
  if (!match) return '';
  const [, activityType, urnType, id] = match;
  const type = activityType || urnType;

  let embedUrl: string;
  let search = '';
  try {
    const urlObj = new URL(url);
    search = urlObj.search;
    if (urlObj.pathname.includes('/embed/feed/update/')) {
      embedUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
    } else {
      embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}${search}`;
    }
  } catch {
    embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`;
  }

  const liMode = search.includes('compact=1')
    ? 'compact'
    : search.includes('collapsed=1')
      ? 'collapsed'
      : 'full';

  return `<div class="ee ee-linkedin" data-li-mode="${liMode}"><iframe src="${esc(embedUrl)}" frameborder="0" allowfullscreen loading="lazy" title="Embedded post"></iframe></div>`;
}

function renderSteam(url: string): string {
  let match = url.match(STEAM_APP_PATTERN);
  if (match) return `<div class="ee ee-steam"><iframe src="https://store.steampowered.com/widget/${match[1]}/" frameborder="0" loading="lazy" style="width:100%;height:190px;border-radius:12px"></iframe></div>`;

  match = url.match(STEAM_BUNDLE_PATTERN);
  if (match) return `<div class="ee ee-steam"><iframe src="https://store.steampowered.com/widget/bundle/${match[1]}/" frameborder="0" loading="lazy" style="width:100%;height:190px;border-radius:12px"></iframe></div>`;

  match = url.match(STEAM_SUB_PATTERN);
  if (match) return `<div class="ee ee-steam"><iframe src="https://store.steampowered.com/widget/${match[1]}/" frameborder="0" loading="lazy" style="width:100%;height:190px;border-radius:12px"></iframe></div>`;

  return '';
}

// ─── Open Graph Fallback ───

interface OgData {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

const ogCache = new Map<string, OgData | null>();

async function fetchOgData(url: string): Promise<OgData | null> {
  if (ogCache.has(url)) return ogCache.get(url)!;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmbedBot/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();

    const getMeta = (property: string): string => {
      const m = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
      return m ? m[1] : '';
    };

    const title = getMeta('og:title') || getMeta('twitter:title')
      || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');
    const image = getMeta('og:image') || getMeta('twitter:image');
    const siteName = getMeta('og:site_name') || new URL(url).hostname;

    if (!title) {
      ogCache.set(url, null);
      return null;
    }

    const data: OgData = { title, description, image, siteName, url };
    ogCache.set(url, data);
    return data;
  } catch {
    ogCache.set(url, null);
    return null;
  }
}

function renderOgCard(og: OgData): string {
  const imageHtml = og.image
    ? `<a class="ee-og-image-link" href="${esc(og.url)}" target="_blank"><img class="ee-og-image" src="${esc(og.image)}" alt="${esc(og.title)}" loading="lazy" /></a>`
    : '';
  return `<div class="ee ee-card ee-og"><div class="ee-card-inner">${imageHtml}<div class="ee-og-body"><a class="ee-og-title" href="${esc(og.url)}" target="_blank">${esc(og.title)}</a>${og.description ? `<p class="ee-og-desc">${esc(og.description)}</p>` : ''}<span class="ee-og-site">${esc(og.siteName)}</span></div></div></div>`;
}

// ─── Provider Router ───

async function renderEmbed(url: string, width?: number, height?: number): Promise<string | null> {
  let html: string | null = null;

  if (extractVimeoId(url)) html = renderVimeo(url);
  else if (SPOTIFY_PATTERN.test(url)) html = renderSpotify(url);
  else if (SPOTIFY_PODCAST_PATTERN.test(url)) html = renderSpotifyPodcast(url);
  else if (APPLE_MUSIC_PATTERN.test(url)) html = renderAppleMusic(url);
  else if (SOUNDCLOUD_PATTERN.test(url)) html = renderSoundCloud(url);
  else if (BANDCAMP_PATTERN.test(url)) {
    const match = url.match(BANDCAMP_PATTERN);
    const type = match ? match[2] : 'track';
    const itemId = await fetchBandcampItemId(url, type);
    html = renderBandcamp(url, itemId);
  }
  else if (CODEPEN_PATTERN.test(url)) html = renderCodePen(url);
  else if (FIGMA_PATTERN.test(url)) html = renderFigma(url);
  else if (GITHUB_ISSUE_PATTERN.test(url)) html = await renderGithubIssue(url);
  else if (GITHUB_GIST_PATTERN.test(url)) html = await renderGithubGist(url);
  else if (GITHUB_REPO_PATTERN.test(url)) html = await renderGithubRepo(url);
  else if (REDDIT_PATTERN.test(url)) html = await renderReddit(url);
  else if (BLUESKY_PATTERN.test(url)) html = renderBluesky(url);
  else if (MASTODON_PATTERN.test(url)) html = renderMastodon(url);
  else if (LINKEDIN_PATTERN.test(url)) html = renderLinkedin(url);
  else if (STEAM_APP_PATTERN.test(url) || STEAM_BUNDLE_PATTERN.test(url) || STEAM_SUB_PATTERN.test(url)) html = renderSteam(url);
  else {
    // Open Graph fallback for any URL
    const og = await fetchOgData(url);
    if (og) html = renderOgCard(og);
  }

  if (!html) return null;

  // Wrap with custom width if specified
  if (width) {
    const heightStyle = height ? `--ee-height:${height}px;` : '';
    html = `<div class="ee-custom-width" style="--ee-width:${width}px;${heightStyle}">${html}</div>`;
  }

  return html;
}

// ─── Plugin ───

export const remarkExtendedEmbeds: Plugin<[], Root> = () => {
  return async (tree: Root) => {
    const replacements: { parent: any; index: number; parsed: { url: string; width?: number; height?: number } }[] = [];

    visit(tree, 'code', (node: Code, index, parent) => {
      if (node.lang !== 'embed' || !parent || typeof index !== 'number') return;
      const parsed = parseSource(node.value);
      if (!parsed) return;
      replacements.push({ parent, index, parsed });
    });

    // Process all embeds (allows parallel async fetches for Bandcamp/OG)
    const results = await Promise.all(
      replacements.map(r => renderEmbed(r.parsed.url, r.parsed.width, r.parsed.height))
    );

    // Apply replacements in reverse order to preserve indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const html = results[i];
      if (html) {
        replacements[i].parent.children[replacements[i].index] = createHtmlNode(html) as any;
      }
    }
  };
};
