// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGameDetailsDialog } from './game-details';
import type { AppSession } from '../../shared/app-session';

const session: AppSession = {
    displayName: 'Forest Dweller',
    email: 'player+games@example.com',
    authenticatedAt: Date.now(),
};
const guestSession = (): AppSession | undefined =>
    globalThis.sessionStorage.getItem('test-session') ? session : undefined;

const details = {
    slug: 'tiny-glade',
    name: 'Tiny Glade',
    heroImage: '/images/tiny-glade.jpg',
    rating: 4.7,
    likesCount: 1234,
    isLikedByCurrentUser: false,
    fullDescription: 'A relaxing building game.',
    specs: {
        genre: 'Puzzle',
        players: '1',
        duration: 'Short',
        price: 'Free',
    },
    topRecords: [
        {
            position: 1,
            playerName: 'Ada Lovelace',
            score: 1200,
            achievedAt: new Date().toISOString(),
        },
    ],
};

const comment = {
    commentId: 'comment-1',
    authorName: '  Alice Player',
    text: '<img src=x onerror=alert(1)>',
    likesCount: 4,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
};

const response = (data: unknown, status = 200): Response =>
    Response.json(data, { status });

const payloadFor = (
    comments: unknown[] = [comment],
    total = comments.length,
) => ({
    data: comments,
    meta: { totalComments: total },
});

const setup = (
    getActiveSession: () => AppSession | undefined = () => session,
) => {
    const snackbar = { element: document.createElement('div'), show: vi.fn() };
    const onGuestFavorite = vi.fn();
    const dialog = createGameDetailsDialog(
        snackbar,
        getActiveSession,
        onGuestFavorite,
    );
    document.body.append(dialog.element);
    return { dialog, snackbar, onGuestFavorite };
};

const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
};

const mockLoads = (
    comments: unknown[] = [comment],
    total = comments.length,
) => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
        const url = String(input);
        if (url.includes('/comments?')) {
            return response(payloadFor(comments, total));
        }
        if (url.includes('/games/')) {
            return response({ data: details });
        }
        throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

