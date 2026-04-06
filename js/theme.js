const Theme = {
    init() {
        const theme = Storage.get(Storage.KEYS.THEME);
        const accent = Storage.get(Storage.KEYS.ACCENT);
        this.applyTheme(theme);
        this.applyAccent(accent);
    },

    applyTheme(theme) {
        document.body.classList.remove('dark-theme', 'light-theme');
        document.body.classList.add(`${theme}-theme`);
        Storage.set(Storage.KEYS.THEME, theme);
    },

    applyAccent(color) {
        document.documentElement.style.setProperty('--primary-accent', color);
        Storage.set(Storage.KEYS.ACCENT, color);
    },

    toggle() {
        const current = Storage.get(Storage.KEYS.THEME);
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        return next;
    }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => Theme.init());
