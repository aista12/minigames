// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLibraryCardsSection } from './cards';

const game = {
    slug: 'cozy-solitaire',
    name: 'Cozy Solitaire',
    category: 'Card',
    price: 'Free',
    shortDescription: 'A relaxing card game.',
    rating: 4.7,
    likesCount: 1240,
    cardImage: '/images/cozy-solitaire.jpg',
};

const response = (data: unknown[], page = 1, totalPages = 3) => ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
        data,
        meta: { page, totalPages },
    }),
});

const createFixture = () => {
    const openDetails = vi.fn();
    const showSnackbar = vi.fn();
    const onPaginationUpdate = vi.fn();
    const snackbar = {
        element: document.createElement('div'),
        show: showSnackbar,
    };
    const section = createLibraryCardsSection(
        openDetails,
        snackbar,
        onPaginationUpdate,
    );
    document.body.append(section);
    return { section, openDetails, showSnackbar, onPaginationUpdate };
};

describe('library game cards', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('shows loading skeletons, renders returned games, updates pagination, and opens details', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response([game], 2, 5));
        vi.stubGlobal('fetch', fetchMock);
        const { section, openDetails, onPaginationUpdate } = createFixture();

        section.load('puzzle', 'name-asc', 2);

        const list = section.querySelector('.library-cards__grid')!;
        expect(list.getAttribute('aria-busy')).toBe('true');
        expect(list.querySelectorAll('.library-card--skeleton')).toHaveLength(
            6,
        );

        await vi.waitFor(() => {
            expect(
                list.querySelector('.library-card__title')?.textContent,
            ).toBe('Cozy Solitaire');
        });

        expect(fetchMock.mock.calls[0][0]).toContain(
            '/games?category=puzzle&sort=name-asc&page=2&limit=6',
        );
        expect(list.hasAttribute('aria-busy')).toBe(false);
        expect(list.querySelectorAll('.library-cards__item')).toHaveLength(1);
        expect(
            list.querySelector('.library-card__rating')?.textContent,
        ).toContain('4.7');
        expect(onPaginationUpdate).toHaveBeenCalledWith(2, 5);

        list.querySelector<HTMLButtonElement>(
            '.library-card__details',
        )!.click();
        expect(openDetails).toHaveBeenCalledWith('cozy-solitaire');
    });

    it('renders an empty state and keeps pagination to at least one page', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([], 1, 0)));
        const { section, onPaginationUpdate, showSnackbar } = createFixture();

        section.load('farm', 'rating-desc');

        await vi.waitFor(() => {
            expect(
                section.querySelector('.library-cards__state--empty'),
            ).not.toBeNull();
        });

        expect(
            section.querySelector('.library-cards__state--empty')?.textContent,
        ).toContain('Data Not Found');
        expect(onPaginationUpdate).toHaveBeenCalledWith(1, 1);
        expect(showSnackbar).not.toHaveBeenCalled();
    });

    it('shows an error and retries the failed game request', async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response([game]));
        vi.stubGlobal('fetch', fetchMock);
        const { section, showSnackbar } = createFixture();

        section.load('all', 'rating-desc');

        await vi.waitFor(() => {
            expect(
                section.querySelector('.library-cards__retry'),
            ).not.toBeNull();
        });

        expect(
            section.querySelector('.library-cards__state--error')?.textContent,
        ).toContain('Games could not be loaded.');
        expect(showSnackbar).toHaveBeenCalledWith(
            'Unable to load games. Please try again.',
            'error',
        );

        section
            .querySelector<HTMLButtonElement>('.library-cards__retry')!
            .click();

        await vi.waitFor(() => {
            expect(
                section.querySelector('.library-card__title')?.textContent,
            ).toBe('Cozy Solitaire');
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('aborts an earlier request and ignores its late response', async () => {
        const { section } = createFixture();
        const list = section.querySelector('.library-cards__grid')!;
        const fetchMock = vi
            .fn()
            .mockImplementationOnce(async () => {
                await vi.waitFor(() => {
                    expect(
                        list.querySelector('.library-card__title')?.textContent,
                    ).toBe('New Game');
                });
                return response([game]);
            })
            .mockResolvedValueOnce(
                response([{ ...game, slug: 'new-game', name: 'New Game' }]),
            );
        vi.stubGlobal('fetch', fetchMock);

        section.load('all', 'rating-desc');
        const firstSignal = fetchMock.mock.calls[0][1].signal as AbortSignal;
        const firstFetch = fetchMock.mock.results[0].value as Promise<
            ReturnType<typeof response>
        >;
        section.load('puzzle', 'name-asc');

        await vi.waitFor(() => {
            expect(
                section.querySelector('.library-card__title')?.textContent,
            ).toBe('New Game');
        });
        expect(firstSignal.aborted).toBe(true);

        await firstFetch;
        await new Promise((resolve) => globalThis.setTimeout(resolve, 0));

        expect(section.querySelectorAll('.library-card__title')).toHaveLength(
            1,
        );
        expect(section.querySelector('.library-card__title')?.textContent).toBe(
            'New Game',
        );
    });
});
