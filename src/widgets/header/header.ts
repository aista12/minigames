import './header.scss';
import brandLogoUrl from '../../shared/assets/brand-logo.png';
import menuIconUrl from '../../shared/assets/menu.svg';

const homeLink = '#home';

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

const createAuthDialog = (): HTMLDialogElement => {
    const dialog = document.createElement('dialog');
    dialog.className = 'auth-dialog';
    dialog.setAttribute('aria-labelledby', 'auth-dialog-title');
    dialog.innerHTML = `
        <form method="dialog" class="auth-dialog__content">
            <button class="auth-dialog__close" type="submit" aria-label="Close sign in dialog">×</button>
            <h2 id="auth-dialog-title">Sign in</h2>
            <p>Authentication will be available here.</p>
        </form>
    `;

    return dialog;
};

const createMobileMenu = (
    dialog: HTMLDialogElement,
    returnFocus: () => void,
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

    const openAuthDialog = (): void => {
        closeMenu();
        dialog.showModal();
    };

    logInButton.addEventListener('click', openAuthDialog);
    signUpButton.addEventListener('click', openAuthDialog);

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
    const actions = document.createElement('div');
    actions.className = 'site-header__actions';

    const logInButton = document.createElement('button');
    logInButton.className =
        'site-header__button site-header__button--secondary';
    logInButton.type = 'button';
    logInButton.textContent = 'Log In';
    logInButton.addEventListener('click', () => dialog.showModal());

    const signUpButton = document.createElement('button');
    signUpButton.className = 'site-header__button site-header__button--primary';
    signUpButton.type = 'button';
    signUpButton.textContent = 'Sign Up';
    signUpButton.addEventListener('click', () => dialog.showModal());

    const menuButton = document.createElement('button');
    menuButton.className = 'site-header__menu-button';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Open navigation menu');

    const menuIcon = document.createElement('img');
    menuIcon.src = menuIconUrl;
    menuIcon.alt = '';
    menuButton.append(menuIcon);

    const mobileMenu = createMobileMenu(dialog, () => menuButton.focus());
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
