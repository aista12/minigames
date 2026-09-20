import './header.scss';
import brandLogoUrl from '../../shared/assets/brand-logo.png';
import menuIconUrl from '../../shared/assets/menu.svg';

const homeLink = '#home';
type AuthMode = 'login' | 'signup';

const createLogo = (): HTMLAnchorElement => {
    const logo = document.createElement('a');
    logo.className = 'site-logo';
    logo.href = homeLink;
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
            <li><a class="site-header__link site-header__link--active" href="#home" aria-current="page">Home</a></li>
            <li><a class="site-header__link" href="#home">Library</a></li>
            <li><a class="site-header__link" href="#home">Tournaments</a></li>
            <li><a class="site-header__link" href="#home">Community</a></li>
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
                <span>Display name</span>
                <input type="text" autocomplete="name" placeholder="Display name" />
            </label>
            <label class="auth-dialog__field">
                <span>Email</span>
                <input type="email" autocomplete="email" placeholder="Email" />
            </label>
            <label class="auth-dialog__field">
                <span>Password</span>
                <input type="password" autocomplete="new-password" placeholder="Password" />
            </label>
        `
        : `
            <label class="auth-dialog__field">
                <span>Email or username</span>
                <input type="email" autocomplete="email" placeholder="Email or username" />
            </label>
            <label class="auth-dialog__field">
                <span>Password</span>
                <input type="password" autocomplete="current-password" placeholder="Password" />
            </label>
        `;
    const footer = isSignUp
        ? '<p class="auth-dialog__signup">Already have an account? <a href="#home" data-auth-mode="login">Login</a></p>'
        : '<p class="auth-dialog__signup">New to MiniGames? <a href="#home" data-auth-mode="signup">Register</a></p>';
    dialog.innerHTML = `
        <form class="auth-dialog__content auth-dialog__content--${mode}">
            <button class="auth-dialog__close" type="button" aria-label="Close ${isSignUp ? 'sign up' : 'sign in'} dialog">×</button>
            <div class="auth-dialog__switcher" role="tablist" aria-label="Authentication mode">
                <button class="auth-dialog__tab${isSignUp ? '' : ' auth-dialog__tab--active'}" type="button" role="tab" aria-selected="${!isSignUp}" data-auth-mode="login">Login</button>
                <button class="auth-dialog__tab${isSignUp ? ' auth-dialog__tab--active' : ''}" type="button" role="tab" aria-selected="${isSignUp}" data-auth-mode="signup">Registration</button>
            </div>
            <div class="auth-dialog__eyebrow">MINIGAMES ACCOUNT</div>
            <h2 id="auth-dialog-title">${isSignUp ? 'Create your account' : 'Sign in'}</h2>
            <p class="auth-dialog__intro">${isSignUp ? 'Join the fun and keep your games in one place.' : 'Welcome back. Pick up where you left off.'}</p>
            ${fields}
            <button class="auth-dialog__submit" type="button">${isSignUp ? 'Sign up' : 'Sign in'}</button>
            ${isSignUp ? '' : '<div class="auth-dialog__options"><label><input type="checkbox" /> <span>Remember me</span></label><a href="#home">Need help?</a></div>'}
            ${footer}
        </form>
    `;

    return dialog;
};

const createMobileMenu = (
    returnFocus: () => void,
    openAuthDialog: (mode: AuthMode) => void,
): HTMLElement => {
    const menu = document.createElement('aside');
    menu.className = 'mobile-menu';
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
            <li><a class="mobile-menu__link mobile-menu__link--active" href="#home" aria-current="page">Home</a></li>
            <li><a class="mobile-menu__link" href="#home">Library</a></li>
            <li><a class="mobile-menu__link" href="#home">Tournaments</a></li>
            <li><a class="mobile-menu__link" href="#home">Community</a></li>
        </ul>
    `;

    const actions = document.createElement('div');
    actions.className = 'mobile-menu__actions';

    const logInButton = document.createElement('button');
    logInButton.className =
        'mobile-menu__auth-button mobile-menu__auth-button--secondary';
    logInButton.type = 'button';
    logInButton.textContent = 'Log In';

    const signUpButton = document.createElement('button');
    signUpButton.className =
        'mobile-menu__auth-button mobile-menu__auth-button--primary';
    signUpButton.type = 'button';
    signUpButton.textContent = 'Sign Up';

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
    navigation.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            closeMenu();
        }
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

export const createHeader = (): HTMLElement => {
    const header = document.createElement('header');
    header.className = 'site-header';

    const content = document.createElement('div');
    content.className = 'site-header__content';
    content.append(createLogo(), createNavigation());

    const dialog = createAuthDialog();
    let closeTimer: number | undefined;
    let switchTimer: number | undefined;

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
        if (closeTimer !== undefined) {
            globalThis.clearTimeout(closeTimer);
            closeTimer = undefined;
        }

        dialog.classList.remove('auth-dialog--closing');
        document.body.classList.add('auth-dialog-open');
        setAuthMode(mode, false);
        dialog.showModal();
        requestAnimationFrame(() => {
            dialog.classList.add('auth-dialog--visible');
        });
    };

    const closeAuthDialog = (): void => {
        if (!dialog.open || dialog.classList.contains('auth-dialog--closing')) {
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

    dialog.addEventListener('click', (event) => {
        const switchTarget =
            event.target instanceof Element
                ? event.target.closest<HTMLElement>('[data-auth-mode]')
                : undefined;
        const nextMode = switchTarget?.dataset.authMode;
        if (nextMode === 'login' || nextMode === 'signup') {
            event.preventDefault();
            setAuthMode(nextMode, true);
            return;
        }

        if (
            event.target instanceof HTMLButtonElement &&
            event.target.classList.contains('auth-dialog__close')
        ) {
            closeAuthDialog();
            return;
        }

        if (event.target === dialog) {
            closeAuthDialog();
        }
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeAuthDialog();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !dialog.open) {
            return;
        }

        event.preventDefault();
        closeAuthDialog();
    });

    const actions = document.createElement('div');
    actions.className = 'site-header__actions';

    const logInButton = document.createElement('button');
    logInButton.className =
        'site-header__button site-header__button--secondary';
    logInButton.type = 'button';
    logInButton.textContent = 'Log In';
    logInButton.addEventListener('click', () => openAuthDialog('login'));

    const signUpButton = document.createElement('button');
    signUpButton.className = 'site-header__button site-header__button--primary';
    signUpButton.type = 'button';
    signUpButton.textContent = 'Sign Up';
    signUpButton.addEventListener('click', () => openAuthDialog('signup'));

    const menuButton = document.createElement('button');
    menuButton.className = 'site-header__menu-button';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Open navigation menu');

    const menuIcon = document.createElement('img');
    menuIcon.src = menuIconUrl;
    menuIcon.alt = '';
    menuButton.append(menuIcon);

    const mobileMenu = createMobileMenu(
        () => menuButton.focus(),
        openAuthDialog,
    );
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.add('mobile-menu--open');
        mobileMenu.setAttribute('aria-hidden', 'false');
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
