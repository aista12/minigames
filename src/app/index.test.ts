// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

const controls = vi.hoisted(() => ({
    route: undefined as undefined | ((page: string) => void),
    authChange: undefined as
        ((mode: 'login' | 'signup' | undefined) => void) | undefined,
    authenticated: undefined as
        | ((profile: {
              displayName: string;
              email: string;
              avatarUrl?: string;
          }) => Promise<void>)
        | undefined,
    logout: undefined as (() => void) | undefined,
    protectedAction: undefined as (() => void) | undefined,
    filterChange: undefined as
        ((category: string, sort: string) => void) | undefined,
    pageChange: undefined as ((page: number) => void) | undefined,
    openGame: undefined as ((slug: string) => void) | undefined,
    closeGame: undefined as (() => void) | undefined,
    expire: undefined as (() => void) | undefined,
    reportSessionError: undefined as ((error: unknown) => void) | undefined,
    validSession: undefined as
        | (() =>
              | { displayName: string; email: string; authenticatedAt: number }
              | undefined)
        | undefined,
    activeProfile: undefined as
        | { displayName: string; email: string; authenticatedAt: number }
        | undefined,
    authMode: undefined as string | undefined,
    lastOpenedGame: undefined as string | undefined,
    snackbarShow: vi.fn(),
    sessionEstablish: vi.fn(),
    sessionLogout: vi.fn(),
    detailsOpen: vi.fn(),
    detailsClose: vi.fn(),
    detailsCloseImmediately: vi.fn(),
    libraryLoad: vi.fn(),
    librarySetState: vi.fn(),
    cardsLoad: vi.fn(),
    paginationUpdate: vi.fn(),
}));

vi.mock('../shared/styles/globals.scss', () => ({}));
vi.mock('../shared/snackbar', () => ({
    createSnackbar: () => ({
        element: document.createElement('div'),
        show: controls.snackbarShow,
    }),
}));
vi.mock('../shared/app-session', () => ({
    createAppSession: (
        onExpired: () => void,
        onError: (error: unknown) => void,
    ) => {
        controls.expire = onExpired;
        controls.reportSessionError = onError;
        return {
            restore: async () => {},
            establish: (profile: {
                displayName: string;
                email: string;
                authenticatedAt?: number;
            }) => {
                controls.sessionEstablish(profile);
                controls.activeProfile = {
                    ...profile,
                    authenticatedAt: profile.authenticatedAt ?? Date.now(),
                };
                return controls.activeProfile;
            },
            getValidSession: () => controls.activeProfile,
            logout: async () => {
                controls.sessionLogout();
                controls.activeProfile = undefined;
            },
        };
    },
}));
vi.mock('../shared/router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../shared/router')>();
    return actual;
});
vi.mock('../widgets/header/header', () => ({
    createHeader: (
        onNavigate: (page: string) => void,
        onAuthChange: (mode: 'login' | 'signup' | undefined) => void,
        onAuthenticated: (profile: {
            displayName: string;
            email: string;
        }) => Promise<void>,
        _snackbar: unknown,
        _sessionInitialization: unknown,
        onLogout: () => void,
    ) => {
        controls.route = onNavigate;
        controls.authChange = onAuthChange;
        controls.authenticated = onAuthenticated;
        controls.logout = onLogout;
        const header = document.createElement('header') as HTMLElement & {
            setAuthMode: (mode: string | undefined) => void;
            setUserProfile: (profile: unknown) => void;
        };
        header.setAuthMode = (mode) => {
            controls.authMode = mode;
        };
        header.setUserProfile = (profile) => {
            controls.activeProfile = profile as typeof controls.activeProfile;
        };
        return header;
    },
}));
vi.mock('../widgets/game-details/game-details', () => ({
    createGameDetailsDialog: (
        _snackbar: unknown,
        _getSession: unknown,
        onGuestAction: () => void,
    ) => {
        controls.protectedAction = onGuestAction;
        const element = document.createElement('dialog');
        return {
            element,
            open: (slug: string) => {
                controls.lastOpenedGame = slug;
                controls.detailsOpen(slug);
            },
            close: controls.detailsClose,
            closeImmediately: controls.detailsCloseImmediately,
            setCloseHandler: (handler: () => void) => {
                controls.closeGame = handler;
            },
        };
    },
}));
vi.mock('../pages/library/games-section/games-section', () => ({
    createLibraryGamesSection: (
        onFilter: (category: string, sort: string) => void,
    ) => {
        controls.filterChange = onFilter;
        const section = document.createElement('section') as HTMLElement & {
            load: () => void;
            setState: (category: string, sort: string) => void;
            destroy: () => void;
        };
        section.load = controls.libraryLoad;
        section.setState = controls.librarySetState;
        section.destroy = vi.fn();
        return section;
    },
}));
vi.mock('../pages/library/cards/cards', () => ({
    createLibraryCardsSection: (openGame: (slug: string) => void) => {
        controls.openGame = openGame;
        const section = document.createElement('section') as HTMLElement & {
            load: (category: string, sort: string, page: number) => void;
            destroy: () => void;
        };
        section.load = controls.cardsLoad;
        section.destroy = vi.fn();
        return section;
    },
}));
vi.mock('../pages/library/pagination/pagination', () => ({
    createLibraryPagination: () => {
        const element = document.createElement('nav') as HTMLElement & {
            setPageChangeHandler: (handler: (page: number) => void) => void;
            setPage: (page: number) => void;
            update: (page: number, totalPages: number) => void;
        };
        element.setPageChangeHandler = (handler) => {
            controls.pageChange = handler;
        };
        element.setPage = vi.fn();
        element.update = controls.paginationUpdate;
        return element;
    },
}));
vi.mock('../pages/home/carousel/carousel', () => ({
    createCarousel: (openGame: (slug: string) => void) => {
        controls.openGame = openGame;
        const element = document.createElement('section') as HTMLElement & {
            destroy: () => void;
        };
        element.destroy = vi.fn();
        return element;
    },
}));
vi.mock('../pages/home/leaderboard/leaderboard', () => ({
    createLeaderboard: () => {
        const element = document.createElement('section') as HTMLElement & {
            destroy: () => void;
        };
        element.destroy = vi.fn();
        return element;
    },
}));
vi.mock('../pages/home/hero/hero', () => ({
    createHero: () => document.createElement('section'),
}));
vi.mock('../pages/home/developer-cta/developer-cta', () => ({
    createDeveloperCta: () => document.createElement('section'),
}));
vi.mock('../pages/home/footer/footer', () => ({
    createFooter: (onNavigate: (page: string) => void) => {
        const footer = document.createElement('footer');
        footer.addEventListener('click', () => onNavigate('home'));
        return footer;
    },
}));
vi.mock('../pages/not-found/not-found', () => ({
    createNotFoundPage: () => document.createElement('section'),
}));

