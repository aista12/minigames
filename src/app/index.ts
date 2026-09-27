import '../shared/styles/globals.scss';
import { createLibraryGamesSection } from '../pages/library/games-section/games-section';
import { createLibraryCardsSection } from '../pages/library/cards/cards';
import { createLibraryPagination } from '../pages/library/pagination/pagination';
import { createCarousel } from '../pages/home/carousel/carousel';
import { createDeveloperCta } from '../pages/home/developer-cta/developer-cta';
import { createFooter } from '../pages/home/footer/footer';
import { createHero } from '../pages/home/hero/hero';
import { createLeaderboard } from '../pages/home/leaderboard/leaderboard';
import { createGameDetailsDialog } from '../widgets/game-details/game-details';
import { createHeader, type SitePage } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
const main = document.createElement('main');
const libraryGamesSection = createLibraryGamesSection();
const gameDetailsDialog = createGameDetailsDialog();
const libraryCardsSection = createLibraryCardsSection(gameDetailsDialog.open);
const libraryPagination = createLibraryPagination();
const homeCarouselState: {
    current: ReturnType<typeof createCarousel> | undefined;
} = { current: undefined };

const renderPage = (page: SitePage): void => {
    if (page === 'home') {
        homeCarouselState.current ??= createCarousel(gameDetailsDialog.open);
        main.replaceChildren(
            createHero(),
            homeCarouselState.current,
            createLeaderboard(),
            createDeveloperCta(),
        );
    } else {
        homeCarouselState.current?.destroy();
        homeCarouselState.current = undefined;
        main.replaceChildren(
            libraryGamesSection,
            libraryCardsSection,
            libraryPagination,
        );
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
app.append(
    createHeader(renderPage),
    main,
    createFooter(renderPage),
    gameDetailsDialog.element,
);

document.body.append(app);
