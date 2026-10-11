import '../shared/styles/globals.scss';
import { createLibraryGamesSection } from '../pages/library/games-section/games-section';
import {
    createLibraryCardsSection,
    type InteractiveLibraryCardsSection,
} from '../pages/library/cards/cards';
import {
    createLibraryPagination,
    type InteractiveLibraryPagination,
} from '../pages/library/pagination/pagination';
import { createCarousel } from '../pages/home/carousel/carousel';
import { createDeveloperCta } from '../pages/home/developer-cta/developer-cta';
import { createFooter } from '../pages/home/footer/footer';
import { createHero } from '../pages/home/hero/hero';
import {
    createLeaderboard,
    type InteractiveLeaderboard,
} from '../pages/home/leaderboard/leaderboard';
import { createGameDetailsDialog } from '../widgets/game-details/game-details';
import { createHeader, type InteractiveHeader } from '../widgets/header/header';
import { createSnackbar } from '../shared/snackbar';
import { createAppSession } from '../shared/app-session';
import { createNotFoundPage } from '../pages/not-found/not-found';
import {
    defaultRoute,
    readRoute,
    routeUrl,
    type AppRoute,
    type SitePage,
} from '../shared/router';

const restoreGithubPagesRoute = (): void => {
    const redirect = new URLSearchParams(globalThis.location.search).get(
        '__spa_redirect',
    );
    if (!redirect) {
        return;
    }

    const destination = new URL(redirect, globalThis.location.origin);
    const basePath = new URL(
        import.meta.env.BASE_URL,
        globalThis.location.origin,
    ).pathname;
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    if (
        destination.origin !== globalThis.location.origin ||
        !destination.pathname.startsWith(normalizedBase)
    ) {
        return;
    }

    globalThis.history.replaceState(
        undefined,
        '',
        `${destination.pathname}${destination.search}${destination.hash}`,
    );
};

restoreGithubPagesRoute();

const app = document.createElement('div');
app.id = 'app';
const main = document.createElement('main');
const snackbar = createSnackbar();
const headerState: { current: InteractiveHeader | undefined } = {
    current: undefined,
};
const appSession = createAppSession(
    () => {
        headerState.current?.setUserProfile(undefined);
        snackbar.show(
            'Your session expired. You are now in guest mode.',
            'error',
        );
    },
    () => {
        snackbar.show(
            'Could not sign out of Firebase. Please reload the app.',
            'error',
        );
    },
);
const sessionInitializationState = { isInitialized: false };
const sessionInitialization = (async () => {
    const session = await appSession.restore();
    sessionInitializationState.isInitialized = true;
    return session;
})();
const protectedAuthState = { shouldRestoreGame: false };
const gameDetailsDialog = createGameDetailsDialog(snackbar, () => {
    if (appSession.getValidSession()) {
        return true;
    }

    protectedAuthState.shouldRestoreGame = routerState.route.game !== undefined;
    navigate({
        ...routerState.route,
        auth: 'login',
        game: protectedAuthState.shouldRestoreGame
            ? routerState.route.game
            : undefined,
    });
    return false;
});
const libraryPagination: InteractiveLibraryPagination =
    createLibraryPagination();
const routerState: {
    route: AppRoute;
    renderedPage: SitePage | undefined;
    activeListKey: string | undefined;
    activeGame: string | undefined;
    activeAuth: AppRoute['auth'];
} = {
    route: readRoute(
        globalThis.location.pathname,
        globalThis.location.search,
        import.meta.env.BASE_URL,
    ),
    renderedPage: undefined,
    activeListKey: undefined,
    activeGame: undefined,
    activeAuth: undefined,
};
protectedAuthState.shouldRestoreGame = Boolean(
    routerState.route.game && routerState.route.auth,
);

