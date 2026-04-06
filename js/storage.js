const Storage = {
    KEYS: {
        THEME: 'vispora_theme',
        ACCENT: 'vispora_accent',
        CLOAK_MODE: 'vispora_cloak_mode',
        CLOAK_URL: 'vispora_cloak_url',
        AUTO_CLOAK: 'vispora_auto_cloak',
        PANIC_KEY: 'vispora_panic_key',
        FAVORITES: 'vispora_favorites',
        HISTORY: 'vispora_history',
        PLAYTIME: 'vispora_playtime'
    },

    DEFAULTS: {
        THEME: 'dark',
        ACCENT: '#00f2ff',
        CLOAK_MODE: 'none',
        CLOAK_URL: '',
        AUTO_CLOAK: false,
        PANIC_KEY: 'KeyP',
        FAVORITES: [],
        HISTORY: [],
        PLAYTIME: {}
    },

    get(key) {
        const value = localStorage.getItem(key);
        if (value === null) {
            // Find the constant name for the key to get the default
            const constantName = Object.keys(this.KEYS).find(k => this.KEYS[k] === key);
            return this.DEFAULTS[constantName];
        }
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Favorites
    toggleFavorite(gameId) {
        let favorites = this.get(this.KEYS.FAVORITES);
        const index = favorites.indexOf(gameId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(gameId);
        }
        this.set(this.KEYS.FAVORITES, favorites);
        return favorites.includes(gameId);
    },

    isFavorite(gameId) {
        return this.get(this.KEYS.FAVORITES).includes(gameId);
    },

    // History
    addToHistory(game) {
        let history = this.get(this.KEYS.HISTORY);
        // Remove existing entry for the same game
        history = history.filter(item => item.id !== game.id);
        // Add to the beginning
        history.unshift({
            id: game.id,
            name: game.name,
            cover: game.cover,
            lastPlayed: Date.now()
        });
        // Keep only last 20
        if (history.length > 20) history.pop();
        this.set(this.KEYS.HISTORY, history);
    },

    removeFromHistory(gameId) {
        let history = this.get(this.KEYS.HISTORY);
        history = history.filter(item => item.id !== gameId);
        this.set(this.KEYS.HISTORY, history);
    },

    // Playtime
    updatePlaytime(gameId, milliseconds) {
        let playtime = this.get(this.KEYS.PLAYTIME);
        playtime[gameId] = (playtime[gameId] || 0) + milliseconds;
        this.set(this.KEYS.PLAYTIME, playtime);
    },

    getPlaytime(gameId) {
        return this.get(this.KEYS.PLAYTIME)[gameId] || 0;
    },

    formatPlaytime(ms) {
        if (!ms || ms < 60000) return "";
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${remainingMinutes}m`;
    }
};
