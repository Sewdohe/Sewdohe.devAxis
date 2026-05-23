// =============================================================================
// Axis Theme — Color Themes
// =============================================================================
// Each theme defines light and dark mode CSS variable values.
// Variables: --bg, --text, --muted, --border, --accent, --accent-text
// =============================================================================

export interface ThemeColors {
  light: {
    bg: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentText: string;
  };
  dark: {
    bg: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentText: string;
  };
}

export const themes: Record<string, ThemeColors> = {
  // Axis default — warm neutral with terracotta accent
  axis: {
    light: {
      bg: '#faf8f5',
      text: '#1a1714',
      muted: '#7a6f65',
      border: '#e8e0d6',
      accent: '#b85c38',
      accentText: '#faf8f5',
    },
    dark: {
      bg: '#1c1917',
      text: '#f5f0ea',
      muted: '#a09080',
      border: '#2e2924',
      accent: '#e07a55',
      accentText: '#1c1917',
    },
  },

  // Minimal — pure black and white
  minimal: {
    light: {
      bg: '#ffffff',
      text: '#000000',
      muted: '#6b7280',
      border: '#e5e7eb',
      accent: '#3778a0',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#161616',
      text: '#fafafa',
      muted: '#9ca3af',
      border: '#2a2a2a',
      accent: '#7ebbe8',
      accentText: '#161616',
    },
  },

  // Oxygen — slate with sky blue accent
  oxygen: {
    light: {
      bg: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      accent: '#0ea5e9',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#0f172a',
      text: '#f1f5f9',
      muted: '#94a3b8',
      border: '#1e293b',
      accent: '#38bdf8',
      accentText: '#0f172a',
    },
  },

  // Dracula — dark purple with violet accent
  dracula: {
    light: {
      bg: '#faf8ff',
      text: '#282a37',
      muted: '#6272a4',
      border: '#e2ddf8',
      accent: '#8b5cf6',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#282a37',
      text: '#f8f8f2',
      muted: '#6272a4',
      border: '#44475a',
      accent: '#bd93f9',
      accentText: '#282a37',
    },
  },

  // Nord — arctic blue palette
  nord: {
    light: {
      bg: '#eceff4',
      text: '#2e3440',
      muted: '#81a1c1',
      border: '#d8dee9',
      accent: '#5e81ac',
      accentText: '#eceff4',
    },
    dark: {
      bg: '#2e3440',
      text: '#eceff4',
      muted: '#81a1c1',
      border: '#3b4252',
      accent: '#81a1c1',
      accentText: '#2e3440',
    },
  },

  // Catppuccin — mocha/latte palette
  catppuccin: {
    light: {
      bg: '#eff1f5',
      text: '#4c4f69',
      muted: '#9ca0b0',
      border: '#dce0e8',
      accent: '#1e66f5',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#1e1e2e',
      text: '#cdd6f4',
      muted: '#7f849c',
      border: '#313244',
      accent: '#89b4fa',
      accentText: '#1e1e2e',
    },
  },

  // Rose Pine — earthy rose with pink accent
  'rose-pine': {
    light: {
      bg: '#faf4ed',
      text: '#575279',
      muted: '#9893a5',
      border: '#e4dfde',
      accent: '#d7827a',
      accentText: '#faf4ed',
    },
    dark: {
      bg: '#191724',
      text: '#e0def4',
      muted: '#6e6a86',
      border: '#26233a',
      accent: '#eb6f92',
      accentText: '#191724',
    },
  },

  // Gruvbox — warm retro palette
  gruvbox: {
    light: {
      bg: '#fbf1c7',
      text: '#3c3836',
      muted: '#928374',
      border: '#ebdbb2',
      accent: '#d79921',
      accentText: '#3c3836',
    },
    dark: {
      bg: '#282828',
      text: '#ebdbb2',
      muted: '#928374',
      border: '#3c3836',
      accent: '#fabd2f',
      accentText: '#282828',
    },
  },

  // Everforest — forest green palette
  everforest: {
    light: {
      bg: '#fdf6e3',
      text: '#5c6a72',
      muted: '#859289',
      border: '#e0dcc7',
      accent: '#8da101',
      accentText: '#fdf6e3',
    },
    dark: {
      bg: '#2d353b',
      text: '#d3c6aa',
      muted: '#859289',
      border: '#3d484d',
      accent: '#a7c080',
      accentText: '#2d353b',
    },
  },

  // Solarized — classic solarized palette
  solarized: {
    light: {
      bg: '#fdf6e3',
      text: '#657b83',
      muted: '#93a1a1',
      border: '#eee8d5',
      accent: '#268bd2',
      accentText: '#fdf6e3',
    },
    dark: {
      bg: '#002b36',
      text: '#839496',
      muted: '#586e75',
      border: '#073642',
      accent: '#268bd2',
      accentText: '#002b36',
    },
  },

  // Ayu — minimal warm palette
  ayu: {
    light: {
      bg: '#fafafa',
      text: '#1f2430',
      muted: '#8a9199',
      border: '#e7e8e9',
      accent: '#ff9900',
      accentText: '#fafafa',
    },
    dark: {
      bg: '#0f1419',
      text: '#e6e1cf',
      muted: '#5c6773',
      border: '#1f2430',
      accent: '#ffb454',
      accentText: '#0f1419',
    },
  },

  // Sky — light blue tones
  sky: {
    light: {
      bg: '#f7f6f4',
      text: '#2f3437',
      muted: '#72706c',
      border: '#dbdbda',
      accent: '#2eaadc',
      accentText: '#f7f6f4',
    },
    dark: {
      bg: '#232729',
      text: '#f7f6f4',
      muted: '#72706c',
      border: '#373c3f',
      accent: '#2eaadc',
      accentText: '#232729',
    },
  },

  // macOS — clean Apple-inspired palette
  macos: {
    light: {
      bg: '#ffffff',
      text: '#1d1d1f',
      muted: '#a0a0a0',
      border: '#e0e0e0',
      accent: '#007aff',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#1e1e1e',
      text: '#f5f5f7',
      muted: '#a0a0a0',
      border: '#404040',
      accent: '#0a84ff',
      accentText: '#1e1e1e',
    },
  },

  // Atom — Atom editor One Dark inspired
  atom: {
    light: {
      bg: '#fafafa',
      text: '#383a42',
      muted: '#71717a',
      border: '#e1e1e1',
      accent: '#4078f2',
      accentText: '#fafafa',
    },
    dark: {
      bg: '#282c34',
      text: '#abb2bf',
      muted: '#5c6370',
      border: '#3e4452',
      accent: '#61afef',
      accentText: '#282c34',
    },
  },

  // Flexoki — paper-like warm tones
  flexoki: {
    light: {
      bg: '#fffcf0',
      text: '#1c1b1a',
      muted: '#9c9a91',
      border: '#e6e4d9',
      accent: '#24837b',
      accentText: '#fffcf0',
    },
    dark: {
      bg: '#100f0f',
      text: '#cecdc3',
      muted: '#878681',
      border: '#1c1b1a',
      accent: '#3aa99f',
      accentText: '#100f0f',
    },
  },

  // Charcoal — dark monochrome
  charcoal: {
    light: {
      bg: '#f8f8f8',
      text: '#202020',
      muted: '#808080',
      border: '#e0e0e0',
      accent: '#606060',
      accentText: '#f8f8f8',
    },
    dark: {
      bg: '#1a1a1a',
      text: '#f0f0f0',
      muted: '#808080',
      border: '#303030',
      accent: '#c0c0c0',
      accentText: '#1a1a1a',
    },
  },

  // Obsidian — dark purple (Obsidian app inspired)
  obsidian: {
    light: {
      bg: '#f5f5f5',
      text: '#1a1a1a',
      muted: '#737373',
      border: '#d4d4d4',
      accent: '#7c3aed',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#1e1e1e',
      text: '#f5f5f5',
      muted: '#737373',
      border: '#2e2e2e',
      accent: '#9c75ff',
      accentText: '#1e1e1e',
    },
  },

  // Things — Things 3 app inspired
  things: {
    light: {
      bg: '#f5f6f8',
      text: '#24262a',
      muted: '#7d7f84',
      border: '#d8dadd',
      accent: '#1b61c2',
      accentText: '#ffffff',
    },
    dark: {
      bg: '#17191c',
      text: '#f5f6f8',
      muted: '#7d7f84',
      border: '#2e3035',
      accent: '#4d95f7',
      accentText: '#17191c',
    },
  },
};

