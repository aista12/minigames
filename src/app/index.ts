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
const gameDetailsDialog = createGameDetailsDialog(snackbar);
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

const navigate = (next: AppRoute, isReplace = false): void => {
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
    } else {
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

    if (routerState.activeGame !== next.game) {
        routerState.activeGame = next.game;
        if (next.game) {
            gameDetailsDialog.open(next.game);
        } else {
            gameDetailsDialog.close();
        }
    }

    if (routerState.activeAuth === next.auth) {
        return;
    }
    routerState.activeAuth = next.auth;
    header.setAuthMode(next.auth);
}

const header: InteractiveHeader = createHeader(navigatePage, (mode) => {
    navigate({
        ...routerState.route,
        auth: mode,
        game: undefined,
    });
});

app.append(
    header,
    main,
    createFooter(navigatePage),
    gameDetailsDialog.element,
    snackbar.element,
);
document.body.append(app);

globalThis.addEventListener('popstate', () => {
    applyRoute(
        readRoute(
            globalThis.location.pathname,
            globalThis.location.search,
            import.meta.env.BASE_URL,
        ),
    );
});

applyRoute(routerState.route);
