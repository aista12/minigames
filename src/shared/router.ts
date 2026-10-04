export type SitePage = 'home' | 'library' | 'not-found';
export type AuthMode = 'login' | 'signup';

export type AppRoute = {
    page: SitePage;
    category: string;
    sort: string;
    pageNumber: number;
    game: string | undefined;
    auth: AuthMode | undefined;
};

const categories = new Set([
    'all',
    'puzzle',
    'card',
    'match',
    'farm',
    'strategy',
    'arcade',
]);
const sorts = new Set(['rating-desc', 'rating-asc', 'name-asc', 'name-desc']);

export const defaultRoute = (): AppRoute => ({
    page: 'home',
    category: 'all',
    sort: 'rating-desc',
    pageNumber: 1,
    game: undefined,
    auth: undefined,
});

export const readRoute = (
    pathname: string,
    search: string,
    baseUrl: string,
): AppRoute => {
    const basePath = new URL(baseUrl, globalThis.location.origin).pathname;
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const appPath = pathname.startsWith(normalizedBase)
        ? pathname.slice(normalizedBase.length - 1)
        : pathname;
    const route = defaultRoute();
    if (['/', '/home', '/home/'].includes(appPath)) {
        route.page = 'home';
    } else if (appPath === '/library' || appPath === '/library/') {
        route.page = 'library';
    } else {
        route.page = 'not-found';
        return route;
    }

    const parameters = new URLSearchParams(search);
    const category = parameters.get('category');
    if (category && categories.has(category)) {
        route.category = category;
    }

    const sort = parameters.get('sort');
    if (sort && sorts.has(sort)) {
        route.sort = sort;
    }

    const page = Number(parameters.get('page'));
    if (Number.isSafeInteger(page) && page > 0) {
        route.pageNumber = page;
    }

    const game = parameters.get('game');
    if (game && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game)) {
        route.game = game;
    }

    const auth = parameters.get('auth');
    if (auth === 'login') {
        route.auth = 'login';
    } else if (auth === 'register' || auth === 'signup') {
        route.auth = 'signup';
    }

    return route;
};

export const routeUrl = (route: AppRoute, baseUrl: string): string => {
    const basePath = new URL(baseUrl, globalThis.location.origin).pathname;
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const path =
        route.page === 'library' ? `${normalizedBase}library` : normalizedBase;
    const parameters = new URLSearchParams();

    if (route.page === 'library') {
        if (route.category !== 'all') {
            parameters.set('category', route.category);
        }
        if (route.sort !== 'rating-desc') {
            parameters.set('sort', route.sort);
        }
        if (route.pageNumber > 1) {
            parameters.set('page', String(route.pageNumber));
        }
    }
    if (route.game) {
        parameters.set('game', route.game);
    }
    if (route.auth) {
        parameters.set('auth', route.auth === 'signup' ? 'register' : 'login');
    }

    const query = parameters.toString();
    return `${path}${query ? `?${query}` : ''}`;
};

export const pageHref = (page: SitePage, baseUrl: string): string => {
    const basePath = new URL(baseUrl, globalThis.location.origin).pathname;
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    return page === 'library' ? `${normalizedBase}library` : normalizedBase;
};
