const App = {
    games: [],

    async init() {
        await this.loadGames();
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        // Page specific initializations
        const path = window.location.pathname;
        if (path.includes('home.html')) {
            this.initHome();
        } else if (path.includes('games.html')) {
            this.initLibrary();
        } else if (path.includes('player.html')) {
            this.initPlayer();
        } else if (path.includes('settings.html')) {
            this.initSettings();
        }
    },

    async loadGames() {
        try {
            const response = await fetch('data/games.json');
            this.games = await response.json();
            
            // Adjust paths
            const coverBase = 'covers';
            // Assuming games are hosted or local. For now we use the ID to map if needed.
            // The JSON has {HTML_URL}/id.html
            const htmlBase = 'https://raw.githubusercontent.com/vispora/games/main'; 
            
            this.games = this.games.map(game => ({
                ...game,
                cover: game.cover.replace('{COVER_URL}', coverBase),
                url: game.url.replace('{HTML_URL}', htmlBase)
            }));
            return this.games;
        } catch (e) {
            console.error("Failed to load games:", e);
            return [];
        }
    },

    updateDateTime() {
        const dateTimeEl = document.getElementById('date-time');
        if (dateTimeEl) {
            const now = new Date();
            dateTimeEl.textContent = now.toLocaleString([], { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    },

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card card';
        card.onclick = () => {
            Storage.addToHistory(game);
            window.location.href = `player.html?id=${game.id}`;
        };

        const isFav = Storage.isFavorite(game.id);
        const playtime = Storage.getPlaytime(game.id);
        const formattedPlaytime = Storage.formatPlaytime(playtime);

        card.innerHTML = `
            <img src="${game.cover}" alt="${game.name}" loading="lazy">
            <div class="favorite-btn ${isFav ? 'active' : ''}" data-id="${game.id}" onclick="event.stopPropagation(); App.toggleFavorite(${game.id}, this)">
                <i class="fas fa-star"></i>
            </div>
            ${window.location.pathname.includes('home.html') ? `
            <div class="remove-btn" onclick="event.stopPropagation(); App.removeRecent(${game.id}, this)">
                <i class="fas fa-times"></i>
            </div>` : ''}
            <div class="card-overlay">
                <div class="card-title">${game.name}</div>
                ${formattedPlaytime ? `<div class="card-playtime">${formattedPlaytime}</div>` : ''}
            </div>
        `;

        return card;
    },

    toggleFavorite(gameId, el) {
        const active = Storage.toggleFavorite(gameId);
        el.classList.toggle('active', active);
        
        // Refresh home rows if needed
        if (window.location.pathname.includes('home.html')) {
            this.renderFavorites();
        }
    },

    removeRecent(gameId, el) {
        if (confirm('Remove from recent games?')) {
            Storage.removeFromHistory(gameId);
            el.closest('.game-card').remove();
        }
    },

    // Page Initializers
    initHome() {
        this.renderHero();
        this.renderRecent();
        this.renderPopular();
        this.renderFavorites();
    },

    renderHero() {
        const heroContainer = document.getElementById('hero-banner');
        if (!heroContainer || this.games.length === 0) return;
        
        const randomGame = this.games[Math.floor(Math.random() * this.games.length)];
        heroContainer.innerHTML = `
            <img src="${randomGame.cover}" alt="${randomGame.name}">
            <div class="hero-content">
                <h1>${randomGame.name}</h1>
                <button class="btn btn-primary" onclick="window.location.href='player.html?id=${randomGame.id}'">Play Now</button>
            </div>
        `;
        heroContainer.onclick = () => window.location.href = `player.html?id=${randomGame.id}`;
    },

    renderRecent() {
        const container = document.getElementById('recent-games');
        if (!container) return;
        
        const history = Storage.get(Storage.KEYS.HISTORY);
        container.innerHTML = '';
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-secondary">No recent games. Start playing!</p>';
            return;
        }

        history.forEach(item => {
            const game = this.games.find(g => g.id === item.id) || item;
            container.appendChild(this.createGameCard(game));
        });
    },

    renderPopular() {
        const container = document.getElementById('popular-games');
        if (!container) return;
        
        // For now, just show first 8 games as "popular"
        container.innerHTML = '';
        this.games.slice(0, 8).forEach(game => {
            container.appendChild(this.createGameCard(game));
        });
    },

    renderFavorites() {
        const container = document.getElementById('favorite-games');
        if (!container) return;
        
        const favIds = Storage.get(Storage.KEYS.FAVORITES);
        container.innerHTML = '';
        
        if (favIds.length === 0) {
            container.innerHTML = '<p class="text-secondary">No favorites yet. Star games to add them here!</p>';
            return;
        }

        favIds.forEach(id => {
            const game = this.games.find(g => g.id === id);
            if (game) container.appendChild(this.createGameCard(game));
        });
    },

    initLibrary() {
        this.renderLibrary(this.games);
        
        const searchInput = document.getElementById('search-input');
        const categoryTabs = document.querySelectorAll('.filter-tab');
        
        let currentCategory = 'all';
        
        const updateFilters = () => {
            const query = searchInput.value;
            const filtered = Search.filter(this.games, query, currentCategory);
            this.renderLibrary(filtered);
        };

        searchInput?.addEventListener('input', updateFilters);
        
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentCategory = tab.dataset.category;
                updateFilters();
            });
        });
    },

    renderLibrary(games) {
        const container = document.getElementById('game-grid');
        if (!container) return;
        
        container.innerHTML = '';
        if (games.length === 0) {
            container.innerHTML = '<p class="text-secondary">No games found matches your search.</p>';
            return;
        }

        games.forEach(game => {
            container.appendChild(this.createGameCard(game));
        });
    },

    initPlayer() {
        const params = new URLSearchParams(window.location.search);
        const gameId = parseInt(params.get('id'));
        const game = this.games.find(g => g.id === gameId);
        
        if (!game) {
            window.location.href = 'home.html';
            return;
        }

        document.title = `${game.name} - Vispora`;
        document.getElementById('player-title').textContent = game.name;
        document.getElementById('player-author').textContent = game.author || '';
        
        const iframe = document.getElementById('game-iframe');
        iframe.src = game.url;

        // Playtime tracking
        let startTime = Date.now();
        
        const logTime = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 1000) {
                Storage.updatePlaytime(game.id, elapsed);
            }
            startTime = Date.now();
        };

        window.addEventListener('blur', logTime);
        window.addEventListener('focus', () => startTime = Date.now());
        window.addEventListener('beforeunload', logTime);
        
        // Controls
        document.getElementById('btn-fullscreen').onclick = () => {
            iframe.requestFullscreen?.() || iframe.webkitRequestFullscreen?.() || iframe.msRequestFullscreen?.();
        };
        
        document.getElementById('btn-reload').onclick = () => iframe.src = iframe.src;
        
        const favBtn = document.getElementById('btn-favorite');
        const updateFavBtn = () => {
            favBtn.classList.toggle('active', Storage.isFavorite(game.id));
        };
        updateFavBtn();
        favBtn.onclick = () => {
            Storage.toggleFavorite(game.id);
            updateFavBtn();
        };
    },

    initSettings() {
        // Theme toggle
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = Storage.get(Storage.KEYS.THEME) === 'dark' ? 'Switch to Light' : 'Switch to Dark';
            themeBtn.onclick = () => {
                const next = Theme.toggle();
                themeBtn.textContent = next === 'dark' ? 'Switch to Light' : 'Switch to Dark';
            };
        }

        // Accent color
        const accentInput = document.getElementById('accent-picker');
        if (accentInput) {
            accentInput.value = Storage.get(Storage.KEYS.ACCENT);
            accentInput.oninput = (e) => Theme.applyAccent(e.target.value);
        }

        // Cloak mode
        const cloakSelect = document.getElementById('cloak-mode');
        if (cloakSelect) {
            cloakSelect.value = Storage.get(Storage.KEYS.CLOAK_MODE);
            cloakSelect.onchange = (e) => {
                Storage.set(Storage.KEYS.CLOAK_MODE, e.target.value);
                Cloak.apply();
            };
        }

        const cloakUrlInput = document.getElementById('cloak-url');
        if (cloakUrlInput) {
            cloakUrlInput.value = Storage.get(Storage.KEYS.CLOAK_URL);
            cloakUrlInput.oninput = (e) => {
                Storage.set(Storage.KEYS.CLOAK_URL, e.target.value);
                Cloak.apply();
            };
        }

        // Panic key
        const panicInput = document.getElementById('panic-key');
        if (panicInput) {
            panicInput.value = Storage.get(Storage.KEYS.PANIC_KEY);
            panicInput.onkeydown = (e) => {
                e.preventDefault();
                panicInput.value = e.code;
                Storage.set(Storage.KEYS.PANIC_KEY, e.code);
            };
        }
        
        // Data management
        document.getElementById('export-data').onclick = () => {
            const data = {
                settings: {
                    theme: Storage.get(Storage.KEYS.THEME),
                    accent: Storage.get(Storage.KEYS.ACCENT),
                    cloak_mode: Storage.get(Storage.KEYS.CLOAK_MODE),
                    cloak_url: Storage.get(Storage.KEYS.CLOAK_URL),
                    panic_key: Storage.get(Storage.KEYS.PANIC_KEY)
                },
                favorites: Storage.get(Storage.KEYS.FAVORITES),
                history: Storage.get(Storage.KEYS.HISTORY),
                playtime: Storage.get(Storage.KEYS.PLAYTIME)
            };
            const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vispora_data.json';
            a.click();
        };

        document.getElementById('reset-data').onclick = () => {
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                localStorage.clear();
                window.location.reload();
            }
        };
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