const guardAuthenticatedAuthRoute = (next: AppRoute): AppRoute => {
    if (!next.auth || !appSession.getValidSession()) {
        return next;
    }

    const currentUrl = new URL(globalThis.location.href);
    currentUrl.searchParams.delete('auth');
    globalThis.history.replaceState(
        undefined,
        '',
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
    snackbar.show('You are already authenticated.', 'success');
    return readRoute(
        currentUrl.pathname,
        currentUrl.search,
        import.meta.env.BASE_URL,
    );
};

const navigate = (next: AppRoute, isReplace = false): void => {
    if (!sessionInitializationState.isInitialized && next.auth) {
        void sessionInitialization.then(() => navigate(next, isReplace));
        return;
    }

    const guardedRoute = guardAuthenticatedAuthRoute(next);
    if (guardedRoute !== next) {
        applyRoute(guardedRoute);
        return;
    }

    const url = routeUrl(next, import.meta.env.BASE_URL);
    if (isReplace) {
        globalThis.history.replaceState(undefined, '', url);
    } else {
        globalThis.history.pushState(undefined, '', url);
    }
    applyRoute(next);
};

const navigatePage = (page: SitePage): void => {
    const currentRoute = routerState.route;
    if (
        page === currentRoute.page &&
        !currentRoute.game &&
        !currentRoute.auth
    ) {
        return;
    }

    const next = defaultRoute();
    next.page = page;
    navigate(next);
};

const libraryCardsSection: InteractiveLibraryCardsSection =
    createLibraryCardsSection(
        (gameSlug) => {
            navigate({
                ...routerState.route,
                game: gameSlug,
                auth: undefined,
            });
        },
        snackbar,
        (page, totalPages) => {
            libraryPagination.update(page, totalPages);
            if (page === routerState.route.pageNumber) {
                return;
            }
            appSession.getValidSession();
            routerState.route = {
                ...routerState.route,
                pageNumber: page,
            };
            globalThis.history.replaceState(
                undefined,
                '',
                routeUrl(routerState.route, import.meta.env.BASE_URL),
            );
        },
    );
libraryPagination.setPageChangeHandler((page) => {
    navigate({
        ...routerState.route,
        pageNumber: page,
        game: undefined,
        auth: undefined,
    });
});
const libraryGamesSection = createLibraryGamesSection((category, sort) => {
    navigate({
        ...routerState.route,
        category,
        sort,
        pageNumber: 1,
        game: undefined,
        auth: undefined,
    });
}, snackbar);
const homeCarouselState: {
    current: ReturnType<typeof createCarousel> | undefined;
} = { current: undefined };
const homeLeaderboardState: {
    current: InteractiveLeaderboard | undefined;
} = { current: undefined };

gameDetailsDialog.setCloseHandler(() => {
    navigate({ ...routerState.route, game: undefined });
});

const renderPage = (page: SitePage): void => {
    if (page === 'home') {
        libraryGamesSection.destroy();
        libraryCardsSection.destroy();
        routerState.activeListKey = undefined;
        homeCarouselState.current ??= createCarousel((gameSlug) => {
            navigate({
                ...routerState.route,
                game: gameSlug,
                auth: undefined,
            });
        }, snackbar);
        homeLeaderboardState.current ??= createLeaderboard(snackbar);
        main.replaceChildren(
            createHero(),
            homeCarouselState.current,
            homeLeaderboardState.current,
            createDeveloperCta(),
        );
    } else if (page === 'library') {
        libraryGamesSection.load();
        homeCarouselState.current?.destroy();
        homeCarouselState.current = undefined;
        homeLeaderboardState.current?.destroy();
        homeLeaderboardState.current = undefined;
        main.replaceChildren(
            libraryGamesSection,
            libraryCardsSection,
            libraryPagination,
        );
    } else {
        libraryGamesSection.destroy();
        libraryCardsSection.destroy();
        routerState.activeListKey = undefined;
        homeCarouselState.current?.destroy();
        homeCarouselState.current = undefined;
        homeLeaderboardState.current?.destroy();
        homeLeaderboardState.current = undefined;
        main.replaceChildren(createNotFoundPage(() => navigatePage('home')));
    }

    routerState.renderedPage = page;
};

const updateActiveNavigation = (page: SitePage): void => {
    for (const link of app.querySelectorAll<HTMLAnchorElement>(
        '.site-header__link[data-page], .mobile-menu__link[data-page]',
    )) {
        const isActive = link.dataset.page === page;
        link.classList.toggle('site-header__link--active', isActive);
        link.classList.toggle('mobile-menu__link--active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
};

function applyRoute(next: AppRoute): void {
    routerState.route = next;
    if (routerState.renderedPage !== next.page) {
        renderPage(next.page);
    }

    updateActiveNavigation(next.page);

    if (next.page === 'library') {
        libraryGamesSection.setState(next.category, next.sort);
        const listKey = `${next.category}|${next.sort}|${next.pageNumber}`;
        libraryPagination.setPage(next.pageNumber);
        if (routerState.activeListKey !== listKey) {
            routerState.activeListKey = listKey;
            libraryCardsSection.load(next.category, next.sort, next.pageNumber);
        }
    }

    const gameToShow = next.auth ? undefined : next.game;
    if (!gameToShow && routerState.activeGame) {
        if (next.auth) {
            gameDetailsDialog.closeImmediately();
        } else {
            gameDetailsDialog.close();
        }
        routerState.activeGame = undefined;
    }

    if (routerState.activeAuth === next.auth) {
        if (gameToShow && routerState.activeGame !== gameToShow) {
            routerState.activeGame = gameToShow;
            gameDetailsDialog.open(gameToShow);
        }
        if (!next.auth && !next.game) {
            protectedAuthState.shouldRestoreGame = false;
        }
        return;
    }
    routerState.activeAuth = next.auth;
    headerState.current?.setAuthMode(
        next.auth,
        !next.auth && gameToShow !== undefined,
    );
    if (gameToShow && routerState.activeGame !== gameToShow) {
        routerState.activeGame = gameToShow;
        gameDetailsDialog.open(gameToShow);
    }
    if (!next.auth && !next.game) {
        protectedAuthState.shouldRestoreGame = false;
    }
}

const header: InteractiveHeader = createHeader(
    navigatePage,
    (mode) => {
        const game = protectedAuthState.shouldRestoreGame
            ? routerState.route.game
            : undefined;
        if (!mode) {
            protectedAuthState.shouldRestoreGame = false;
        }
        navigate({
            ...routerState.route,
            auth: mode,
            game,
        });
    },
    async (profile) => {
        const game = protectedAuthState.shouldRestoreGame
            ? routerState.route.game
            : undefined;
        protectedAuthState.shouldRestoreGame = false;
        appSession.establish(profile);
        headerState.current?.setUserProfile(profile);
        navigate({
            ...routerState.route,
            auth: undefined,
            game,
        });
    },
    snackbar,
    sessionInitialization,
    () => {
        header.setUserProfile(undefined);
        if (routerState.route.game && !routerState.route.auth) {
            gameDetailsDialog.open(routerState.route.game);
        }
        snackbar.show('You have been logged out.', 'success');
        void appSession.logout();
    },
);
headerState.current = header;

app.append(
    header,
    main,
    createFooter(navigatePage),
    gameDetailsDialog.element,
    snackbar.element,
);
document.body.append(app);

const applyLocationRoute = (): void => {
    const route = readRoute(
        globalThis.location.pathname,
        globalThis.location.search,
        import.meta.env.BASE_URL,
    );
    applyRoute(guardAuthenticatedAuthRoute(route));
};

globalThis.addEventListener('popstate', () => {
    void sessionInitialization.then(applyLocationRoute);
});

void sessionInitialization.then((session) => {
    header.setUserProfile(session);
    applyLocationRoute();
});
