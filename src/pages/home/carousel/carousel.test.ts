// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../shared/api';
import { createCarousel } from './carousel';

const games = [
    {
        slug: 'orbit',
        name: 'Orbit',
        rating: 4.6,
        likesCount: 1250,
        cardImage: '/orbit.jpg',
    },
    {
        slug: 'garden',
        name: 'Garden',
        rating: 4.2,
        likesCount: 420,
        cardImage: '/garden.jpg',
    },
    {
        slug: 'tiles',
        name: 'Tiles',
        rating: 4.9,
        likesCount: 9870,
        cardImage: '/tiles.jpg',
    },
    {
        slug: 'racer',
        name: 'Racer',
        rating: 4.1,
        likesCount: 85,
        cardImage: '/racer.jpg',
    },
    {
        slug: 'maze',
        name: 'Maze',
        rating: 4.4,
        likesCount: 760,
        cardImage: '/maze.jpg',
    },
];

const response = (data: unknown): Response =>
    ({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data }),
    }) as unknown as Response;

const flushPromises = async () => {
    for (let index = 0; index < 5; index += 1) {
        await Promise.resolve();
    }
};

const snackbar = () => ({
    element: document.createElement('div'),
    show: vi.fn(),
});

describe('home carousel', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('loads accessible game cards and supports controls, keyboard navigation, and details activation', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(response(games));
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('innerWidth', 900);
        const openDetails = vi.fn();
        const section = createCarousel(openDetails, snackbar());
        document.body.append(section);

        const track = section.querySelector('.carousel-section__track')!;
        expect(track.getAttribute('aria-busy')).toBe('true');
        expect(track.querySelectorAll('.carousel-skeleton')).toHaveLength(3);
        await flushPromises();

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0][0]).toBe(
            `${API_BASE_URL}/games?featured=true`,
        );
        expect(fetchMock.mock.calls[0]![1]?.signal).toBeInstanceOf(AbortSignal);
        const cards = [
            ...track.querySelectorAll<HTMLElement>('.carousel-card'),
        ];
        const orbitCard = cards.find((card) =>
            card
                .getAttribute('aria-label')
                ?.startsWith('View details for Orbit'),
        )!;
        expect(cards).toHaveLength(games.length);
        expect(track.hasAttribute('aria-busy')).toBe(false);
        expect(track.getAttribute('aria-roledescription')).toBe('carousel');
        expect(orbitCard.getAttribute('aria-label')).toBe(
            'View details for Orbit, rated 4.6, 1.3K likes',
        );
        expect(orbitCard.getAttribute('aria-hidden')).toBe('false');
        const racerCard = cards.find((card) =>
            card
                .getAttribute('aria-label')
                ?.startsWith('View details for Racer'),
        )!;
        expect(racerCard.getAttribute('aria-hidden')).toBe('true');
        expect(racerCard.tabIndex).toBe(-1);
        expect(orbitCard.querySelector('img')?.src).toBe(
            new URL('/orbit.jpg', API_BASE_URL).href,
        );

        section
            .querySelector<HTMLButtonElement>('[aria-label="Next games"]')!
            .click();
        expect(
            track
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Garden');
        section.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
        );
        expect(
            track
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Orbit');

        orbitCard.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        );
        orbitCard.dispatchEvent(
            new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
        );
        orbitCard.click();
        expect(openDetails.mock.calls).toEqual([
            ['orbit'],
            ['orbit'],
            ['orbit'],
        ]);
        section.destroy();
    });

    it('shows an error, retries successfully, and renders the empty state', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response(games.slice(0, 2)))
            .mockResolvedValueOnce(response([]));
        vi.stubGlobal('fetch', fetchMock);
        const notify = snackbar();
        const section = createCarousel(vi.fn(), notify);

        await vi.waitFor(() => {
            expect(
                section.querySelector('.carousel-state__retry'),
            ).not.toBeNull();
        });
        expect(section.querySelector('[role="alert"]')?.textContent).toContain(
            'Featured games could not be loaded.',
        );
        expect(notify.show).toHaveBeenCalledWith(
            'Unable to load featured games. Please try again.',
            'error',
        );

        section
            .querySelector<HTMLButtonElement>('.carousel-state__retry')!
            .click();
        await vi.waitFor(() => {
            expect(section.querySelectorAll('.carousel-card')).toHaveLength(2);
        });
        expect(
            section.querySelector<HTMLButtonElement>(
                '[aria-label="Next games"]',
            )?.disabled,
        ).toBe(false);

        section
            .querySelector<HTMLButtonElement>(
                '.carousel-section__control--next',
            )!
            .click();
        expect(
            section
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Garden');
        section
            .querySelector<HTMLButtonElement>('[aria-label="Previous games"]')!
            .click();
        expect(
            section
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Orbit');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        section.destroy();
    });

    it('renders an empty-state message and disables navigation when no games are returned', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])));
        const section = createCarousel(vi.fn(), snackbar());

        await vi.waitFor(() => {
            expect(
                section.querySelector('.carousel-state--empty'),
            ).not.toBeNull();
        });
        expect(
            section.querySelector('.carousel-state--empty')?.textContent,
        ).toContain('No featured games are available');
        expect(section.querySelectorAll('.carousel-card')).toHaveLength(0);
        section
            .querySelector<HTMLButtonElement>('[aria-label="Next games"]')!
            .click();
        expect(section.querySelector('.carousel-state--empty')).not.toBeNull();
        section.destroy();
    });

    it('autoplays after four seconds and aborts/clears resources on destroy', async () => {
        vi.useFakeTimers();
        let requestSignal: AbortSignal | undefined;
        const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
            requestSignal = init?.signal as AbortSignal | undefined;
            return response(games.slice(0, 2));
        });
        vi.stubGlobal('fetch', fetchMock);
        const section = createCarousel(vi.fn(), snackbar());
        await flushPromises();

        expect(
            section
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Orbit');
        expect(vi.getTimerCount()).toBe(1);
        await vi.advanceTimersByTimeAsync(4000);
        expect(
            section
                .querySelector('.carousel-card--center')
                ?.getAttribute('aria-label'),
        ).toContain('Garden');
        expect(vi.getTimerCount()).toBe(1);

        section.destroy();
        expect(requestSignal?.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });
});
