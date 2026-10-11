import './header.scss';
import brandLogoUrl from '../../shared/assets/brand-logo.png';
import menuIconUrl from '../../shared/assets/menu.svg';
import { pageHref, type AuthMode, type SitePage } from '../../shared/router';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
} from 'firebase/auth';
import { firebaseAuth } from '../../shared/firebase';
import type { AppSessionProfile } from '../../shared/app-session';
import type { Snackbar } from '../../shared/snackbar';

const homeLink = pageHref('home', import.meta.env.BASE_URL);
const libraryLink = pageHref('library', import.meta.env.BASE_URL);

export type InteractiveHeader = HTMLElement & {
    setAuthMode: (mode: AuthMode | undefined) => void;
};

type AuthField = 'email' | 'username' | 'password' | 'confirmPassword';
const authFields = new Set<string>([
    'email',
    'username',
    'password',
    'confirmPassword',
]);

const isAuthField = (field: string | undefined): field is AuthField =>
    authFields.has(field ?? '');

const getAuthFieldError = (
    field: AuthField,
    value: string,
    password: string,
    isSignUp: boolean,
): string => {
    if (field === 'email') {
        if (!value.trim()) {
            return 'Email is required.';
        }
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
            ? ''
            : 'Enter a valid email address.';
    }

    if (field === 'username') {
        if (!value) {
            return 'Username is required.';
        }
        if (value.length < 2 || value.length > 30) {
            return 'Username must be 2–30 characters long.';
        }
        return /^[A-Z][A-Za-z0-9]+$/.test(value)
            ? ''
            : 'Start with an uppercase English letter; use English letters and digits only.';
    }

    if (field === 'password') {
        if (!value) {
            return 'Password is required.';
        }
        if (value.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        return isSignUp &&
            (!/[A-Z]/.test(value) ||
                !/\d/.test(value) ||
                !/[^A-Za-z0-9]/.test(value))
            ? 'Use an uppercase letter, a number, and a special character.'
            : '';
    }

    if (!value) {
        return 'Please confirm your password.';
    }
    return value === password ? '' : 'Passwords do not match.';
};

const isAuthFieldValid = (
    input: HTMLInputElement,
    shouldShowError: boolean,
): boolean => {
    const field = input.dataset.authField;
    const form = input.closest<HTMLFormElement>('.auth-dialog__content');
    const errorElement = input.parentElement?.querySelector<HTMLElement>(
        '.auth-dialog__error',
    );
    if (!form || !errorElement || !isAuthField(field)) {
        return false;
    }

    const password =
        form.querySelector<HTMLInputElement>('[data-auth-field="password"]')
            ?.value ?? '';
    const error = getAuthFieldError(
        field,
        input.value,
        password,
        form.classList.contains('auth-dialog__content--signup'),
    );
    input.setAttribute(
        'aria-invalid',
        String(shouldShowError && Boolean(error)),
    );
    errorElement.textContent = shouldShowError ? error : '';
    return !error;
};

const updateSubmitState = (form: HTMLFormElement): void => {
    const submitButton = form.querySelector<HTMLButtonElement>(
        '.auth-dialog__submit',
    );
    if (!submitButton) {
        return;
    }
    const inputs = [
        ...form.querySelectorAll<HTMLInputElement>('[data-auth-field]'),
    ];
    submitButton.disabled = inputs.some(
        (input) => !isAuthFieldValid(input, input.dataset.touched === 'true'),
    );
};

const handleAuthFieldChange = (event: Event): void => {
    const input =
        event.target instanceof HTMLInputElement ? event.target : undefined;
    if (!input?.dataset.authField) {
        return;
    }

    input.dataset.touched = 'true';
    const form = input.closest<HTMLFormElement>('.auth-dialog__content');
    if (!form) {
        return;
    }

    isAuthFieldValid(input, true);
    if (
        input.dataset.authField === 'password' &&
        form.classList.contains('auth-dialog__content--signup')
    ) {
        const confirmPassword = form.querySelector<HTMLInputElement>(
            '[data-auth-field="confirmPassword"]',
        );
        if (confirmPassword?.dataset.touched === 'true') {
            isAuthFieldValid(confirmPassword, true);
        }
    }
    updateSubmitState(form);
};

const getAuthFailureMessage = (error: unknown): string => {
    const errorCode =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
            ? error.code
            : '';
    const knownErrors = new Map<string, string>([
        ['auth/invalid-credential', 'Invalid email or password.'],
        ['auth/invalid-login-credentials', 'Invalid email or password.'],
        ['auth/wrong-password', 'Invalid email or password.'],
        ['auth/user-not-found', 'Invalid email or password.'],
        [
            'auth/email-already-in-use',
            'An account already exists for this email.',
        ],
        ['auth/invalid-email', 'Enter a valid email address.'],
        ['auth/weak-password', 'Choose a stronger password and try again.'],
        [
            'auth/too-many-requests',
            'Too many attempts. Please try again later.',
        ],
        [
            'auth/network-request-failed',
            'Network error. Check your connection and retry.',
        ],
        [
            'auth/popup-closed-by-user',
            'Google sign-in was canceled. You can try again.',
        ],
        [
            'auth/cancelled-popup-request',
            'Google sign-in was canceled. You can try again.',
        ],
        [
            'auth/popup-blocked',
            'Your browser blocked the Google sign-in popup. Allow popups and retry.',
        ],
        [
            'auth/operation-not-allowed',
            'Google sign-in is not enabled for this Firebase project.',
        ],
        [
            'auth/unauthorized-domain',
            'This domain is not authorized for Google sign-in. Add it in Firebase Authentication settings.',
        ],
    ]);
    return (
        knownErrors.get(errorCode) ?? 'Authentication failed. Please try again.'
    );
};

const getUserProfile = (user: User, fallbackName = ''): AppSessionProfile => ({
    displayName:
        fallbackName ||
        user.displayName ||
        user.email?.split('@', 1)[0] ||
        'Player',
    email: user.email ?? '',
    ...(user.photoURL && { avatarUrl: user.photoURL }),
});

const createLogo = (): HTMLAnchorElement => {
    const logo = document.createElement('a');
    logo.className = 'site-logo';
    logo.href = homeLink;
    logo.dataset.page = 'home';
    logo.setAttribute('aria-label', 'MiniGames home');
    const icon = document.createElement('span');
    icon.className = 'site-logo__icon';
    icon.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.src = brandLogoUrl;
    image.alt = '';
    icon.append(image);

    const label = document.createElement('span');
    label.className = 'site-logo__label';
    label.textContent = 'MiniGames';

    logo.append(icon, label);

    return logo;
};

const createNavigation = (): HTMLElement => {
    const navigation = document.createElement('nav');
    navigation.className = 'site-header__navigation';
    navigation.setAttribute('aria-label', 'Primary navigation');
    navigation.innerHTML = `
        <ul class="site-header__links">
            <li><a class="site-header__link site-header__link--active" href="${homeLink}" data-page="home" aria-current="page">Home</a></li>
            <li><a class="site-header__link" href="${libraryLink}" data-page="library">Library</a></li>
            <li><a class="site-header__link" href="${homeLink}" data-page="home">Tournaments</a></li>
            <li><a class="site-header__link" href="${homeLink}" data-page="home">Community</a></li>
        </ul>
    `;

    return navigation;
};

const createAuthDialog = (mode: AuthMode = 'login'): HTMLDialogElement => {
    const dialog = document.createElement('dialog');
    dialog.className = 'auth-dialog';
    dialog.setAttribute('aria-labelledby', 'auth-dialog-title');
    const isSignUp = mode === 'signup';
    const fields = isSignUp
        ? `
            <label class="auth-dialog__field">
                <span>Username</span>
                <input type="text" autocomplete="username" placeholder="Username" data-auth-field="username" aria-describedby="auth-username-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-username-error" aria-live="polite"></span>
            </label>
            <label class="auth-dialog__field">
                <span>Email</span>
                <input type="email" autocomplete="email" placeholder="Email" data-auth-field="email" aria-describedby="auth-email-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-email-error" aria-live="polite"></span>
            </label>
            <label class="auth-dialog__field">
                <span>Password</span>
                <input type="password" autocomplete="new-password" placeholder="Password" data-auth-field="password" aria-describedby="auth-password-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-password-error" aria-live="polite"></span>
            </label>
            <label class="auth-dialog__field">
                <span>Confirm password</span>
                <input type="password" autocomplete="new-password" placeholder="Confirm password" data-auth-field="confirmPassword" aria-describedby="auth-confirm-password-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-confirm-password-error" aria-live="polite"></span>
            </label>
        `
        : `
            <label class="auth-dialog__field">
                <span>Email</span>
                <input type="email" autocomplete="email" placeholder="Email" data-auth-field="email" aria-describedby="auth-email-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-email-error" aria-live="polite"></span>
            </label>
            <label class="auth-dialog__field">
                <span>Password</span>
                <input type="password" autocomplete="current-password" placeholder="Password" data-auth-field="password" aria-describedby="auth-password-error" aria-invalid="false" />
                <span class="auth-dialog__error" id="auth-password-error" aria-live="polite"></span>
            </label>
        `;
    const footer = isSignUp
        ? '<p class="auth-dialog__signup">Already have an account? <a href="#home" data-auth-mode="login">Login</a></p>'
        : '<p class="auth-dialog__signup">New to MiniGames? <a href="#home" data-auth-mode="signup">Register</a></p>';
    dialog.innerHTML = `
        <form class="auth-dialog__content auth-dialog__content--${mode}" novalidate>
            <button class="auth-dialog__close" type="button" aria-label="Close ${isSignUp ? 'sign up' : 'sign in'} dialog">×</button>
            <div class="auth-dialog__switcher" role="tablist" aria-label="Authentication mode">
                <button class="auth-dialog__tab${isSignUp ? '' : ' auth-dialog__tab--active'}" type="button" role="tab" aria-selected="${!isSignUp}" data-auth-mode="login">Login</button>
                <button class="auth-dialog__tab${isSignUp ? ' auth-dialog__tab--active' : ''}" type="button" role="tab" aria-selected="${isSignUp}" data-auth-mode="signup">Registration</button>
            </div>
            <div class="auth-dialog__eyebrow">MINIGAMES ACCOUNT</div>
            <h2 id="auth-dialog-title">${isSignUp ? 'Create your account' : 'Sign in'}</h2>
            <p class="auth-dialog__intro">${isSignUp ? 'Join the fun and keep your games in one place.' : 'Welcome back. Pick up where you left off.'}</p>
            <p class="auth-dialog__request-status" role="status" aria-live="polite"></p>
            ${fields}
            <button class="auth-dialog__submit" type="submit" disabled>${isSignUp ? 'Sign up' : 'Sign in'}</button>
            <div class="auth-dialog__divider"><span>or continue with</span></div>
            <button class="auth-dialog__google" type="button" data-google-auth>
                <span class="auth-dialog__google-mark" aria-hidden="true">G</span>
                Continue with Google
            </button>
            ${isSignUp ? '' : '<div class="auth-dialog__options"><label><input type="checkbox" /> <span>Remember me</span></label><a href="#home">Need help?</a></div>'}
            ${footer}
        </form>
    `;

    return dialog;
};

const createMobileMenu = (
    returnFocus: () => void,
    openAuthDialog: (mode: AuthMode) => void,
    navigateToPage: (page: SitePage) => void,
): HTMLElement => {
    const menu = document.createElement('aside');
    menu.className = 'mobile-menu';
    menu.id = 'mobile-navigation-menu';
    menu.setAttribute('aria-hidden', 'true');
    menu.setAttribute('aria-label', 'Mobile navigation');
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');

    const content = document.createElement('div');
    content.className = 'mobile-menu__content';

    const topBar = document.createElement('div');
    topBar.className = 'mobile-menu__top-bar';

    const menuLogo = createLogo();
    menuLogo.classList.add('mobile-menu__logo');

    const closeButton = document.createElement('button');
    closeButton.className = 'mobile-menu__close-button';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close navigation menu');
    closeButton.textContent = '\u{00D7}';

    topBar.append(menuLogo, closeButton);

    const navigation = document.createElement('nav');
    navigation.className = 'mobile-menu__navigation';
    navigation.setAttribute('aria-label', 'Mobile navigation links');
    navigation.innerHTML = `
        <ul class="mobile-menu__links">
            <li><a class="mobile-menu__link mobile-menu__link--active" href="${homeLink}" data-page="home" aria-current="page">Home</a></li>
            <li><a class="mobile-menu__link" href="${libraryLink}" data-page="library">Library</a></li>
            <li><a class="mobile-menu__link" href="${homeLink}" data-page="home">Tournaments</a></li>
            <li><a class="mobile-menu__link" href="${homeLink}" data-page="home">Community</a></li>
        </ul>
    `;

    const actions = document.createElement('div');
    actions.className = 'mobile-menu__actions';

    const logInButton = document.createElement('button');
    logInButton.className =
        'mobile-menu__auth-button mobile-menu__auth-button--secondary';
    logInButton.type = 'button';
    logInButton.textContent = 'Log In';
    logInButton.dataset.authControl = 'true';

    const signUpButton = document.createElement('button');
    signUpButton.className =
        'mobile-menu__auth-button mobile-menu__auth-button--primary';
    signUpButton.type = 'button';
    signUpButton.textContent = 'Sign Up';
    signUpButton.dataset.authControl = 'true';

    actions.append(logInButton, signUpButton);
    content.append(topBar, navigation, actions);
    menu.append(content);

    const closeMenu = (): void => {
        menu.classList.remove('mobile-menu--open');
        menu.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-menu-open');
        returnFocus();
    };

    closeButton.addEventListener('click', closeMenu);
    menu.addEventListener('click', (event) => {
        const link =
            event.target instanceof Element
                ? event.target.closest<HTMLAnchorElement>('a[data-page]')
                : undefined;
        const page = link?.dataset.page;
        if (page !== 'home' && page !== 'library') {
            return;
        }

        event.preventDefault();
        closeMenu();
        navigateToPage(page);
    });

    const openMobileAuthDialog = (mode: AuthMode): void => {
        closeMenu();
        openAuthDialog(mode);
    };

    logInButton.addEventListener('click', () => openMobileAuthDialog('login'));
    signUpButton.addEventListener('click', () =>
        openMobileAuthDialog('signup'),
    );

    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            menu.classList.contains('mobile-menu--open')
        ) {
            closeMenu();
        }
    });

    return menu;
};