export type ThemeName = keyof typeof themes;

// Custom theme support: users can create src/themes/custom/index.ts
// exporting a Record<string, ThemeColors> to add their own themes.
const customModules = import.meta.glob('./custom/index.ts', { eager: true });
const customEntry = Object.values(customModules)[0] as { default?: Record<string, ThemeColors> } | undefined;
if (customEntry?.default) {
  Object.assign(themes, customEntry.default);
}

export function getTheme(name: ThemeName): ThemeColors {
  return themes[name] ?? themes['axis'];
}

export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

export function getThemeDisplayName(name: string): string {
  const map: Record<string, string> = {
    'axis': 'Axis',
    'minimal': 'Minimal',
    'oxygen': 'Oxygen',
    'dracula': 'Dracula',
    'nord': 'Nord',
    'catppuccin': 'Catppuccin',
    'rose-pine': 'Rose Pine',
    'gruvbox': 'Gruvbox',
    'everforest': 'Everforest',
    'solarized': 'Solarized',
    'ayu': 'Ayu',
    'sky': 'Sky',
    'macos': 'macOS',
    'atom': 'Atom',
    'flexoki': 'Flexoki',
    'charcoal': 'Charcoal',
    'obsidian': 'Obsidian',
    'things': 'Things',
  };
  return map[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}
