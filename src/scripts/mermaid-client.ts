async function initMermaid() {
  const diagrams = document.querySelectorAll('.mermaid-diagram');
  if (diagrams.length === 0) return;

  const { default: mermaid } = await import('mermaid');
  const isDark = document.documentElement.classList.contains('dark');

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
  });

  diagrams.forEach(async (diagram) => {
    const source = diagram.getAttribute('data-mermaid-source');
    const id = diagram.getAttribute('data-mermaid-id');
    if (!source || !id) return;

    try {
      const decoded = decodeURIComponent(source);
      const { svg } = await mermaid.render(id, decoded);
      const content = diagram.querySelector('.mermaid-diagram-content');
      if (content) content.innerHTML = svg;
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  });
}

initMermaid();

document.addEventListener('astro:page-load', () => {
  initMermaid();
});
