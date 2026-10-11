import { afterEach, describe, expect, it, vi } from 'vitest';

const firebaseAppModule = vi.hoisted(() => ({
    getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
    getApps: vi.fn(() => [] as Array<{ name: string }>),
    initializeApp: vi.fn((config: unknown) => ({ name: '[DEFAULT]', config })),
}));
const firebaseAuthModule = vi.hoisted(() => ({
    getAuth: vi.fn((app: unknown) => ({ app })),
}));

vi.mock('firebase/app', () => firebaseAppModule);
vi.mock('firebase/auth', () => firebaseAuthModule);

afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
});

const provideConfig = () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'minigames.example');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'minigames-test');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'minigames-test.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id');
};

describe('Firebase initialization boundary', () => {
    it('initializes a default app once and exposes its auth instance', async () => {
        provideConfig();
        const firebase = await import('./firebase');

        expect(firebaseAppModule.getApps).toHaveBeenCalledOnce();
        expect(firebaseAppModule.initializeApp).toHaveBeenCalledWith({
            apiKey: 'test-api-key',
            authDomain: 'minigames.example',
            projectId: 'minigames-test',
            storageBucket: 'minigames-test.appspot.com',
            messagingSenderId: '123456',
            appId: 'test-app-id',
        });
        expect(firebaseAuthModule.getAuth).toHaveBeenCalledWith(
            firebase.firebaseApp,
        );
        expect(firebase.firebaseAuth).toEqual({
            app: firebase.firebaseApp,
        });
    });

    it('reuses an existing default app instead of initializing twice', async () => {
        provideConfig();
        firebaseAppModule.getApps.mockReturnValue([{ name: '[DEFAULT]' }]);
        const firebase = await import('./firebase');

        expect(firebaseAppModule.getApp).toHaveBeenCalledOnce();
        expect(firebaseAppModule.initializeApp).not.toHaveBeenCalled();
        expect(firebase.firebaseApp).toEqual({ name: '[DEFAULT]' });
    });

    it('reports every missing required Firebase setting', async () => {
        vi.stubEnv('VITE_FIREBASE_API_KEY', '');
        vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
        vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
        vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', '');
        vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '');
        vi.stubEnv('VITE_FIREBASE_APP_ID', '');
        await expect(import('./firebase')).rejects.toThrow(
            'Missing Firebase configuration:',
        );
        expect(firebaseAppModule.initializeApp).not.toHaveBeenCalled();
    });
});