const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
};

afterEach(() => {
    document.body.replaceChildren();
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('SPA application routing and session integration', () => {
    it('restores redirect routes, protects auth, preserves game state and responds to history', async () => {
        const origin = globalThis.location.origin;
        history.replaceState(
            undefined,
            '',
            '/?__spa_redirect=%2F%3Fgame%3Dtiny-glade%23details',
        );
        await import('./index');
        await flush();

        expect(location.pathname).toBe('/');
        expect(location.search).toBe('?game=tiny-glade');
        expect(location.hash).toBe('#details');
        expect(controls.detailsOpen).toHaveBeenCalledWith('tiny-glade');

        controls.protectedAction?.();
        expect(location.search).toBe('?game=tiny-glade&auth=login');
        expect(controls.detailsCloseImmediately).toHaveBeenCalledOnce();
        controls.authChange?.(undefined);
        expect(location.search).toBe('?game=tiny-glade');
        expect(controls.detailsOpen).toHaveBeenCalledTimes(2);

        controls.protectedAction?.();
        expect(location.search).toBe('?game=tiny-glade&auth=login');
        await controls.authenticated?.({
            displayName: 'Forest Dweller',
            email: 'forest@example.com',
        });
        controls.authChange?.('signup');
        expect(location.search).toBe('?game=tiny-glade');
        expect(controls.snackbarShow).toHaveBeenCalledWith(
            'You are already authenticated.',
            'success',
        );

        history.pushState(
            undefined,
            '',
            '/?game=tiny-glade&auth=login&filter=keep#details',
        );
        dispatchEvent(new PopStateEvent('popstate'));
        await flush();
        expect(location.href).toBe(
            `${origin}/?game=tiny-glade&filter=keep#details`,
        );
        expect(controls.authMode).toBeUndefined();

        controls.route?.('library');
        expect(location.pathname).toBe('/library');
        expect(controls.libraryLoad).toHaveBeenCalledOnce();
        controls.filterChange?.('puzzle', 'name-asc');
        expect(location.search).toBe('?category=puzzle&sort=name-asc');
        controls.pageChange?.(2);
        expect(new URLSearchParams(location.search).get('page')).toBe('2');

        controls.logout?.();
        expect(controls.sessionLogout).toHaveBeenCalledOnce();
        controls.expire?.();
        expect(controls.snackbarShow).toHaveBeenCalledWith(
            'Your session expired. You are now in guest mode.',
            'error',
        );
        controls.reportSessionError?.(new Error('storage denied'));

        history.replaceState(undefined, '', '/not-a-page');
        dispatchEvent(new PopStateEvent('popstate'));
        await flush();
        expect(document.querySelector('main')?.children).toHaveLength(1);
    });
});
