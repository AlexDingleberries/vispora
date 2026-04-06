// ===== VISPORA THEME MODULE =====

const ACCENT_PRESETS = [
  { hex: '#00e5ff', label: 'Cyan'    },
  { hex: '#7c3aed', label: 'Violet'  },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#f59e0b', label: 'Amber'   },
  { hex: '#ef4444', label: 'Red'     },
  { hex: '#ec4899', label: 'Pink'    },
  { hex: '#6366f1', label: 'Indigo'  },
  { hex: '#14b8a6', label: 'Teal'    },
  { hex: '#f97316', label: 'Orange'  },
  { hex: '#84cc16', label: 'Lime'    },
];

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
  const n = parseInt(hex, 16);
  return `${(n>>16)&255}, ${(n>>8)&255}, ${n&255}`;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'dark');
}

function applyAccent(hex) {
  if (!hex) return;
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(hex));
  // Update glow
  const rgb = hexToRgb(hex);
  document.documentElement.style.setProperty('--accent-glow', `0 0 20px rgba(${rgb}, 0.4)`);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${rgb}, 0.15)`);
}

function applyFontSize(size) {
  document.documentElement.setAttribute('data-fontsize', size || 'medium');
}

function initTheme() {
  applyTheme(VStorage.getTheme());
  applyAccent(VStorage.getAccent());
  applyFontSize(VStorage.getFontSize());
}

function toggleTheme() {
  const current = VStorage.getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  VStorage.setTheme(next);
  applyTheme(next);
  return next;
}

window.VTheme = {
  ACCENT_PRESETS,
  hexToRgb,
  applyTheme,
  applyAccent,
  applyFontSize,
  initTheme,
  toggleTheme,
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
