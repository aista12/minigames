import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultRoute, pageHref, readRoute, routeUrl } from './router';

describe('router', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses the default home route when no supported route is requested', () => {
        vi.stubGlobal('location', { origin: 'https://minigames.test' });

        expect(readRoute('/minigames/', '', '/minigames/')).toEqual(
            defaultRoute(),
        );
    });

    it('reads supported library filters, game details, and auth mode', () => {
        vi.stubGlobal('location', { origin: 'https://minigames.test' });

        expect(
            readRoute(
                '/minigames/library',
                '?category=puzzle&sort=name-asc&page=3&game=tiny-glade&auth=register',
                '/minigames/',
            ),
        ).toEqual({
            ...defaultRoute(),
            page: 'library',
            category: 'puzzle',
            sort: 'name-asc',
            pageNumber: 3,
            game: 'tiny-glade',
            auth: 'signup',
        });
    });

    it('ignores invalid filters and malformed game slugs', () => {
        vi.stubGlobal('location', { origin: 'https://minigames.test' });

        expect(
            readRoute(
                '/minigames/library',
                '?category=unknown&sort=random&page=-2&game=Bad%20Slug&auth=other',
                '/minigames/',
            ),
        ).toEqual({
            ...defaultRoute(),
            page: 'library',
        });
    });

    it('serializes library state and normalizes the signup URL parameter', () => {
        vi.stubGlobal('location', { origin: 'https://minigames.test' });
        const route = {
            ...defaultRoute(),
            page: 'library' as const,
            category: 'strategy',
            sort: 'rating-asc',
            pageNumber: 2,
            game: 'forest-keeper',
            auth: 'signup' as const,
        };

        expect(routeUrl(route, '/minigames/')).toBe(
            '/minigames/library?category=strategy&sort=rating-asc&page=2&game=forest-keeper&auth=register',
        );
    });

    it('builds page links under the configured deployment base', () => {
        vi.stubGlobal('location', { origin: 'https://minigames.test' });

        expect(pageHref('library', '/minigames')).toBe('/minigames/library');
        expect(pageHref('home', '/minigames')).toBe('/minigames/');
    });
});
