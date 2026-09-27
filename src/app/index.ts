import '../shared/styles/globals.scss';
import { createCarousel } from '../pages/home/carousel/carousel';
import { createDeveloperCta } from '../pages/home/developer-cta/developer-cta';
import { createFooter } from '../pages/home/footer/footer';
import { createHero } from '../pages/home/hero/hero';
import { createLeaderboard } from '../pages/home/leaderboard/leaderboard';
import { createHeader, type SitePage } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
const main = document.createElement('main');

const renderPage = (page: SitePage): void => {
    if (page === 'home') {
        main.replaceChildren(
            createHero(),
            createCarousel(),
            createLeaderboard(),
            createDeveloperCta(),
        );
    } else {
        const libraryPlaceholder = document.createElement('section');
        libraryPlaceholder.setAttribute(
            'aria-labelledby',
            'library-placeholder-title',
        );
        libraryPlaceholder.className = 'library-placeholder';

        const title = document.createElement('h1');
        title.id = 'library-placeholder-title';
        title.textContent = 'Library';

        libraryPlaceholder.append(title);
        main.replaceChildren(libraryPlaceholder);
    }

    for (const link of app.querySelectorAll<HTMLAnchorElement>(
        '.site-header__link[data-page], .mobile-menu__link[data-page]',
    )) {
        const isActive = link.dataset.page === page;
        link.classList.toggle('site-header__link--active', isActive);
        link.classList.toggle('mobile-menu__link--active', isActive);
        link.toggleAttribute('aria-current', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        }
    }
};

renderPage('home');
app.append(createHeader(renderPage), main, createFooter(renderPage));

document.body.append(app);
