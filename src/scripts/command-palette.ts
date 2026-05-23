import Fuse from 'fuse.js';
import { navigate } from 'astro:transitions/client';

(window as any).__cmdPaletteModuleReady = true;

// --- IDs ---
const PINNED_GROUP_IDS = ['command-group-actions', 'command-group-pinned-pages', 'command-group-pinned-social'];
const PINNED_SEP_IDS = ['pinned-sep-1', 'pinned-sep-2'];
const SEARCH_GROUP_IDS = ['command-group-mixed', 'command-group-posts', 'command-group-pages'];

// --- Search modes ---
const MODES = ['everything', 'posts', 'pages'] as const;
type SearchMode = typeof MODES[number];
const MODE_PLACEHOLDERS: Record<SearchMode, string> = {
  everything: 'Search everything',
  posts: 'Search posts',
  pages: 'Search pages',
};

let searchMode: SearchMode = 'everything';
let selectedIndex = 0;
let isSearching = false;

// Data stores
let postsFuse: Fuse<any> | null = null;
let posts: any[] = [];
let postsLoading = false;

let pagesFuse: Fuse<any> | null = null;
let pages: any[] = [];
let pagesLoading = false;

let projectsFuse: Fuse<any> | null = null;
let projectItems: any[] = [];
let projectsLoading = false;

let docsFuse: Fuse<any> | null = null;
let docItems: any[] = [];
let docsLoading = false;

// --- Visible items for keyboard nav (works for BOTH pinned and search results) ---
function getAllVisibleItems(): HTMLElement[] {
  const items: HTMLElement[] = [];
  const command = document.querySelector('[data-command]');
  if (!command) return items;

  // Collect from ALL groups (pinned + search)
  command.querySelectorAll('[data-command-group]').forEach(group => {
    if ((group as HTMLElement).hidden || (group as HTMLElement).classList.contains('hidden')) return;
    group.querySelectorAll('[data-search-result], [data-command-item]').forEach(el => {
      if (!(el as HTMLElement).hidden) items.push(el as HTMLElement);
    });
  });
  return items;
}

function clearSelection() {
  document.querySelectorAll('[data-selected="true"]').forEach(el => {
    el.removeAttribute('data-selected');
    el.setAttribute('aria-selected', 'false');
  });
}

function updateSelection() {
  clearSelection();
  const items = getAllVisibleItems();
  if (selectedIndex >= 0 && selectedIndex < items.length) {
    const item = items[selectedIndex];
    item.setAttribute('data-selected', 'true');
    item.setAttribute('aria-selected', 'true');
    item.scrollIntoView({ block: 'nearest' });
  }
  const input = document.querySelector('[data-command-input]') as HTMLInputElement | null;
  if (input && document.activeElement !== input) input.focus();
}

function selectFirst() {
  selectedIndex = 0;
  updateSelection();
}

// --- Show/hide pinned vs search ---
function showPinnedList() {
  isSearching = false;
  PINNED_GROUP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.hidden = false; el.classList.remove('hidden'); }
  });
  PINNED_SEP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.hidden = false; el.classList.remove('hidden'); }
  });
  SEARCH_GROUP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.hidden = true; }
  });
  const empty = document.querySelector('[data-command-empty]') as HTMLElement | null;
  if (empty) empty.hidden = true;
}

function hidePinnedList() {
  isSearching = true;
  PINNED_GROUP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.hidden = true; el.classList.add('hidden'); }
  });
  PINNED_SEP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.hidden = true; el.classList.add('hidden'); }
  });
}

function hideAllSearchGroups() {
  SEARCH_GROUP_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.hidden = true; }
  });
}

// --- Data loaders ---
async function loadPosts() {
  if (posts.length > 0 || postsLoading) return;
  postsLoading = true;
  try {
    const res = await fetch('/api/posts.json');
    posts = await res.json();
    postsFuse = new Fuse(posts, { keys: ['title', 'description', 'tags'], threshold: 0.3, includeScore: true });
  } catch (e) { console.error('Failed to load posts:', e); }
  finally { postsLoading = false; }
}

async function loadPages() {
  if (pages.length > 0 || pagesLoading) return;
  pagesLoading = true;
  try {
    const [pagesRes, customRes] = await Promise.all([
      fetch('/api/pages.json'),
      fetch('/api/custom.json').catch(() => null as any),
    ]);
    const basePages = await pagesRes.json();
    let custom: any[] = [];
    if (customRes && customRes.ok) {
      try { custom = await customRes.json(); } catch { custom = []; }
    }
    pages = [...basePages, ...custom];
    pagesFuse = new Fuse(pages, { keys: ['title', 'description'], threshold: 0.3, includeScore: true });
  } catch (e) { console.error('Failed to load pages:', e); }
  finally { pagesLoading = false; }
}

