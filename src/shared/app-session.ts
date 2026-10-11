import { signOut } from 'firebase/auth';
import { firebaseAuth } from './firebase';

export const APP_SESSION_STORAGE_KEY = 'minigames:aista12:app-session';
export const APP_SESSION_LIFETIME_MS = 5 * 60 * 1000;

export type AppSessionProfile = {
    displayName: string;
    email: string;
    avatarUrl?: string;
};

export type AppSession = AppSessionProfile & {
    authenticatedAt: number;
};

type AppSessionManager = {
    restore: () => Promise<AppSession | undefined>;
    establish: (profile: AppSessionProfile) => AppSession;
    getValidSession: () => AppSession | undefined;
    logout: () => Promise<void>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parseSession = (value: string): AppSession | undefined => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch {
        return undefined;
    }
    if (!isRecord(parsed)) {
        return undefined;
    }

    const allowedKeys = new Set([
        'displayName',
        'email',
        'authenticatedAt',
        'avatarUrl',
    ]);
    if (Object.keys(parsed).some((key) => !allowedKeys.has(key))) {
        return undefined;
    }

    const { displayName, email, authenticatedAt, avatarUrl } = parsed;
    if (typeof displayName !== 'string' || typeof email !== 'string') {
        return undefined;
    }
    if (displayName.trim().length === 0 || email.trim().length === 0) {
        return undefined;
    }
    if (
        typeof authenticatedAt !== 'number' ||
        !Number.isSafeInteger(authenticatedAt) ||
        authenticatedAt <= 0 ||
        authenticatedAt > Date.now() ||
        (avatarUrl !== undefined && typeof avatarUrl !== 'string')
    ) {
        return undefined;
    }

    return {
        displayName,
        email,
        authenticatedAt,
        ...(typeof avatarUrl === 'string' && avatarUrl && { avatarUrl }),
    };
};

export const createAppSession = (
    onExpired: () => void,
    onError: (error: unknown) => void,
): AppSessionManager => {
    let activeSession: AppSession | undefined;
    let expirationTimer: number | undefined;
    let isExpirationReported = false;

    const clearTimer = (): void => {
        if (expirationTimer === undefined) {
            return;
        }

        globalThis.clearTimeout(expirationTimer);
        expirationTimer = undefined;
    };

    const removeStoredSession = (): void => {
        try {
            localStorage.removeItem(APP_SESSION_STORAGE_KEY);
        } catch (error) {
            onError(error);
        }
    };

    const endSession = async (isExpiration: boolean): Promise<void> => {
        const isHadSession = activeSession !== undefined;
        activeSession = undefined;
        clearTimer();
        removeStoredSession();
        if (isExpiration && isHadSession && !isExpirationReported) {
            isExpirationReported = true;
            onExpired();
        }
        try {
            await signOut(firebaseAuth);
        } catch (error) {
            onError(error);
        }
    };

    const checkExpiration = (): AppSession | undefined => {
        if (!activeSession) {
            return undefined;
        }
        if (
            Date.now() - activeSession.authenticatedAt >=
            APP_SESSION_LIFETIME_MS
        ) {
            void endSession(true);
            return undefined;
        }
        return activeSession;
    };

    const scheduleExpiration = (): void => {
        clearTimer();
        const session = activeSession;
        if (!session) {
            return;
        }
        const remaining =
            session.authenticatedAt + APP_SESSION_LIFETIME_MS - Date.now();
        expirationTimer = globalThis.setTimeout(
            () => void checkExpiration(),
            Math.max(remaining, 0),
        );
    };

    const handlePageActive = (): void => {
        checkExpiration();
    };
    globalThis.addEventListener('focus', handlePageActive);
    document.addEventListener('visibilitychange', handlePageActive);

    const manager: AppSessionManager = {
        restore: async () => {
            let storedValue: string | null;
            try {
                storedValue = localStorage.getItem(APP_SESSION_STORAGE_KEY);
            } catch (error) {
                onError(error);
                await endSession(false);
                return;
            }
            if (storedValue === null) {
                await endSession(false);
                return;
            }

            const session = parseSession(storedValue);
            if (!session) {
                await endSession(false);
                return;
            }
            if (
                Date.now() - session.authenticatedAt >=
                APP_SESSION_LIFETIME_MS
            ) {
                activeSession = session;
                await endSession(true);
                return;
            }

            activeSession = session;
            isExpirationReported = false;
            scheduleExpiration();
            return session;
        },
        establish: (profile) => {
            const session: AppSession = {
                displayName: profile.displayName,
                email: profile.email,
                authenticatedAt: Date.now(),
                ...(profile.avatarUrl && { avatarUrl: profile.avatarUrl }),
            };
            const validatedSession = parseSession(JSON.stringify(session));
            if (!validatedSession) {
                throw new Error('Cannot create an invalid app session.');
            }
            localStorage.setItem(
                APP_SESSION_STORAGE_KEY,
                JSON.stringify(validatedSession),
            );
            activeSession = validatedSession;
            isExpirationReported = false;
            scheduleExpiration();
            return validatedSession;
        },
        getValidSession: checkExpiration,
        logout: () => endSession(false),
    };

    return manager;
};
