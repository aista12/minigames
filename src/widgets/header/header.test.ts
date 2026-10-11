// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';
import { createHeader } from './header';
import type { AppSessionProfile } from '../../shared/app-session';

vi.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
}));
vi.mock('../../shared/firebase', () => ({
    firebaseAuth: { currentUser: undefined },
}));

const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
};

const setup = (
    options: {
        onNavigate?: (page: 'home' | 'library' | 'not-found') => void;
        onAuthChange?: (mode: 'login' | 'signup' | undefined) => void;
        onAuthenticated?: (profile: AppSessionProfile) => Promise<void>;
        onLogout?: () => void;
        authReady?: Promise<unknown>;
    } = {},
) => {
    const snackbar = { element: document.createElement('div'), show: vi.fn() };
    const header = createHeader(
        options.onNavigate,
        options.onAuthChange,
        options.onAuthenticated,
        snackbar,
        options.authReady,
        options.onLogout,
    );
    document.body.append(header);
    return { header, snackbar };
};

const openDialog = (
    header: ReturnType<typeof createHeader>,
    mode: 'login' | 'signup' = 'login',
) => {
    header.setAuthMode(mode, true);
    return header.querySelector<HTMLDialogElement>('.auth-dialog')!;
};

const fill = (dialog: HTMLDialogElement, selector: string, value: string) => {
    const input = dialog.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
};

afterEach(() => {
    vi.clearAllMocks();
    document.body.replaceChildren();
});

