import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, fetchCollection, fetchPaginatedCollection } from './api';

const isString = (value: unknown): value is string => typeof value === 'string';

describe('API collection helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches and validates collection items', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: ['puzzle', 'strategy'] }),
        });
        vi.stubGlobal('fetch', fetchMock);
        const controller = new AbortController();

        await expect(
            fetchCollection('/games?category=all', isString, controller.signal),
        ).resolves.toEqual(['puzzle', 'strategy']);
        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/games?category=all`,
            { signal: controller.signal },
        );
    });

    it('rejects non-success responses with the status code', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 503 }),
        );

        await expect(
            fetchCollection('/games', isString, new AbortController().signal),
        ).rejects.toThrow('Request failed with status 503');
    });

    it('rejects collection data that fails the supplied validator', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ data: ['valid', 12] }),
            }),
        );

        await expect(
            fetchCollection('/games', isString, new AbortController().signal),
        ).rejects.toThrow('The server returned an invalid response.');
    });

    it('returns items and validated pagination metadata', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: ['first', 'second'],
                    meta: { page: 2, totalPages: 4 },
                }),
            }),
        );

        await expect(
            fetchPaginatedCollection(
                '/games?page=2',
                isString,
                new AbortController().signal,
            ),
        ).resolves.toEqual({
            items: ['first', 'second'],
            page: 2,
            totalPages: 4,
        });
    });

    it('rejects invalid pagination metadata', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    data: [],
                    meta: { page: 0, totalPages: 1 },
                }),
            }),
        );

        await expect(
            fetchPaginatedCollection(
                '/games?page=0',
                isString,
                new AbortController().signal,
            ),
        ).rejects.toThrow('The server returned an invalid paginated response.');
    });
});
