class InMemoryCache {
    constructor() {
        this.store = new Map();
    }

    set(key, value, ttlMs = 60000) {
        const expiresAt = Date.now() + ttlMs;
        this.store.set(key, { value, expiresAt });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    invalidate(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
}

module.exports = new InMemoryCache();
