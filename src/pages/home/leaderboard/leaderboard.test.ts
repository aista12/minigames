// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../shared/api';
import { createLeaderboard } from './leaderboard';

const players = [
    {
        rank: 1,
        playerName: 'Ada Player',
        gamesPlayed: 42,
        totalScore: 123_456,
        streakDays: 9,
        favoriteGameName: 'Orbit',
    },
];

const response = (data: unknown): Response =>
    ({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data }),
    }) as unknown as Response;

const snackbar = () => ({
    element: document.createElement('div'),
    show: vi.fn(),
});

describe('home leaderboard', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('announces loading, fetches scores, and renders accessible player data', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(response(players));
        vi.stubGlobal('fetch', fetchMock);
        const section = createLeaderboard(snackbar());
        document.body.append(section);

        const content = section.querySelector('.leaderboard__content')!;
        expect(content.getAttribute('aria-live')).toBe('polite');
        expect(content.querySelector('table')?.getAttribute('aria-busy')).toBe(
            'true',
        );
        expect(
            content.querySelectorAll('.leaderboard__skeleton-row'),
        ).toHaveLength(3);
        await vi.waitFor(() => {
            expect(content.querySelector('.leaderboard__row')).not.toBeNull();
        });

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/leaderboard`);
        expect(fetchMock.mock.calls[0]![1]?.signal).toBeInstanceOf(AbortSignal);
        expect(content.querySelector('caption')?.textContent).toBe(
            'Top players leaderboard',
        );
        const row = content.querySelector('.leaderboard__row')!;
        expect(row.querySelector('.leaderboard__rank')?.textContent).toBe('#1');
        expect(content.querySelector('.leaderboard__avatar')?.textContent).toBe(
            'AD',
        );
        expect(
            content.querySelector('.leaderboard__player-name')?.textContent,
        ).toBe('Ada Player');
        expect(row.querySelector('.leaderboard__games')?.textContent).toBe(
            '42',
        );
        expect(
            row.querySelector('.leaderboard__desktop-score')?.textContent,
        ).toBe('123,456');
        expect(row.querySelector('.leaderboard__favorite')?.textContent).toBe(
            'Orbit',
        );
        expect(
            content
                .querySelector('.leaderboard__table')
                ?.hasAttribute('aria-busy'),
        ).toBe(false);
        section.destroy();
    });

    it('shows the empty state for a valid empty response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])));
        const section = createLeaderboard(snackbar());

        await vi.waitFor(() => {
            expect(
                section.querySelector('.leaderboard__state--empty'),
            ).not.toBeNull();
        });
        expect(
            section.querySelector('.leaderboard__state--empty')?.textContent,
        ).toBe('No player scores are available right now.');
        expect(section.querySelector('table')).toBeNull();
        section.destroy();
    });

    it('reports a failed load and retries to show the leaderboard', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response(players));
        vi.stubGlobal('fetch', fetchMock);
        const notify = snackbar();
        const section = createLeaderboard(notify);

        await vi.waitFor(() => {
            expect(section.querySelector('.leaderboard__retry')).not.toBeNull();
        });
        expect(section.querySelector('[role="alert"]')?.textContent).toContain(
            'The leaderboard could not be loaded.',
        );
        expect(notify.show).toHaveBeenCalledWith(
            'Unable to load the leaderboard. Please try again.',
            'error',
        );

        section
            .querySelector<HTMLButtonElement>('.leaderboard__retry')!
            .click();
        await vi.waitFor(() => {
            expect(
                section.querySelector('.leaderboard__player-name')?.textContent,
            ).toBe('Ada Player');
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        section.destroy();
    });

    it('aborts an in-flight request on destroy without changing the loading state', async () => {
        let requestSignal: AbortSignal | undefined;
        const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
            requestSignal = init?.signal as AbortSignal | undefined;
            return new Promise<Response>(() => {});
        });
        vi.stubGlobal('fetch', fetchMock);
        const notify = snackbar();
        const section = createLeaderboard(notify);
        const content = section.querySelector('.leaderboard__content')!;

        section.destroy();
        expect(requestSignal?.aborted).toBe(true);
        await Promise.resolve();
        expect(content.querySelector('table')?.getAttribute('aria-busy')).toBe(
            'true',
        );
        expect(content.querySelector('.leaderboard__player-name')).toBeNull();
        expect(notify.show).not.toHaveBeenCalled();
    });
});