describe('game details dialog', () => {
    it('loads personalized details and comments, rendering safe text and server state', async () => {
        const fetchMock = mockLoads([comment], 9);
        const { dialog } = setup();
        dialog.open('tiny-glade', session);
        await settle();

        expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
            'userEmail=player%2Bgames%40example.com',
        );
        expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
            'limit=3&sort=newest&userEmail=player%2Bgames%40example.com',
        );
        expect(
            dialog.element.querySelector('#game-details-title')?.textContent,
        ).toBe('Tiny Glade');
        expect(
            dialog.element.querySelector('.game-details__likes-count')
                ?.textContent,
        ).toBe('♡ 1,234');
        expect(
            dialog.element.querySelector('#game-details-comments-title')
                ?.textContent,
        ).toBe('Comments (9)');
        const renderedText = dialog.element.querySelector(
            ':scope .game-details__comment-body p',
        );
        expect(renderedText?.textContent).toBe(comment.text);
        expect(renderedText?.querySelector('img')).toBeNull();
        expect(
            dialog.element.querySelector('.game-details__comment-avatar')
                ?.textContent,
        ).toBe('A');
        expect(
            dialog.element
                .querySelector(':scope .game-details__favorite')
                ?.getAttribute('aria-pressed'),
        ).toBe('false');
    });

    it('omits guest identity, locks protected controls and requests sign-in', async () => {
        const fetchMock = mockLoads();
        const { dialog, snackbar, onGuestFavorite } = setup(guestSession);
        dialog.open('tiny-glade');
        await settle();

        expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
            '/games/tiny-glade',
        );
        expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('userEmail');
        expect(String(fetchMock.mock.calls[1]?.[0])).not.toContain('userEmail');
        expect(
            dialog.element.querySelector<HTMLTextAreaElement>(
                '.game-details__comment-input',
            )?.disabled,
        ).toBe(true);

        dialog.element
            .querySelector<HTMLButtonElement>('.game-details__favorite')
            ?.click();
        dialog.element
            .querySelector<HTMLButtonElement>('.game-details__like')
            ?.click();
        expect(onGuestFavorite).toHaveBeenCalledTimes(2);
        expect(snackbar.show).toHaveBeenCalledWith(
            'Sign in to add games to your favorites.',
            'error',
        );
        expect(snackbar.show).toHaveBeenCalledWith(
            'Sign in to like comments.',
            'error',
        );
    });

    it('updates favorite UI only from a successful server response and prevents duplicates', async () => {
        mockLoads([]);
        const fetchMock = vi.mocked(fetch);
        fetchMock.mockImplementationOnce(async () =>
            response({ data: details }),
        );
        fetchMock.mockImplementationOnce(async () =>
            response(payloadFor([], 0)),
        );
        fetchMock.mockImplementationOnce(async () =>
            response({ data: { isFavorited: true, likesCount: 1200 } }),
        );
        const { dialog, snackbar } = setup();
        dialog.open('tiny-glade', session);
        await settle();
        const button = dialog.element.querySelector<HTMLButtonElement>(
            '.game-details__favorite',
        )!;
        button.click();
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        button.click();
        expect(fetchMock).toHaveBeenCalledTimes(3);

        await settle();
        expect(button.disabled).toBe(false);
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(
            dialog.element.querySelector('.game-details__likes-count')
                ?.textContent,
        ).toBe('♡ 1,200');
        expect(snackbar.show).toHaveBeenCalledWith(
            'Game added to favorites.',
            'success',
        );
    });

    it('keeps favorite state unchanged when server rejects a toggle', async () => {
        const fetchMock = mockLoads([]);
        const { dialog, snackbar } = setup();
        fetchMock.mockResolvedValueOnce(response({ data: details }));
        fetchMock.mockResolvedValueOnce(response(payloadFor([], 0)));
        dialog.open('tiny-glade', session);
        await settle();
        fetchMock.mockResolvedValueOnce(response({}, 503));
        const button = dialog.element.querySelector<HTMLButtonElement>(
            '.game-details__favorite',
        )!;
        button.click();
        await settle();
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(button.disabled).toBe(false);
        expect(snackbar.show).toHaveBeenCalledWith(
            expect.stringContaining('Favorite request failed with status 503'),
            'error',
        );
    });

    it('applies personalized like response and leaves state unchanged on failures', async () => {
        const fetchMock = mockLoads([comment]);
        const { dialog, snackbar } = setup();
        dialog.open('tiny-glade', session);
        await settle();
        fetchMock.mockResolvedValueOnce(
            response({
                data: { isLikedByCurrentUser: true, likesCount: 5 },
            }),
        );
        const button = dialog.element.querySelector<HTMLButtonElement>(
            '.game-details__like',
        )!;
        button.click();
        expect(button.disabled).toBe(true);
        await settle();
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(
            button.querySelector('.game-details__comment-likes')?.textContent,
        ).toBe('5');

        fetchMock.mockRejectedValueOnce(new Error('offline'));
        button.click();
        await settle();
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(button.disabled).toBe(false);
        expect(snackbar.show).toHaveBeenCalledWith(
            expect.stringContaining('result may be unknown'),
            'error',
        );
    });

    it('submits trimmed comments, clears after success and reloads the latest list', async () => {
        const fetchMock = mockLoads([comment], 1);
        const { dialog, snackbar } = setup();
        dialog.open('tiny-glade', session);
        await settle();
        fetchMock.mockResolvedValueOnce(
            response(
                {
                    data: {
                        commentId: 'new-comment',
                        authorName: 'Forest Dweller',
                        text: 'Hello game!',
                        likesCount: 0,
                        createdAt: new Date().toISOString(),
                    },
                },
                201,
            ),
        );
        fetchMock.mockResolvedValueOnce(response(payloadFor([comment], 2)));
        const input = dialog.element.querySelector<HTMLTextAreaElement>(
            '.game-details__comment-input',
        )!;
        const send = dialog.element.querySelector<HTMLButtonElement>(
            '.game-details__comment-submit',
        )!;
        expect(input.value).toBe('');
        expect(
            dialog.element.querySelector('.game-details__comment-form-avatar')
                ?.textContent,
        ).toBe('F');
        input.value = '  Hello game!  ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(send.disabled).toBe(false);
        send.click();
        const postCall = fetchMock.mock.calls.at(-1);
        expect(postCall?.[1]?.method).toBe('POST');
        expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
            userEmail: session.email,
            authorName: 'Forest Dweller',
            text: 'Hello game!',
        });
        await settle();
        expect(input.value).toBe('');
        expect(
            dialog.element.querySelector('#game-details-comments-title')
                ?.textContent,
        ).toBe('Comments (2)');
        expect(snackbar.show).toHaveBeenCalledWith(
            'Comment posted.',
            'success',
        );
    });

    it('retains comment text for definitive and ambiguous submission failures', async () => {
        const fetchMock = mockLoads([]);
        const { dialog } = setup();
        dialog.open('tiny-glade', session);
        await settle();
        const input = dialog.element.querySelector<HTMLTextAreaElement>(
            '.game-details__comment-input',
        )!;
        const form = dialog.element.querySelector<HTMLFormElement>(
            '.game-details__comment-form',
        )!;
        input.value = 'Retry me';
        fetchMock.mockResolvedValueOnce(response({}, 422));
        form.requestSubmit();
        await settle();
        expect(input.value).toBe('Retry me');
        expect(input.disabled).toBe(false);
        expect(
            dialog.element.querySelector('.game-details__comment-note')
                ?.textContent,
        ).toContain('Your comment was rejected');

        fetchMock.mockRejectedValueOnce(new Error('timeout'));
        form.requestSubmit();
        await settle();
        expect(input.value).toBe('Retry me');
        expect(
            dialog.element.querySelector('.game-details__comment-note')
                ?.textContent,
        ).toContain('result is unknown');
        expect(
            fetchMock.mock.calls.filter((call) =>
                String(call[0]).endsWith('/comments'),
            ).length,
        ).toBe(2);
    });

    it('shows empty states and retries detail and comment loading failures', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(response(JSON.parse('{"data":null}')))
            .mockResolvedValueOnce(response({ data: details }))
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(response(payloadFor([], 0)));
        vi.stubGlobal('fetch', fetchMock);
        const { dialog, snackbar } = setup();
        dialog.open('missing-game');
        await settle();
        expect(
            dialog.element.querySelector('.game-details__state--empty'),
        ).not.toBeNull();

        dialog.open('tiny-glade');
        await settle();
        expect(
            dialog.element.querySelector('.game-details__comments-error'),
        ).not.toBeNull();
        dialog.element
            .querySelector<HTMLButtonElement>(
                ':scope .game-details__comments-error button',
            )
            ?.click();
        await settle();
        expect(
            dialog.element.querySelector('.game-details__comments-empty')
                ?.textContent,
        ).toBe('No comments yet.');
        expect(snackbar.show).toHaveBeenCalledWith(
            'Unable to load comments. Please try again.',
            'error',
        );
    });

    it('validates empty slugs and closes through handler or immediate cleanup', () => {
        const { dialog } = setup();
        expect(() => dialog.open('')).toThrow('A game slug is required');
        const closeHandler = vi.fn();
        dialog.setCloseHandler(closeHandler);
        dialog.element
            .querySelector<HTMLButtonElement>('.game-details__close')
            ?.click();
        expect(closeHandler).toHaveBeenCalledOnce();
        dialog.closeImmediately();
        expect(dialog.element.open).toBe(false);
        expect(document.body.classList.contains('game-details-open')).toBe(
            false,
        );
    });
});
