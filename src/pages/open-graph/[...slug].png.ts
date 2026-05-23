import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { shouldShowPost, sortPostsByDate } from '@/utils/markdown';
import { generateOgImage, ogResponse } from '@/utils/og-image';
import { siteConfig } from '@/config';
import type { Post, Project, Doc } from '@/types';

type CustomType = NonNullable<typeof siteConfig.customContentTypes>[number];

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { slug: string }; props: { title: string } }[] = [];

  // ---------- Posts ----------
  const allPosts = (await getCollection('posts')) as unknown as Post[];
  const posts = sortPostsByDate(allPosts.filter(shouldShowPost));
  for (const post of posts) {
    paths.push({ params: { slug: post.id }, props: { title: post.data.title } });
  }

  // ---------- Pages ----------
  const allPages = await getCollection('pages');
  const pages = allPages.filter((page) => !page.data.draft || !import.meta.env.PROD);
  for (const page of pages) {
    paths.push({ params: { slug: page.id }, props: { title: page.data.title } });
  }

  // ---------- Projects ----------
  if (siteConfig.contentTypes?.projects) {
    const allProjects = (await getCollection('projects')) as unknown as Project[];
    const visibleProjects = allProjects.filter((p) => !p.data.draft);
    const projectsBase = siteConfig.routes?.projectsBase || 'projects';
    for (const project of visibleProjects) {
      paths.push({
        params: { slug: `${projectsBase}/${project.id}` },
        props: { title: project.data.title },
      });
    }

    // Projects index
    let projectsTitle = 'Projects';
    try {
      const specialId = projectsBase;
      const entry =
        (await getEntry('special', specialId)) ||
        (specialId !== 'projects' ? await getEntry('special', 'projects') : null);
      if (entry) projectsTitle = entry.data.title || projectsTitle;
    } catch {}
    paths.push({ params: { slug: projectsBase }, props: { title: projectsTitle } });
  }

  // ---------- Docs ----------
  if (siteConfig.contentTypes?.docs) {
    const allDocs = (await getCollection('docs')) as unknown as Doc[];
    const visibleDocs = allDocs.filter((d) => !d.data.draft);
    const docsBase = siteConfig.routes?.docsBase || 'docs';
    for (const doc of visibleDocs) {
      paths.push({
        params: { slug: `${docsBase}/${doc.id}` },
        props: { title: doc.data.title },
      });
    }

    // Docs index
    let docsTitle = 'Documentation';
    try {
      const specialId = docsBase;
      const entry =
        (await getEntry('special', specialId)) ||
        (specialId !== 'docs' ? await getEntry('special', 'docs') : null);
      if (entry) docsTitle = entry.data.title || docsTitle;
    } catch {}
    paths.push({ params: { slug: docsBase }, props: { title: docsTitle } });
  }

  // ---------- Posts listing (page 1) + pagination ----------
  const postsBase = siteConfig.routes?.postsBase || 'posts';
  let postsTitle = 'Posts';
  try {
    const specialId = postsBase;
    const postsPage =
      (await getEntry('special', specialId)) ||
      (specialId !== 'posts' ? await getEntry('special', 'posts') : null);
    if (postsPage) postsTitle = postsPage.data.title || postsTitle;
  } catch {}

  const totalPostPages = Math.max(1, Math.ceil(posts.length / siteConfig.postsPerPage));
  paths.push({ params: { slug: postsBase }, props: { title: postsTitle } });
  for (let i = 2; i <= totalPostPages; i++) {
    paths.push({
      params: { slug: `${postsBase}/${i}` },
      props: { title: `${postsTitle} - Page ${i}` },
    });
  }

  // ---------- Posts tag listing + pagination ----------
  const tagMap = new Map<string, Post[]>();
  for (const post of posts) {
    for (const tag of post.data.tags || []) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(post);
    }
  }
  for (const [tag, tagPosts] of tagMap) {
    paths.push({
      params: { slug: `${postsBase}/tag/${tag}` },
      props: { title: `Posts tagged #${tag}` },
    });
    const tagTotalPages = Math.ceil(tagPosts.length / siteConfig.postsPerPage);
    for (let i = 2; i <= tagTotalPages; i++) {
      paths.push({
        params: { slug: `${postsBase}/tag/${tag}/${i}` },
        props: { title: `Posts tagged #${tag} - Page ${i}` },
      });
    }
  }

  // ---------- Custom content types ----------
  const customTypes = (siteConfig.customContentTypes ?? []).filter((t: CustomType) => t.enabled);
  for (const def of customTypes) {
    try {
      const entries = await getCollection(def.id as any);
      const visible = entries.filter((e: any) => !e.data?.draft || !import.meta.env.PROD);
      for (const entry of visible as any[]) {
        const title = entry?.data?.title || entry?.id || def.label;
        paths.push({
          params: { slug: `${def.routeBase}/${entry.id}` },
          props: { title },
        });
      }
    } catch {}

    // Custom type index
    let customTitle = def.label;
    try {
      const specialEntry = await getEntry('special', def.id);
      if (specialEntry) customTitle = specialEntry.data.title || customTitle;
    } catch {}
    paths.push({ params: { slug: def.routeBase }, props: { title: customTitle } });
  }

  // ---------- Default (index) ----------
  paths.push({ params: { slug: 'index' }, props: { title: siteConfig.homepageTitle || siteConfig.title || 'Home' } });

  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const pngBuffer = await generateOgImage(props.title);
  return ogResponse(pngBuffer);
};
