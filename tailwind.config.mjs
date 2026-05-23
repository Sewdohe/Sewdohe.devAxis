import { siteConfig } from './src/config.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [siteConfig.fonts.families.body, 'system-ui', 'sans-serif'],
        heading: [siteConfig.fonts.families.heading, 'system-ui', 'sans-serif'],
        mono: [siteConfig.fonts.families.mono, 'monospace'],
      },
      maxWidth: {
        content: '680px',
      },
      colors: {
        bg: {
          light: '#ffffff',
          dark: '#161616',
        },
        text: {
          light: '#000000',
          dark: '#fafafa',
        },
        muted: {
          light: '#6b7280',
          dark: '#9ca3af',
          foreground: 'var(--muted)',
        },
        accent: {
          DEFAULT: 'var(--border)',
          foreground: 'var(--text)',
        },
        popover: {
          DEFAULT: 'var(--bg)',
          foreground: 'var(--text)',
        },
        overlay: '#000000',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--text)',
            '--tw-prose-headings': 'var(--text)',
            '--tw-prose-links': 'var(--text)',
            '--tw-prose-bold': 'var(--text)',
            '--tw-prose-counters': 'var(--muted)',
            '--tw-prose-bullets': 'var(--muted)',
            '--tw-prose-hr': 'var(--muted)',
            '--tw-prose-quotes': 'var(--text)',
            '--tw-prose-quote-borders': 'var(--muted)',
            '--tw-prose-captions': 'var(--muted)',
            '--tw-prose-code': 'var(--text)',
            '--tw-prose-th-borders': 'var(--muted)',
            '--tw-prose-td-borders': 'var(--muted)',
            maxWidth: '680px',
            'h2 + table, h3 + table, h4 + table': {
              marginTop: '1.5em',
            },
            table: {
              marginTop: '2.5em',
              marginBottom: '2.5em',
              fontSize: '0.875em',
              lineHeight: '1.5',
              borderCollapse: 'collapse',
              tableLayout: 'auto',
              width: '100%',
            },
            'thead th': {
              fontSize: '0.75em',
              fontWeight: '600',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              paddingBottom: '0.75em',
              paddingInlineEnd: '1em',
              paddingInlineStart: '0',
              borderBottomWidth: '2px',
              borderBottomColor: 'var(--muted)',
            },
            'thead th:first-child': {
              paddingInlineStart: '0',
            },
            'thead th:last-child, tbody td:last-child, thead th:first-child, tbody td:first-child': {
              whiteSpace: 'nowrap',
            },
            'tbody td, tfoot td': {
              paddingTop: '0.625em',
              paddingBottom: '0.625em',
              paddingInlineEnd: '1em',
              paddingInlineStart: '0',
              verticalAlign: 'top',
            },
            'tbody td:first-child, tfoot td:first-child': {
              paddingInlineStart: '0',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'var(--border)',
            },
            'tbody tr:last-child': {
              borderBottomWidth: '0',
            },
            a: {
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              '&:hover': {
                opacity: '0.8',
              },
            },
            li: {
              marginTop: '0.125em',
              marginBottom: '0.125em',
            },
            ul: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            ol: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            code: {
              fontFamily: 'JetBrains Mono, monospace',
            },
            'pre code': {
              fontFamily: 'JetBrains Mono, monospace',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
