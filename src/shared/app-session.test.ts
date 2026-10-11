import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signOut } from 'firebase/auth';
import {
    createAppSession,
    APP_SESSION_LIFETIME_MS,
    APP_SESSION_STORAGE_KEY,
} from './app-session';
import { firebaseAuth } from './firebase';

vi.mock('firebase/auth', () => ({
    signOut: vi.fn(),
}));

vi.mock('./firebase', () => ({
    firebaseAuth: { appName: 'test-auth' },
}));

type StorageMock = {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
};

const profile = {
    displayName: 'Ada Lovelace',
    email: 'ada@example.test',
    avatarUrl: 'https://example.test/ada.png',
};

const TEST_NOW = Date.parse('2026-10-12T00:00:00.000Z');

const storedSession = (authenticatedAt: number) =>
    JSON.stringify({ ...profile, authenticatedAt });
const storedSessionWithExtraProperty = JSON.stringify({
    ...profile,
    authenticatedAt: TEST_NOW,
    extra: true,
});

describe('app session', () => {
    let storage: StorageMock;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(TEST_NOW);
        vi.mocked(signOut).mockResolvedValue(undefined);
        storage = {
            getItem: vi.fn().mockReturnValue(undefined),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        };
        vi.stubGlobal('localStorage', storage);
        vi.stubGlobal('addEventListener', vi.fn());
        vi.stubGlobal('document', { addEventListener: vi.fn() });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('establishes an in-memory session and stores its profile and timestamp', () => {
        const manager = createAppSession(vi.fn(), vi.fn());

        const session = manager.establish(profile);

        expect(session).toEqual({
            ...profile,
            authenticatedAt: Date.now(),
        });
        expect(manager.getValidSession()).toEqual(session);
        expect(storage.setItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
            JSON.stringify(session),
        );
        expect(signOut).not.toHaveBeenCalled();
    });

    it('restores a valid stored session and schedules its remaining lifetime', async () => {
        const authenticatedAt = Date.now() - 60_000;
        storage.getItem.mockReturnValue(storedSession(authenticatedAt));
        const manager = createAppSession(vi.fn(), vi.fn());

        await expect(manager.restore()).resolves.toEqual({
            ...profile,
            authenticatedAt,
        });
        expect(manager.getValidSession()).toEqual({
            ...profile,
            authenticatedAt,
        });
        expect(signOut).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(APP_SESSION_LIFETIME_MS - 60_000);
        expect(manager.getValidSession()).toBeUndefined();
        expect(storage.removeItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
        );
    });

    it.each([
        ['malformed JSON', '{'],
        ['an array', '[]'],
        ['an unexpected property', storedSessionWithExtraProperty],
        [
            'an empty display name',
            JSON.stringify({
                ...profile,
                displayName: '  ',
                authenticatedAt: TEST_NOW,
            }),
        ],
        ['a future timestamp', storedSession(TEST_NOW + 1)],
        [
            'a non-string avatar URL',
            JSON.stringify({
                ...profile,
                avatarUrl: 7,
                authenticatedAt: TEST_NOW,
            }),
        ],
    ])(
        'rejects %s during restore and clears the stored value',
        async (_case, value) => {
            storage.getItem.mockReturnValue(value);
            const manager = createAppSession(vi.fn(), vi.fn());

            await expect(manager.restore()).resolves.toBeUndefined();

            expect(manager.getValidSession()).toBeUndefined();
            expect(storage.removeItem).toHaveBeenCalledWith(
                APP_SESSION_STORAGE_KEY,
            );
            expect(signOut).toHaveBeenCalledOnce();
            expect(signOut).toHaveBeenCalledWith(firebaseAuth);
        },
    );

    it('expires a stored session at the lifetime boundary', async () => {
        const onExpired = vi.fn();
        storage.getItem.mockReturnValue(
            storedSession(Date.now() - APP_SESSION_LIFETIME_MS),
        );
        const manager = createAppSession(onExpired, vi.fn());

        await expect(manager.restore()).resolves.toBeUndefined();

        expect(onExpired).toHaveBeenCalledOnce();
        expect(storage.removeItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
        );
        expect(signOut).toHaveBeenCalledOnce();
        expect(manager.getValidSession()).toBeUndefined();
    });

    it('keeps expiration fixed to establishment time rather than extending access', async () => {
        const onExpired = vi.fn();
        const manager = createAppSession(onExpired, vi.fn());
        const session = manager.establish(profile);

        await vi.advanceTimersByTimeAsync(APP_SESSION_LIFETIME_MS - 1);
        expect(manager.getValidSession()).toEqual(session);
        expect(onExpired).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(manager.getValidSession()).toBeUndefined();
        expect(onExpired).toHaveBeenCalledOnce();
        expect(storage.removeItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
        );
        expect(signOut).toHaveBeenCalledOnce();
    });

    it('cleans up the app session and signs out Firebase on logout', async () => {
        const manager = createAppSession(vi.fn(), vi.fn());
        manager.establish(profile);

        await manager.logout();

        expect(manager.getValidSession()).toBeUndefined();
        expect(storage.removeItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
        );
        expect(signOut).toHaveBeenCalledOnce();
        expect(signOut).toHaveBeenCalledWith(firebaseAuth);

        await vi.advanceTimersByTimeAsync(APP_SESSION_LIFETIME_MS);
        expect(signOut).toHaveBeenCalledOnce();
    });

    it('reports storage-read and Firebase sign-out errors without restoring a session', async () => {
        const readError = new Error('storage unavailable');
        const signOutError = new Error('sign out failed');
        const onError = vi.fn();
        storage.getItem.mockImplementation(() => {
            throw readError;
        });
        vi.mocked(signOut).mockRejectedValue(signOutError);
        const manager = createAppSession(vi.fn(), onError);

        await expect(manager.restore()).resolves.toBeUndefined();

        expect(onError).toHaveBeenNthCalledWith(1, readError);
        expect(onError).toHaveBeenNthCalledWith(2, signOutError);
        expect(storage.removeItem).toHaveBeenCalledWith(
            APP_SESSION_STORAGE_KEY,
        );
        expect(signOut).toHaveBeenCalledWith(firebaseAuth);
    });

    it('reports storage cleanup errors but still calls Firebase signOut', async () => {
        const removeError = new Error('storage cleanup failed');
        const onError = vi.fn();
        storage.removeItem.mockImplementation(() => {
            throw removeError;
        });
        const manager = createAppSession(vi.fn(), onError);

        await manager.logout();

        expect(onError).toHaveBeenCalledWith(removeError);
        expect(signOut).toHaveBeenCalledOnce();
        expect(signOut).toHaveBeenCalledWith(firebaseAuth);
    });

    it('rejects invalid profiles before writing them to storage', () => {
        const manager = createAppSession(vi.fn(), vi.fn());

        expect(() =>
            manager.establish({ displayName: '  ', email: 'ada@example.test' }),
        ).toThrow('Cannot create an invalid app session.');
        expect(storage.setItem).not.toHaveBeenCalled();
    });
});
