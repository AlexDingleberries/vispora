const THEME_PRESETS = [
  {
    id: 'void',
    label: 'Void',
    dark: true,
    accent: '#ffffff',
    preview: { bg: '#0d0d0d', surface: '#1c1c1c', accent: '#ffffff', text: '#f0f0f0' },
  },
  {
    id: 'paper',
    label: 'Paper',
    dark: false,
    accent: '#000000',
    preview: { bg: '#ffffff', surface: '#f7f7f7', accent: '#000000', text: '#111111' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    dark: true,
    accent: '#3859ff',
    preview: { bg: '#040912', surface: '#121d34', accent: '#2347fb', text: '#ddeeff' },
  },
  {
    id: 'nordic',
    label: 'Nordic',
    dark: false,
    accent: '#1d4ed8',
    preview: { bg: '#f0f4f8', surface: '#f8fafc', accent: '#1d4ed8', text: '#0a1929' },
  },
  {
    id: 'forest',
    label: 'Forest',
    dark: true,
    accent: '#4ade80',
    preview: { bg: '#060e08', surface: '#132419', accent: '#4ade80', text: '#e2f5e8' },
  },
  {
    id: 'mint',
    label: 'Mint',
    dark: false,
    accent: '#059669',
    preview: { bg: '#ecf7f2', surface: '#f4fbf8', accent: '#059669', text: '#0a2b1e' },
  },
  {
    id: 'crimson',
    label: 'Crimson',
    dark: true,
    accent: '#f87171',
    preview: { bg: '#0d0506', surface: '#231415', accent: '#f87171', text: '#f8e8e8' },
  },
  {
    id: 'rose',
    label: 'Rose',
    dark: false,
    accent: '#e11d48',
    preview: { bg: '#fdf1f4', surface: '#fff7f9', accent: '#e11d48', text: '#2d0a18' },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    dark: true,
    accent: '#c084fc',
    preview: { bg: '#07050f', surface: '#191333', accent: '#c084fc', text: '#ede8ff' },
  },
  {
    id: 'pearl',
    label: 'Pearl',
    dark: false,
    accent: '#7c3aed',
    preview: { bg: '#f0f0f0', surface: '#ffffff', accent: '#7c3aed', text: '#111111' },
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    dark: true,
    accent: '#06b6d4',
    preview: { bg: '#080c10', surface: '#1a2128', accent: '#06b6d4', text: '#e0f2f8' },
  },
  {
    id: 'sky',
    label: 'Sky',
    dark: false,
    accent: '#0284c7',
    preview: { bg: '#eef6fd', surface: '#f4faff', accent: '#0284c7', text: '#082030' },
  },
  {
    id: 'ember',
    label: 'Ember',
    dark: true,
    accent: '#fb923c',
    preview: { bg: '#0d0900', surface: '#271a00', accent: '#fb923c', text: '#fff0e0' },
  },
  {
    id: 'latte',
    label: 'Latte',
    dark: false,
    accent: '#b45309',
    preview: { bg: '#f5efe5', surface: '#fdf8f0', accent: '#b45309', text: '#2d1e08' },
  },
];
const ACCENT_PRESETS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#00e5ff', label: 'Cyan' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#84cc16', label: 'Lime' },
];
const FONT_PRESETS = [
  { id: 'outfit', label: 'Outfit', preview: 'Aa', stack: `'Outfit', system-ui, -apple-system, sans-serif` },
  { id: 'inter', label: 'Inter', preview: 'Aa', stack: `'Inter', system-ui, -apple-system, sans-serif` },
  { id: 'space-grotesk', label: 'Space Grotesk', preview: 'Aa', stack: `'Space Grotesk', system-ui, -apple-system, sans-serif` },
  { id: 'merriweather', label: 'Merriweather', preview: 'Aa', stack: `'Merriweather', Georgia, serif` },
  { id: 'jetbrains', label: 'JetBrains Mono', preview: 'Aa', stack: `'JetBrains Mono', 'Courier New', monospace` },
  { id: 'comfortaa', label: 'Comfortaa', preview: 'Aa', stack: `'Comfortaa', system-ui, -apple-system, sans-serif` },
];
function getFontById(id) { return FONT_PRESETS.find(f => f.id === id) || FONT_PRESETS[0]; }
function applyFontFamily(fontId) {
  const preset = getFontById(fontId);
  document.documentElement.style.setProperty('--font', preset.stack);
}
function hexToRgb(hex) {
  hex = (hex || '#888888').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) hex = '888888';
  const n = parseInt(hex, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
function hexToHsl(hex) {
  hex = (hex || '#888888').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) hex = '888888';
  const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
const THEME_VAR_NAMES = [
  '--accent', '--accent-rgb', '--accent-dim', '--accent-glow',
  '--bg', '--bg2', '--bg3', '--bg4', '--bg5',
  '--card-bg', '--card-border', '--card-border-hover',
  '--text', '--text-secondary', '--text-dim', '--text-inv',
];
function clearCustomVars() {
  THEME_VAR_NAMES.forEach(v => document.documentElement.style.removeProperty(v));
}
function applyCustomThemeVars(vars) {
  vars = vars || {};
  const map = {
    accent: '--accent', bg: '--bg', bg2: '--bg2', bg3: '--bg3', bg4: '--bg4', bg5: '--bg5',
    cardBg: '--card-bg', text: '--text', textSecondary: '--text-secondary',
    textDim: '--text-dim', textInv: '--text-inv',
  };
  const root = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => { if (map[k] && v) root.setProperty(map[k], v); });
  const accentHex = vars.accent;
  if (accentHex) {
    const rgb = hexToRgb(accentHex);
    root.setProperty('--accent-rgb', rgb);
    root.setProperty('--accent-dim', `rgba(${rgb},0.08)`);
    root.setProperty('--accent-glow', `0 0 18px rgba(${rgb},0.22)`);
    root.setProperty('--card-border', `rgba(${rgb},0.09)`);
    root.setProperty('--card-border-hover', `rgba(${rgb},0.24)`);
  }
}
function generateThemeFromColor(hex, isDark) {
  const [h, s] = hexToHsl(hex);
  const sat = Math.min(s, 55);
  if (isDark) {
    return {
      accent: hex,
      bg: hslToHex(h, Math.min(sat, 25), 5), bg2: hslToHex(h, Math.min(sat, 25), 7),
      bg3: hslToHex(h, Math.min(sat, 20), 9), bg4: hslToHex(h, Math.min(sat, 20), 12),
      bg5: hslToHex(h, Math.min(sat, 18), 16), cardBg: hslToHex(h, Math.min(sat, 20), 8),
      text: hslToHex(h, Math.min(sat, 12), 94), textSecondary: hslToHex(h, Math.min(sat, 10), 58),
      textDim: hslToHex(h, Math.min(sat, 12), 24), textInv: hslToHex(h, Math.min(sat, 20), 6),
    };
  }
  return {
    accent: hex,
    bg: hslToHex(h, Math.min(sat, 18), 94), bg2: hslToHex(h, Math.min(sat, 18), 91),
    bg3: hslToHex(h, Math.min(sat, 8), 100), bg4: hslToHex(h, Math.min(sat, 12), 96),
    bg5: hslToHex(h, Math.min(sat, 12), 93), cardBg: hslToHex(h, Math.min(sat, 8), 100),
    text: hslToHex(h, Math.min(sat, 18), 10), textSecondary: hslToHex(h, Math.min(sat, 12), 42),
    textDim: hslToHex(h, Math.min(sat, 12), 82), textInv: hslToHex(h, Math.min(sat, 8), 100),
  };
}
function getThemeById(id) {
  return THEME_PRESETS.find(t => t.id === id) || THEME_PRESETS[0];
}
function normaliseThemeId(id) {
  if (id === 'dark') return 'void';
  if (id === 'light') return 'pearl';
  if (id === 'sand') return 'latte';
  if (typeof id === 'string' && id.startsWith('custom:')) return id;
  if (THEME_PRESETS.find(t => t.id === id)) return id;
  return 'void';
}
function getCustomTheme(id) {
  try {
    const list = (window.VStorage && VStorage.getCustomThemes) ? VStorage.getCustomThemes() : [];
    return (Array.isArray(list) ? list : []).find(t => t && t.id === id) || null;
  } catch { return null; }
}
function applyTheme(themeId) {
  themeId = normaliseThemeId(themeId);
  if (typeof themeId === 'string' && themeId.startsWith('custom:')) return;
  document.documentElement.setAttribute('data-theme', themeId);
}
function applyCustomTheme(id) {
  const custom = getCustomTheme(id);
  if (!custom || !custom.vars) return false;
  document.documentElement.setAttribute('data-theme', custom.dark ? 'void' : 'pearl');
  clearCustomVars();
  applyCustomThemeVars(custom.vars);
  if (custom.vars.accent && window.VStorage && VStorage.setAccent) {
    try { VStorage.setAccent(custom.vars.accent); } catch { }
  }
  return true;
}
function applyAccent(hex) {
  if (!hex) return;
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(hex));
  const rgb = hexToRgb(hex);
  document.documentElement.style.setProperty('--accent-glow', `0 0 20px rgba(${rgb}, 0.4)`);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${rgb}, 0.15)`);
}
function applyFontSize(size) {
  document.documentElement.setAttribute('data-fontsize', size || 'medium');
}
function initTheme() {
  const rawId = VStorage.getTheme();
  const id = normaliseThemeId(rawId);
  if (!id.startsWith('custom:') || !applyCustomTheme(id)) {
    const preset = getThemeById(id);
    clearCustomVars();
    applyTheme(id);
    const storedAccent = VStorage.getAccent();
    const accent = (storedAccent && storedAccent !== '#ffffff') || id === 'void'
      ? storedAccent
      : preset.accent;
    applyAccent(accent || preset.accent);
  }
  applyFontSize(VStorage.getFontSize());
  applyFontFamily(VStorage.getFontFamily());
}
function switchTheme(id) {
  if (typeof id === 'string' && id.startsWith('custom:') && applyCustomTheme(id)) {
    VStorage.setTheme(id);
    return getCustomTheme(id);
  }
  id = normaliseThemeId(id);
  const preset = getThemeById(id);
  VStorage.setTheme(id);
  VStorage.setAccent(preset.accent);
  clearCustomVars();
  applyTheme(id);
  applyAccent(preset.accent);
  return preset;
}
function toggleTheme() {
  const current = normaliseThemeId(VStorage.getTheme());
  const currentPreset = getThemeById(current);
  const next = (current.startsWith('custom:') ? false : currentPreset.dark) ? 'pearl' : 'void';
  return switchTheme(next);
}
window.VTheme = {
  THEME_PRESETS,
  ACCENT_PRESETS,
  FONT_PRESETS,
  hexToRgb,
  getThemeById,
  getFontById,
  normaliseThemeId,
  applyTheme,
  applyAccent,
  applyFontSize,
  applyFontFamily,
  initTheme,
  switchTheme,
  toggleTheme,
  _safeInitTheme,
  generateThemeFromColor,
};
function _safeInitTheme() {
  try {
    initTheme();
  } catch (e) {
    console.warn('[VTheme] init failed, falling back to a safe default:', e);
    try {
      clearCustomVars();
      document.documentElement.setAttribute('data-theme', 'void');
      applyFontSize('medium');
    } catch { }
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _safeInitTheme);
} else {
  _safeInitTheme();
}