async function loadProjects() {
  if (projectItems.length > 0 || projectsLoading) return;
  projectsLoading = true;
  try {
    const res = await fetch('/api/projects.json');
    projectItems = await res.json();
    projectsFuse = new Fuse(projectItems, { keys: ['title', 'description', 'tags'], threshold: 0.3, includeScore: true });
  } catch (e) { /* projects API may not exist */ }
  finally { projectsLoading = false; }
}

async function loadDocs() {
  if (docItems.length > 0 || docsLoading) return;
  docsLoading = true;
  try {
    const res = await fetch('/api/docs.json');
    docItems = await res.json();
    docsFuse = new Fuse(docItems, { keys: ['title', 'description', 'category'], threshold: 0.3, includeScore: true });
  } catch (e) { /* docs API may not exist */ }
  finally { docsLoading = false; }
}

async function loadAll() {
  await Promise.all([loadPosts(), loadPages(), loadProjects(), loadDocs()]);
}

// --- Mode switching ---
function setMode(mode: SearchMode) {
  searchMode = mode;
  const input = document.querySelector('[data-command-input]') as HTMLInputElement | null;
  if (input) input.placeholder = MODE_PLACEHOLDERS[mode];

  if (mode === 'everything') loadAll();
  else if (mode === 'posts') loadPosts();
  else if (mode === 'pages') loadPages();

  if (input && input.value.trim()) {
    handleInput({ target: input } as unknown as Event);
  } else {
    showPinnedList();
    selectedIndex = 0;
    updateSelection();
  }
}

function cycleMode() {
  const idx = MODES.indexOf(searchMode);
  setMode(MODES[(idx + 1) % MODES.length]);
}

// --- Dialog helpers ---
function getDialogElements() {
  const dialog = document.querySelector('[data-command-dialog]');
  if (!dialog) return null;
  return {
    dialog,
    overlay: dialog.querySelector('[data-command-dialog-overlay]') as HTMLElement | null,
    content: dialog.querySelector('[data-command-dialog-content]') as HTMLElement | null,
    input: dialog.querySelector('[data-command-input]') as HTMLInputElement | null,
  };
}

function isDialogOpen() {
  const els = getDialogElements();
  return els?.overlay && !els.overlay.hidden;
}

function openDialog() {
  const els = getDialogElements();
  if (!els) return;
  // Set opacity to 0 and unhide, then start animation on next frame to prevent flash
  if (els.overlay) { els.overlay.style.opacity = '0'; els.overlay.hidden = false; els.overlay.classList.remove('dialog-closing'); }
  if (els.content) { els.content.style.opacity = '0'; els.content.hidden = false; els.content.classList.remove('dialog-closing'); }
  requestAnimationFrame(() => {
    if (els.overlay) { els.overlay.style.opacity = ''; els.overlay.classList.add('dialog-open'); }
    if (els.content) { els.content.style.opacity = ''; els.content.classList.add('dialog-open'); els.input?.focus(); }
  });
  document.body.style.overflow = 'hidden';
  showPinnedList();
  loadAll();
  requestAnimationFrame(() => { requestAnimationFrame(() => selectFirst()); });
}

function closeDialog() {
  const els = getDialogElements();
  if (!els) return;
  if (els.overlay) { els.overlay.classList.remove('dialog-open'); els.overlay.classList.add('dialog-closing'); }
  if (els.content) { els.content.classList.remove('dialog-open'); els.content.classList.add('dialog-closing'); }
  setTimeout(() => {
    if (els.overlay) { els.overlay.hidden = true; els.overlay.classList.remove('dialog-closing'); }
    if (els.content) { els.content.hidden = true; els.content.classList.remove('dialog-closing'); }
  }, 100);
  document.body.style.overflow = '';
  if (els.input) els.input.value = '';
  showPinnedList();
  hideAllSearchGroups();
  selectedIndex = 0;
  clearSelection();
  searchMode = 'everything';
  const input = document.querySelector('[data-command-input]') as HTMLInputElement | null;
  if (input) input.placeholder = MODE_PLACEHOLDERS.everything;
}

function toggleTheme() {
  const html = document.documentElement;
  if (html.classList.contains('dark')) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  // Reapply color theme for the new mode
  if ((window as any).__axisApplyTheme) {
    const t = localStorage.getItem('selectedTheme') || (window as any).__axisDefaultTheme || 'axis';
    (window as any).__axisApplyTheme(t);
  }
}

function navigateTo(href: string, external: boolean) {
  closeDialog();
  if (external) {
    window.open(href, '_blank');
  } else {
    navigate(href);
  }
}

