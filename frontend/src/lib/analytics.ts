export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

interface AnalyticsEvent {
    event: string;
    props?: AnalyticsProps;
    ts: string;
}

const STORAGE_KEY = 'nirmaan:analytics:events';
const SESSION_KEY = 'nirmaan:analytics:session';

function getSessionId() {
    if (typeof window === 'undefined') {
        return 'server';
    }

    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) {
        return existing;
    }

    const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
}

function getApiBaseUrl() {
    const configured = process.env.NEXT_PUBLIC_API_URL || '/api';
    return configured.replace(/\/$/, '');
}

function sendToBackend(event: string, props?: AnalyticsProps) {
    if (typeof window === 'undefined') {
        return;
    }

    const apiBase = getApiBaseUrl();
    if (!apiBase) {
        return;
    }

    const payload = {
        event,
        source: typeof props?.source === 'string' ? props.source : 'unknown',
        props: props || {},
        sessionId: getSessionId(),
        occurredAt: new Date().toISOString(),
    };

    const url = `${apiBase}/analytics/events`;
    const body = JSON.stringify(payload);

    try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
            return;
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
            keepalive: true,
        }).catch(() => {
            // Silent fail to avoid blocking user interactions.
        });
    } catch {
        // Ignore transient analytics network errors.
    }
}

function readEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as AnalyticsEvent[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeEvents(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-300)));
    } catch {
        // Ignore quota/storage failures.
    }
}

export function trackEvent(event: string, props?: AnalyticsProps) {
    if (typeof window === 'undefined') {
        return;
    }

    const payload: AnalyticsEvent = {
        event,
        props,
        ts: new Date().toISOString(),
    };

    const events = readEvents();
    events.push(payload);
    writeEvents(events);
    sendToBackend(event, props);

    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) {
        dataLayer.push({ event, ...props });
    }

    if (process.env.NODE_ENV !== 'production') {
        console.info('[analytics]', payload);
    }
}

export function getTrackedEvents() {
    return readEvents();
}
