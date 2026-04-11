'use client';

import { useCallback, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'nirmaan-theme';
const THEME_EVENT = 'nirmaan-theme-change';

function getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'dark';

    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
    const [theme, setThemeState] = useState<ThemeMode>('dark');
    const [mounted, setMounted] = useState(false);

    const applyTheme = useCallback((nextTheme: ThemeMode) => {
        document.documentElement.setAttribute('data-theme', nextTheme);
        window.localStorage.setItem(THEME_KEY, nextTheme);
        window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: nextTheme }));
    }, []);

    const setTheme = useCallback(
        (nextTheme: ThemeMode) => {
            setThemeState(nextTheme);
            if (typeof window !== 'undefined') {
                applyTheme(nextTheme);
            }
        },
        [applyTheme]
    );

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    useEffect(() => {
        const initialTheme = getInitialTheme();
        setThemeState(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);
    }, [applyTheme]);

    useEffect(() => {
        const onThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<ThemeMode>;
            const incomingTheme = customEvent.detail;
            if (incomingTheme === 'light' || incomingTheme === 'dark') {
                setThemeState(incomingTheme);
            }
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key !== THEME_KEY) return;
            const nextTheme = event.newValue;
            if (nextTheme === 'light' || nextTheme === 'dark') {
                setThemeState(nextTheme);
                document.documentElement.setAttribute('data-theme', nextTheme);
            }
        };

        window.addEventListener(THEME_EVENT, onThemeChange as EventListener);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener(THEME_EVENT, onThemeChange as EventListener);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return {
        theme,
        isLight: theme === 'light',
        mounted,
        toggleTheme,
        setTheme,
    };
}