function activateItem(item: HTMLElement) {
  const action = item.getAttribute('data-action');
  if (action === 'toggle-theme') {
    toggleTheme();
    closeDialog();
    return;
  }
  if (action === 'switch-theme') {
    closeDialog();
    setTimeout(() => {
      if ((window as any).__openThemeSelector) (window as any).__openThemeSelector();
    }, 120);
    return;
  }
  if (action === 'graph-view') {
    closeDialog();
    if ((window as any).__openGraphModal) (window as any).__openGraphModal();
    return;
  }
  const href = item.getAttribute('data-href');
  const external = item.getAttribute('data-external') === 'true';
  if (href) navigateTo(href, external);
}

// --- SVG icons (loaded from build-time defaults embedded in page) ---
const DEFAULTS = (window as any).__cmdDefaults || {};
const ICON_POST = DEFAULTS.post || '';
const ICON_PAGE = DEFAULTS.page || '';
const ICON_EXTERNAL = DEFAULTS.external || '';

function getIcon(type: string, item?: any) {
  // Use pre-rendered icon from API if available
  if (item?.icon) return item.icon;

  if (type === 'post') return ICON_POST;
  if (type === 'page') {
    if (item?.url?.startsWith('http') || item?.external) return ICON_EXTERNAL;
    return ICON_PAGE;
  }
  return ICON_PAGE;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Render a single result item HTML ---
function renderResultItem(item: any, type: string): string {
  const isExternal = !!item.external || (type === 'page' && item.url?.startsWith('http'));
  const icon = getIcon(type, item);
  const href = escapeHtml(item.url);
  const title = escapeHtml(item.title);
  const subtitle = item.description ? `<div class="text-xs mt-0.5" style="color: var(--muted);">${escapeHtml(item.description)}</div>` : '';

  return `<div class="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground" data-search-result data-href="${href}"${isExternal ? ' data-external="true"' : ''} role="option" aria-selected="false">
    ${icon}
    <div class="min-w-0 flex-1">
      <div class="truncate">${title}</div>
      ${subtitle}
    </div>
  </div>`;
}

// --- Render into a group ---
function renderGroupResults(groupId: string, listId: string, results: any[], type: 'post' | 'page') {
  const group = document.getElementById(groupId);
  const list = document.getElementById(listId);
  if (!group || !list) return;

  if (results.length === 0) {
    group.classList.add('hidden');
    group.hidden = true;
    list.innerHTML = '';
    return;
  }

  group.classList.remove('hidden');
  group.hidden = false;

  list.innerHTML = results.map((r: any) => renderResultItem(r.item, type)).join('');
  bindResultListeners(list);
}

// --- Render mixed results (everything mode) ---
function renderMixedResults(tagged: { item: any; score: number; type: string }[]) {
  const group = document.getElementById('command-group-mixed');
  const list = document.getElementById('command-mixed-list');
  if (!group || !list) return;

  if (tagged.length === 0) {
    group.classList.add('hidden');
    group.hidden = true;
    list.innerHTML = '';
    return;
  }

  group.classList.remove('hidden');
  group.hidden = false;

  // Sort by score (lower = better match)
  tagged.sort((a, b) => a.score - b.score);
  const top = tagged.slice(0, 12);

  list.innerHTML = top.map(t => renderResultItem(t.item, t.type)).join('');
  bindResultListeners(list);
}

function bindResultListeners(container: HTMLElement) {
  container.querySelectorAll('[data-search-result]').forEach(item => {
    item.addEventListener('click', () => activateItem(item as HTMLElement));
    item.addEventListener('mouseenter', () => {
      const items = getAllVisibleItems();
      const idx = items.indexOf(item as HTMLElement);
      if (idx >= 0) { selectedIndex = idx; updateSelection(); }
    });
  });
}

// --- Main input handler ---
function handleInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const query = input.value.trim();
  const empty = document.querySelector('[data-command-empty]') as HTMLElement | null;

  clearSelection();

  // No query: show pinned list
  if (query.length === 0) {
    showPinnedList();
    hideAllSearchGroups();
    selectedIndex = 0;
    updateSelection();
    return;
  }

  // Has query: hide pinned, show search results
  hidePinnedList();

  if (searchMode === 'everything') {
    // Hide per-type groups, use mixed group
    hideSearchGroup('command-group-posts');
    hideSearchGroup('command-group-pages');

    const postResults = (postsFuse?.search(query, { limit: 8 }) || []).map(r => ({ item: r.item, score: r.score ?? 1, type: 'post' }));
    const pageResults = (pagesFuse?.search(query, { limit: 8 }) || []).map(r => ({ item: r.item, score: r.score ?? 1, type: 'page' }));
    const projectResults = (projectsFuse?.search(query, { limit: 8 }) || []).map(r => ({ item: r.item, score: r.score ?? 1, type: 'page' }));
    const docResults = (docsFuse?.search(query, { limit: 8 }) || []).map(r => ({ item: r.item, score: r.score ?? 1, type: 'page' }));

    const all = [...postResults, ...pageResults, ...projectResults, ...docResults];
    renderMixedResults(all);

    if (empty) empty.hidden = all.length > 0;

    if (!postsFuse || !pagesFuse) {
      loadAll().then(() => { if (input.value.trim() === query) handleInput(e); });
    }
  } else if (searchMode === 'posts') {
    hideSearchGroup('command-group-mixed');
    hideSearchGroup('command-group-pages');
    if (!postsFuse) {
      loadPosts().then(() => { if (input.value.trim() === query) handleInput(e); });
      return;
    }
    const results = postsFuse.search(query, { limit: 10 });
    renderGroupResults('command-group-posts', 'command-posts-list', results, 'post');
    if (empty) empty.hidden = results.length > 0;
  } else if (searchMode === 'pages') {
    hideSearchGroup('command-group-mixed');
    hideSearchGroup('command-group-posts');
    if (!pagesFuse) {
      loadPages().then(() => { if (input.value.trim() === query) handleInput(e); });
      return;
    }
    const results = pagesFuse.search(query, { limit: 10 });
    renderGroupResults('command-group-pages', 'command-pages-list', results, 'page');
    if (empty) empty.hidden = results.length > 0;
  }

  selectedIndex = 0;
  updateSelection();
}

