// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLibraryGamesSection } from './games-section';

const categories = [
    { slug: 'all', label: 'All Games', isDefault: true },
    { slug: 'puzzle', label: 'Puzzle', isDefault: false },
    { slug: 'card', label: 'Card', isDefault: false },
];

const response = (data: unknown) => ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ data }),
});

describe('library games section', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('shows category loading state and renders validated categories on success', async () => {
        const fetchMock = vi.fn().mockResolvedValue(response(categories));
        vi.stubGlobal('fetch', fetchMock);
        const snackbar = {
            element: document.createElement('div'),
            show: vi.fn(),
        };
        const section = createLibraryGamesSection(vi.fn(), snackbar);

        section.load();

        const scroller = section.querySelector(
            '.library-games__category-scroller',
        )!;
        expect(scroller.getAttribute('aria-busy')).toBe('true');
        expect(
            scroller.querySelectorAll('.library-games__chip-skeleton'),
        ).toHaveLength(7);

        await vi.waitFor(() => {
            expect(
                section.querySelectorAll('.library-games__chip'),
            ).toHaveLength(3);
        });

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0][0]).toContain('/categories');
        expect(
            section
                .querySelector<HTMLButtonElement>(
                    '.library-games__chip[data-category="all"]',
                )
                ?.getAttribute('aria-pressed'),
        ).toBe('true');
        expect(scroller.hasAttribute('aria-busy')).toBe(false);
        expect(snackbar.show).not.toHaveBeenCalled();
    });

    it('shows an error and retries category loading successfully', async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response(categories));
        vi.stubGlobal('fetch', fetchMock);
        const snackbar = {
            element: document.createElement('div'),
            show: vi.fn(),
        };
        const section = createLibraryGamesSection(vi.fn(), snackbar);
        section.load();

        await vi.waitFor(() => {
            expect(
                section.querySelector('.library-games__category-retry'),
            ).not.toBeNull();
        });

        expect(
            section.querySelector('.library-games__category-state')
                ?.textContent,
        ).toContain('Game categories could not be loaded.');
        expect(snackbar.show).toHaveBeenCalledWith(
            'Unable to load game categories. Please try again.',
            'error',
        );

        section
            .querySelector<HTMLButtonElement>('.library-games__category-retry')!
            .click();

        await vi.waitFor(() => {
            expect(
                section.querySelectorAll('.library-games__chip'),
            ).toHaveLength(3);
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('notifies filter changes from category and sort selections', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(categories)));
        const onFilterChange = vi.fn();
        const section = createLibraryGamesSection(onFilterChange, {
            element: document.createElement('div'),
            show: vi.fn(),
        });
        section.load();

        await vi.waitFor(() => {
            expect(
                section.querySelector(
                    '.library-games__chip[data-category="puzzle"]',
                ),
            ).not.toBeNull();
        });

        section
            .querySelector<HTMLButtonElement>(
                '.library-games__chip[data-category="puzzle"]',
            )!
            .click();
        expect(onFilterChange).toHaveBeenLastCalledWith(
            'puzzle',
            'rating-desc',
        );
        expect(
            section
                .querySelector<HTMLButtonElement>(
                    '.library-games__chip[data-category="puzzle"]',
                )
                ?.getAttribute('aria-pressed'),
        ).toBe('true');

        const sortTrigger = section.querySelector<HTMLButtonElement>(
            '.library-sort__trigger',
        )!;
        sortTrigger.click();
        expect(sortTrigger.getAttribute('aria-expanded')).toBe('true');

        section
            .querySelector<HTMLButtonElement>(
                '.library-sort__option[data-sort="rating-asc"]',
            )!
            .click();

        expect(onFilterChange).toHaveBeenLastCalledWith('puzzle', 'rating-asc');
        expect(section.querySelector('.library-sort__value')?.textContent).toBe(
            'Lowest Rated',
        );
        expect(sortTrigger.getAttribute('aria-expanded')).toBe('false');
        expect(sortTrigger.getAttribute('aria-label')).toBe(
            'Sort games: Lowest Rated',
        );
    });
});
