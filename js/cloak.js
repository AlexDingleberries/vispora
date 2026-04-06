const Cloak = {
    MODES: {
        NONE: 'none',
        GOOGLE: 'google',
        CUSTOM: 'custom'
    },

    PRESETS: {
        google: {
            title: 'Google Drive - Personal-use Cloud Storage',
            favicon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png'
        }
    },

    init() {
        this.apply();
        this.initPanicKey();
    },

    apply() {
        const mode = Storage.get(Storage.KEYS.CLOAK_MODE);
        const customUrl = Storage.get(Storage.KEYS.CLOAK_URL);

        if (mode === this.MODES.NONE) return;

        let title, favicon;
        if (mode === this.MODES.GOOGLE) {
            title = this.PRESETS.google.title;
            favicon = this.PRESETS.google.favicon;
        } else if (mode === this.MODES.CUSTOM && customUrl) {
            title = customUrl;
            favicon = `https://www.google.com/s2/favicons?domain=${customUrl}&sz=32`;
        }

        if (title) document.title = title;
        if (favicon) this.setFavicon(favicon);
    },

    setFavicon(url) {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'shortcut icon';
            document.head.appendChild(link);
        }
        link.href = url;
    },

    initPanicKey() {
        window.addEventListener('keydown', (e) => {
            const panicKey = Storage.get(Storage.KEYS.PANIC_KEY);
            if (e.code === panicKey) {
                this.panic();
            }
        });
    },

    panic() {
        const mode = Storage.get(Storage.KEYS.CLOAK_MODE);
        const customUrl = Storage.get(Storage.KEYS.CLOAK_URL);
        
        if (mode === this.MODES.GOOGLE) {
            window.location.replace('https://drive.google.com');
        } else if (mode === this.MODES.CUSTOM && customUrl) {
            window.location.replace(customUrl.startsWith('http') ? customUrl : `https://${customUrl}`);
        } else {
            window.location.replace('https://google.com');
        }
    }
};

// Initialize cloak on load
document.addEventListener('DOMContentLoaded', () => Cloak.init());