function hideSearchGroup(id: string) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); el.hidden = true; }
}

function handleKeyDown(e: KeyboardEvent) {
  if (!isDialogOpen()) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    cycleMode();
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
    const items = getAllVisibleItems();
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        activateItem(items[selectedIndex]);
      }
    }
  }
}

// --- Initialization ---
function bindTrigger() {
  const trigger = document.getElementById('command-palette-trigger');
  if (!trigger) return;
  const newTrigger = trigger.cloneNode(true) as HTMLElement;
  trigger.parentNode?.replaceChild(newTrigger, trigger);
  newTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDialogOpen()) closeDialog(); else openDialog();
  });
}

function bindCommandEvents() {
  const command = document.querySelector('[data-command]');
  if (!command || (command as HTMLElement).dataset.palettebound) return;
  (command as HTMLElement).dataset.palettebound = 'true';

  const input = command.querySelector('[data-command-input]') as HTMLInputElement | null;
  if (input) {
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown, true);
  }

  // Tab badge cycles mode
  const modeHint = document.getElementById('command-mode-hint');
  if (modeHint) {
    modeHint.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cycleMode();
      if (input) input.focus();
    });
  }

  // Bind click + hover on pinned static items
  command.querySelectorAll('[data-command-item]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      activateItem(item as HTMLElement);
    });
    item.addEventListener('mouseenter', () => {
      const items = getAllVisibleItems();
      const idx = items.indexOf(item as HTMLElement);
      if (idx >= 0) { selectedIndex = idx; updateSelection(); }
    });
  });
}

function bindOverlay() {
  const overlay = document.querySelector('[data-command-dialog-overlay]') as HTMLElement | null;
  if (!overlay || overlay.dataset.palettebound) return;
  overlay.dataset.palettebound = 'true';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });
}

function init() {
  bindTrigger();
  bindCommandEvents();
  bindOverlay();
  loadAll();

  document.addEventListener('keydown', (e) => {
    const shortcutKey = (window as any).__cmdPaletteShortcut || 'k';
    if ((e.metaKey || e.ctrlKey) && e.key === shortcutKey) {
      e.preventDefault();
      if (isDialogOpen()) closeDialog(); else openDialog();
    }
    if (e.key === 'Escape' && isDialogOpen()) closeDialog();
  });
}

function reinitPalette() {
  bindTrigger();
  const command = document.querySelector('[data-command]');
  if (command) (command as HTMLElement).removeAttribute('data-palettebound');
  const overlay = document.querySelector('[data-command-dialog-overlay]');
  if (overlay) (overlay as HTMLElement).removeAttribute('data-palettebound');
  bindCommandEvents();
  bindOverlay();
  loadAll();
}

// Run immediately so dialog animation timing is correct from first interaction
init();

// astro:page-load fires on first load AND every navigation.
// Skip the first fire (init() already ran) — only reinit on actual navigations.
let firstPageLoad = true;
document.addEventListener('astro:page-load', () => {
  if (firstPageLoad) { firstPageLoad = false; return; }
  reinitPalette();
});