export const createHeader = (
    onNavigate: (page: SitePage) => void = () => {},
    onAuthChange?: (mode: AuthMode | undefined) => void,
    onAuthenticated?: (profile: AppSessionProfile) => Promise<void>,
    snackbar?: Snackbar,
    authReady: Promise<unknown> = Promise.resolve(),
): InteractiveHeader => {
    const header = document.createElement('header') as InteractiveHeader;
    header.className = 'site-header';

    const updateActivePage = (page: SitePage): void => {
        const updateLinks = (selector: string, activeClass: string): void => {
            for (const link of header.querySelectorAll<HTMLAnchorElement>(
                selector,
            )) {
                const isActive = link.dataset.page === page;
                link.classList.toggle(activeClass, isActive);
                link.setAttribute('aria-current', isActive ? 'page' : 'false');
            }
        };

        updateLinks(
            '.site-header__link[data-page]',
            'site-header__link--active',
        );
        updateLinks(
            '.mobile-menu__link[data-page]',
            'mobile-menu__link--active',
        );
    };
    const navigateToPage = (page: SitePage): void => {
        updateActivePage(page);
        onNavigate(page);
    };

    const content = document.createElement('div');
    content.className = 'site-header__content';
    content.append(createLogo(), createNavigation());
    content.addEventListener('click', (event) => {
        const link =
            event.target instanceof Element
                ? event.target.closest<HTMLAnchorElement>('a[data-page]')
                : undefined;
        const page = link?.dataset.page;
        if (page !== 'home' && page !== 'library') {
            return;
        }

        event.preventDefault();
        navigateToPage(page);
    });

    const dialog = createAuthDialog();
    let closeTimer: number | undefined;
    let switchTimer: number | undefined;
    let isAuthPending = false;
    let isAuthReady = false;

    void authReady
        .then(() => {
            isAuthReady = true;
            for (const button of dialog.querySelectorAll<HTMLButtonElement>(
                '[data-google-auth]',
            )) {
                button.disabled = isAuthPending;
            }
        })
        .catch((error: unknown) => {
            snackbar?.show(
                'Authentication could not be initialized. Reload the app and try again.',
                'error',
            );
            globalThis.reportError(error);
        });

    const setAuthPending = (isPending: boolean): void => {
        isAuthPending = isPending;
        dialog.setAttribute('aria-busy', String(isPending));
        for (const input of dialog.querySelectorAll<HTMLInputElement>(
            'input',
        )) {
            input.disabled = isPending;
        }
        for (const button of dialog.querySelectorAll<HTMLButtonElement>(
            'button',
        )) {
            button.disabled =
                isPending ||
                (!isAuthReady && button.dataset.googleAuth !== undefined);
        }
        for (const button of header.querySelectorAll<HTMLButtonElement>(
            '[data-auth-control]',
        )) {
            button.disabled = isPending;
        }
        for (const link of dialog.querySelectorAll<HTMLAnchorElement>(
            '[data-auth-mode]',
        )) {
            link.setAttribute('aria-disabled', String(isPending));
            link.tabIndex = isPending ? -1 : 0;
        }
        const submitButton = dialog.querySelector<HTMLButtonElement>(
            '.auth-dialog__submit',
        );
        const requestStatus = dialog.querySelector<HTMLElement>(
            '.auth-dialog__request-status',
        );
        if (isPending) {
            if (submitButton) {
                submitButton.textContent = 'Please wait…';
            }
            if (requestStatus) {
                requestStatus.textContent = 'Authenticating…';
            }
        } else {
            const isSignUp = dialog
                .querySelector('form')
                ?.classList.contains('auth-dialog__content--signup');
            if (submitButton) {
                submitButton.textContent = isSignUp ? 'Sign up' : 'Sign in';
            }
            if (requestStatus) {
                requestStatus.textContent = '';
            }
            const form = dialog.querySelector<HTMLFormElement>('form');
            if (form) {
                updateSubmitState(form);
            }
        }
    };

    const submitAuthentication = async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();
        if (isAuthPending || !onAuthenticated) {
            return;
        }
        const form =
            event.target instanceof HTMLFormElement ? event.target : undefined;
        if (!form) {
            return;
        }
        const inputs = [
            ...form.querySelectorAll<HTMLInputElement>('[data-auth-field]'),
        ];
        let isValid = true;
        for (const input of inputs) {
            input.dataset.touched = 'true';
            isValid = isAuthFieldValid(input, true) && isValid;
        }
        updateSubmitState(form);
        if (!isValid) {
            return;
        }

        const isSignUp = form.classList.contains(
            'auth-dialog__content--signup',
        );
        const email =
            form
                .querySelector<HTMLInputElement>('[data-auth-field="email"]')
                ?.value.trim() ?? '';
        const password =
            form.querySelector<HTMLInputElement>('[data-auth-field="password"]')
                ?.value ?? '';
        const username =
            form
                .querySelector<HTMLInputElement>('[data-auth-field="username"]')
                ?.value.trim() ?? '';

        setAuthPending(true);
        let shouldRollbackFirebaseAuth = false;
        try {
            await authReady;
            const credentials = isSignUp
                ? await createUserWithEmailAndPassword(
                      firebaseAuth,
                      email,
                      password,
                  )
                : await signInWithEmailAndPassword(
                      firebaseAuth,
                      email,
                      password,
                  );
            shouldRollbackFirebaseAuth = true;
            if (isSignUp) {
                await updateProfile(credentials.user, {
                    displayName: username,
                });
            }

            const profile = getUserProfile(credentials.user, username);
            setAuthPending(false);
            await onAuthenticated(profile);
            snackbar?.show(
                isSignUp ? 'Your account was created.' : 'Welcome back!',
                'success',
            );
        } catch (error) {
            if (shouldRollbackFirebaseAuth && firebaseAuth.currentUser) {
                try {
                    await signOut(firebaseAuth);
                } catch (signOutError) {
                    snackbar?.show(
                        'Could not clear the Firebase sign-in after the authentication error.',
                        'error',
                    );
                    globalThis.reportError(signOutError);
                }
            }
            setAuthPending(false);
            const message = getAuthFailureMessage(error);
            const requestStatus = dialog.querySelector<HTMLElement>(
                '.auth-dialog__request-status',
            );
            if (requestStatus) {
                requestStatus.textContent = message;
            }
            snackbar?.show(message, 'error');
        }
    };

    const authenticateWithGoogle = async (): Promise<void> => {
        if (isAuthPending || !isAuthReady || !onAuthenticated) {
            return;
        }

        setAuthPending(true);
        let shouldRollbackFirebaseAuth = false;
        try {
            const credentialsPromise = signInWithPopup(
                firebaseAuth,
                new GoogleAuthProvider(),
            );
            const credentials = await credentialsPromise;
            shouldRollbackFirebaseAuth = true;
            const profile = getUserProfile(credentials.user);
            setAuthPending(false);
            await onAuthenticated(profile);
            snackbar?.show('You are signed in with Google.', 'success');
        } catch (error) {
            if (shouldRollbackFirebaseAuth && firebaseAuth.currentUser) {
                try {
                    await signOut(firebaseAuth);
                } catch (signOutError) {
                    snackbar?.show(
                        'Could not clear the Firebase sign-in after the authentication error.',
                        'error',
                    );
                    globalThis.reportError(signOutError);
                }
            }
            setAuthPending(false);
            const message = getAuthFailureMessage(error);
            const requestStatus = dialog.querySelector<HTMLElement>(
                '.auth-dialog__request-status',
            );
            if (requestStatus) {
                requestStatus.textContent = message;
            }
            snackbar?.show(message, 'error');
        }
    };

    dialog.addEventListener('input', handleAuthFieldChange);
    dialog.addEventListener('change', handleAuthFieldChange);
    dialog.addEventListener('focusout', handleAuthFieldChange);
    dialog.addEventListener('click', (event) => {
        const googleButton =
            event.target instanceof Element
                ? event.target.closest<HTMLButtonElement>('[data-google-auth]')
                : undefined;
        if (googleButton) {
            void authenticateWithGoogle();
        }
    });
    dialog.addEventListener('submit', (event) => {
        void submitAuthentication(event);
    });

    const setAuthMode = (mode: AuthMode, isAnimated: boolean): void => {
        if (switchTimer !== undefined) {
            globalThis.clearTimeout(switchTimer);
            switchTimer = undefined;
        }

        const updateContent = (): void => {
            const variant = createAuthDialog(mode);
            dialog.innerHTML = variant.getHTML();
            requestAnimationFrame(() => {
                dialog.classList.remove('auth-dialog--switching');
            });
            switchTimer = undefined;
        };

        if (!isAnimated || !dialog.open) {
            updateContent();
            return;
        }

        dialog.classList.add('auth-dialog--switching');
        switchTimer = globalThis.setTimeout(updateContent, 120);
    };

    const openAuthDialog = (mode: AuthMode): void => {
        if (isAuthPending) {
            return;
        }
        if (closeTimer !== undefined) {
            globalThis.clearTimeout(closeTimer);
            closeTimer = undefined;
        }

        const wasOpen = dialog.open;
        dialog.classList.remove('auth-dialog--closing');
        document.body.classList.add('auth-dialog-open');
        setAuthMode(mode, wasOpen);
        if (!wasOpen) {
            dialog.showModal();
        }
        requestAnimationFrame(() => {
            dialog.classList.add('auth-dialog--visible');
        });
    };

    const closeAuthDialog = (): void => {
        if (
            isAuthPending ||
            !dialog.open ||
            dialog.classList.contains('auth-dialog--closing')
        ) {
            return;
        }

        dialog.classList.remove(
            'auth-dialog--visible',
            'auth-dialog--switching',
        );
        if (switchTimer !== undefined) {
            globalThis.clearTimeout(switchTimer);
            switchTimer = undefined;
        }
        dialog.classList.add('auth-dialog--closing');
        closeTimer = globalThis.setTimeout(() => {
            dialog.close();
            dialog.classList.remove('auth-dialog--closing');
            document.body.classList.remove('auth-dialog-open');
            closeTimer = undefined;
        }, 180);
    };

    header.setAuthMode = (mode): void => {
        if (mode) {
            openAuthDialog(mode);
            return;
        }
        closeAuthDialog();
    };

    const requestAuthChange = (mode: AuthMode | undefined): void => {
        if (onAuthChange) {
            onAuthChange(mode);
        } else if (mode) {
            openAuthDialog(mode);
        } else {
            closeAuthDialog();
        }
    };

    dialog.addEventListener('click', (event) => {
        if (isAuthPending) {
            event.preventDefault();
            return;
        }
        const switchTarget =
            event.target instanceof Element
                ? event.target.closest<HTMLElement>('[data-auth-mode]')
                : undefined;
        const nextMode = switchTarget?.dataset.authMode;
        if (nextMode === 'login' || nextMode === 'signup') {
            event.preventDefault();
            requestAuthChange(nextMode);
            return;
        }

        if (
            event.target instanceof HTMLButtonElement &&
            event.target.classList.contains('auth-dialog__close')
        ) {
            requestAuthChange(undefined);
            return;
        }

        if (event.target === dialog) {
            requestAuthChange(undefined);
        }
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        if (isAuthPending) {
            return;
        }
        requestAuthChange(undefined);
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !dialog.open) {
            return;
        }

        event.preventDefault();
        if (isAuthPending) {
            return;
        }
        requestAuthChange(undefined);
    });

    const actions = document.createElement('div');
    actions.className = 'site-header__actions';

    const logInButton = document.createElement('button');
    logInButton.className =
        'site-header__button site-header__button--secondary';
    logInButton.type = 'button';
    logInButton.textContent = 'Log In';
    logInButton.dataset.authControl = 'true';
    logInButton.addEventListener('click', () => requestAuthChange('login'));

    const signUpButton = document.createElement('button');
    signUpButton.className = 'site-header__button site-header__button--primary';
    signUpButton.type = 'button';
    signUpButton.textContent = 'Sign Up';
    signUpButton.dataset.authControl = 'true';
    signUpButton.addEventListener('click', () => requestAuthChange('signup'));

    const menuButton = document.createElement('button');
    menuButton.className = 'site-header__menu-button';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Open navigation menu');
    menuButton.setAttribute('aria-controls', 'mobile-navigation-menu');
    menuButton.setAttribute('aria-expanded', 'false');

    const menuIcon = document.createElement('img');
    menuIcon.src = menuIconUrl;
    menuIcon.alt = '';
    menuButton.append(menuIcon);

    const mobileMenu = createMobileMenu(
        () => {
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.focus();
        },
        requestAuthChange,
        navigateToPage,
    );
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.add('mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuButton.setAttribute('aria-expanded', 'true');
        document.body.classList.add('mobile-menu-open');
        mobileMenu
            .querySelector<HTMLButtonElement>('.mobile-menu__close-button')
            ?.focus();
    });

    actions.append(logInButton, signUpButton, menuButton);
    content.append(actions);

    header.append(content, mobileMenu, dialog);
    return header;
};
