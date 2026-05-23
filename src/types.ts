export interface Post {
  id: string;
  body?: string;
  data: {
    title: string;
    published: Date;
    updated?: Date | null;
    description?: string | null;
    image?: string | null;
    tags?: string[] | null;
    draft?: boolean;
    imageAlt?: string | null;
    imageOG?: boolean;
    hideCoverImage?: boolean;
    hideTOC?: boolean;
    hideLocalGraph?: boolean;
    keyword?: string | null;
    redirects?: string | string[];
    aliases?: string | string[];
  };
  rendered?: {
    html: string;
    headings: Heading[];
  };
}

export interface Page {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string | null;
    noIndex?: boolean;
    hideTOC?: boolean;
    draft?: boolean;
    image?: string | null;
    imageAlt?: string | null;
    imageOG?: boolean;
    hideCoverImage?: boolean;
    redirects?: string | string[];
    aliases?: string | string[];
    updated?: Date | null;
    showUpdated?: boolean;
  };
  rendered?: {
    html: string;
    headings: Heading[];
  };
}

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface SEOData {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}

export interface Project {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string | null;
    date: Date;
    updated?: Date | null;
    tags?: string[] | null;
    draft?: boolean;
    image?: string | null;
    imageAlt?: string | null;
    imageOG?: boolean;
    hideCoverImage?: boolean;
    repositoryUrl?: string | null;
    projectUrl?: string | null;
    status?: 'active' | 'archived' | 'wip' | null;
    featured?: boolean;
  };
  rendered?: {
    html: string;
    headings: Heading[];
  };
}

export interface Doc {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string | null;
    category?: string | null;
    order?: number | null;
    updated?: Date | null;
    lastModified?: Date | null;
    draft?: boolean;
    image?: string | null;
    imageAlt?: string | null;
    imageOG?: boolean;
    hideCoverImage?: boolean;
  };
  rendered?: {
    html: string;
    headings: Heading[];
  };
}

export interface LinkedMention {
  slug: string;
  title: string;
  excerpt?: string;
}

export interface WikilinkMatch {
  link: string;
  display: string;
  slug: string;
}