describe('authenticated header', () => {
    it('validates login fields in real time and disables invalid submissions', () => {
        const { header } = setup({ onAuthenticated: vi.fn() });
        const dialog = openDialog(header);
        const email = fill(dialog, '[data-auth-field="email"]', 'bad-email');
        expect(email.getAttribute('aria-invalid')).toBe('true');
        expect(dialog.querySelector('#auth-email-error')?.textContent).toBe(
            'Enter a valid email address.',
        );
        expect(
            dialog.querySelector<HTMLButtonElement>('.auth-dialog__submit')
                ?.disabled,
        ).toBe(true);

        fill(dialog, '[data-auth-field="email"]', 'person@example.com');
        const password = fill(
            dialog,
            '[data-auth-field="password"]',
            'secret1',
        );
        expect(password.getAttribute('aria-invalid')).toBe('false');
        expect(
            dialog.querySelector<HTMLButtonElement>('.auth-dialog__submit')
                ?.disabled,
        ).toBe(false);
    });

    it('validates registration requirements and rechecks a touched confirmation', () => {
        const { header } = setup({ onAuthenticated: vi.fn() });
        const dialog = openDialog(header, 'signup');
        const username = fill(
            dialog,
            '[data-auth-field="username"]',
            'lowercase',
        );
        expect(username.getAttribute('aria-invalid')).toBe('true');
        expect(
            dialog.querySelector('#auth-username-error')?.textContent,
        ).toContain('Start with an uppercase');
        fill(dialog, '[data-auth-field="username"]', 'Forest9');
        fill(dialog, '[data-auth-field="email"]', 'forest@example.com');
        const password = fill(
            dialog,
            '[data-auth-field="password"]',
            'Strong1!',
        );
        const confirmation = fill(
            dialog,
            '[data-auth-field="confirmPassword"]',
            'Other1!',
        );
        expect(confirmation.getAttribute('aria-invalid')).toBe('true');
        password.value = 'Better2!';
        password.dispatchEvent(new Event('input', { bubbles: true }));
        expect(
            dialog.querySelector('#auth-confirm-password-error')?.textContent,
        ).toBe('Passwords do not match.');
        fill(dialog, '[data-auth-field="confirmPassword"]', 'Better2!');
        expect(
            dialog.querySelector<HTMLButtonElement>('.auth-dialog__submit')
                ?.disabled,
        ).toBe(false);
    });

    it('signs in and passes Firebase profile data to the authenticated callback', async () => {
        const user = {
            email: 'forest@example.com',
            displayName: 'Forest Dweller',
            photoURL: 'https://example.com/avatar.png',
        };
        vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
            user,
        } as unknown as Awaited<ReturnType<typeof signInWithEmailAndPassword>>);
        const authenticated = vi.fn().mockResolvedValue(undefined);
        const { header, snackbar } = setup({ onAuthenticated: authenticated });
        const dialog = openDialog(header);
        fill(dialog, '[data-auth-field="email"]', 'forest@example.com');
        fill(dialog, '[data-auth-field="password"]', 'secret1');
        dialog.querySelector<HTMLFormElement>('form')!.requestSubmit();
        await flush();

        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            'forest@example.com',
            'secret1',
        );
        expect(authenticated).toHaveBeenCalledWith({
            displayName: 'Forest Dweller',
            email: 'forest@example.com',
            avatarUrl: 'https://example.com/avatar.png',
        });
        expect(snackbar.show).toHaveBeenCalledWith('Welcome back!', 'success');
        expect(dialog.getAttribute('aria-busy')).toBe('false');
    });

    it('creates accounts, updates display name, and rolls errors back to the form', async () => {
        const user = {
            email: 'forest@example.com',
            displayName: '',
            photoURL: undefined,
        };
        vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
            user,
        } as unknown as Awaited<
            ReturnType<typeof createUserWithEmailAndPassword>
        >);
        vi.mocked(updateProfile).mockResolvedValue(undefined);
        const authenticated = vi.fn().mockResolvedValue(undefined);
        const { header, snackbar } = setup({ onAuthenticated: authenticated });
        const dialog = openDialog(header, 'signup');
        fill(dialog, '[data-auth-field="username"]', 'Forest9');
        fill(dialog, '[data-auth-field="email"]', 'forest@example.com');
        fill(dialog, '[data-auth-field="password"]', 'Strong1!');
        fill(dialog, '[data-auth-field="confirmPassword"]', 'Strong1!');
        dialog.querySelector<HTMLFormElement>('form')!.requestSubmit();
        await flush();

        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            'forest@example.com',
            'Strong1!',
        );
        expect(updateProfile).toHaveBeenCalledWith(user, {
            displayName: 'Forest9',
        });
        expect(authenticated).toHaveBeenCalledWith({
            displayName: 'Forest9',
            email: 'forest@example.com',
        });
        expect(snackbar.show).toHaveBeenCalledWith(
            'Your account was created.',
            'success',
        );
    });

    it('shows known Firebase failures and unlocks auth inputs for retry', async () => {
        vi.mocked(signInWithEmailAndPassword).mockRejectedValue({
            code: 'auth/too-many-requests',
        });
        const { header, snackbar } = setup({ onAuthenticated: vi.fn() });
        const dialog = openDialog(header);
        fill(dialog, '[data-auth-field="email"]', 'forest@example.com');
        fill(dialog, '[data-auth-field="password"]', 'secret1');
        dialog.querySelector<HTMLFormElement>('form')!.requestSubmit();
        await flush();
        expect(
            dialog.querySelector('.auth-dialog__request-status')?.textContent,
        ).toBe('Too many attempts. Please try again later.');
        expect(
            dialog.querySelector<HTMLInputElement>('[data-auth-field="email"]')
                ?.disabled,
        ).toBe(false);
        expect(snackbar.show).toHaveBeenCalledWith(
            'Too many attempts. Please try again later.',
            'error',
        );
    });

    it('waits for auth readiness and reports initialization failure', async () => {
        const readiness = Promise.reject(new Error('configuration failure'));
        const reportError = vi.fn();
        vi.stubGlobal('reportError', reportError);
        const snackbar = {
            element: document.createElement('div'),
            show: vi.fn(),
        };
        const header = createHeader(
            undefined,
            undefined,
            undefined,
            snackbar,
            readiness,
        );
        document.body.append(header);
        await flush();
        expect(snackbar.show).toHaveBeenCalledWith(
            'Authentication could not be initialized. Reload the app and try again.',
            'error',
        );
        expect(reportError).toHaveBeenCalledOnce();
    });

    it('handles Google sign-in success and translates popup failures', async () => {
        vi.mocked(signInWithPopup).mockResolvedValue({
            user: {
                email: 'google@example.com',
                displayName: undefined,
                photoURL: undefined,
            },
        } as unknown as Awaited<ReturnType<typeof signInWithPopup>>);
        const authenticated = vi.fn().mockResolvedValue(undefined);
        const { header, snackbar } = setup({ onAuthenticated: authenticated });
        let dialog = openDialog(header);
        await flush();
        dialog.querySelector<HTMLButtonElement>('[data-google-auth]')!.click();
        await flush();
        expect(signInWithPopup).toHaveBeenCalledWith(
            expect.anything(),
            expect.any(GoogleAuthProvider),
        );
        expect(authenticated).toHaveBeenCalledWith({
            displayName: 'google',
            email: 'google@example.com',
        });

        header.setAuthMode('login', true);
        dialog = header.querySelector<HTMLDialogElement>('.auth-dialog')!;
        vi.mocked(signInWithPopup).mockRejectedValueOnce({
            code: 'auth/popup-closed-by-user',
        });
        dialog.querySelector<HTMLButtonElement>('[data-google-auth]')!.click();
        await flush();
        expect(
            dialog.querySelector('.auth-dialog__request-status')?.textContent,
        ).toBe('Google sign-in was canceled. You can try again.');
        expect(snackbar.show).toHaveBeenCalledWith(
            'Google sign-in was canceled. You can try again.',
            'error',
        );
    });

    it('updates profile initials/photo, supports logout, mobile menu and navigation', () => {
        const onNavigate = vi.fn();
        const onAuthChange = vi.fn();
        const onLogout = vi.fn();
        const { header } = setup({ onNavigate, onAuthChange, onLogout });

        header.setUserProfile({
            displayName: '  Ada Lovelace ',
            email: 'ada@example.com',
            avatarUrl: 'https://example.com/ada.png',
        });
        expect(
            header.querySelector('.site-header__profile__initials')
                ?.textContent,
        ).toBe('AL');
        expect(
            header.querySelector<HTMLElement>('.site-header__profile-slot')
                ?.hidden,
        ).toBe(false);
        header
            .querySelector<HTMLImageElement>('.site-header__profile__photo')
            ?.dispatchEvent(new Event('error'));
        expect(header.querySelector('.site-header__profile__photo')).toBeNull();
        header
            .querySelector<HTMLButtonElement>('.site-header__logout-button')
            ?.click();
        expect(onLogout).toHaveBeenCalledOnce();

        header
            .querySelector<HTMLButtonElement>('.site-header__menu-button')
            ?.click();
        expect(
            header.querySelector('.mobile-menu')?.getAttribute('aria-hidden'),
        ).toBe('false');
        header
            .querySelector<HTMLAnchorElement>(
                '.mobile-menu__link[data-page="library"]',
            )
            ?.click();
        expect(onNavigate).toHaveBeenCalledWith('library');
        expect(
            header.querySelector('.mobile-menu')?.getAttribute('aria-hidden'),
        ).toBe('true');

        header
            .querySelector<HTMLButtonElement>('.site-header__button--primary')
            ?.click();
        expect(onAuthChange).toHaveBeenCalledWith('signup');
        header.setUserProfile(undefined);
        expect(
            header.querySelector<HTMLElement>('.site-header__guest-actions')
                ?.hidden,
        ).toBe(false);
    });
});
