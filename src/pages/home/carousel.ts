import './carousel.scss';
import bubbleShooterUrl from './assets/game-bubble-shooter.png';
import candyCrushUrl from './assets/game-candy-crush.png';
import islandersUrl from './assets/game-islanders.png';
import vacationCafeUrl from './assets/game-vacation-cafe.png';
import winterBurrowUrl from './assets/game-winter-burrow.png';

type GameCard = {
    title: string;
    imageUrl: string;
    rating: string;
    likes: string;
    className: string;
};

const games: GameCard[] = [
    {
        title: 'Candy Crush',
        imageUrl: candyCrushUrl,
        rating: '4.7',
        likes: '36.8K',
        className: 'carousel-card--narrow carousel-card--first',
    },
    {
        title: 'ISLANDERS: New Shores',
        imageUrl: islandersUrl,
        rating: '4.9',
        likes: '54.2K',
        className: 'carousel-card--standard carousel-card--second',
    },
    {
        title: 'Vacation Cafe Simulator',
        imageUrl: vacationCafeUrl,
        rating: '4.8',
        likes: '28.7K',
        className: 'carousel-card--featured carousel-card--third',
    },
    {
        title: 'Winter Burrow',
        imageUrl: winterBurrowUrl,
        rating: '4.9',
        likes: '32.4K',
        className: 'carousel-card--standard carousel-card--fourth',
    },
    {
        title: 'Bubble Shooter',
        imageUrl: bubbleShooterUrl,
        rating: '4.6',
        likes: '19.5K',
        className: 'carousel-card--narrow carousel-card--fifth',
    },
];

const createGameCard = (game: GameCard): HTMLElement => {
    const card = document.createElement('article');
    card.className = `carousel-card ${game.className}`;
    card.setAttribute('aria-label', game.title);

    const image = document.createElement('img');
    image.className = 'carousel-card__image';
    image.src = game.imageUrl;
    image.alt = '';

    const overlay = document.createElement('div');
    overlay.className = 'carousel-card__overlay';

    const title = document.createElement('h3');
    title.className = 'carousel-card__title';
    title.textContent = game.title;

    const details = document.createElement('div');
    details.className = 'carousel-card__details';
    details.innerHTML = `
        <span class="carousel-card__rating"><span aria-hidden="true">★</span>${game.rating}</span>
        <span class="carousel-card__likes"><span aria-hidden="true">♡</span>${game.likes}</span>
    `;

    overlay.append(title, details);
    card.append(image, overlay);

    return card;
};

export const createCarousel = (): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'carousel-section';
    section.setAttribute('aria-labelledby', 'new-games-title');

    const header = document.createElement('header');
    header.className = 'carousel-section__header';

    const headingGroup = document.createElement('div');
    headingGroup.className = 'carousel-section__heading-group';

    const accent = document.createElement('span');
    accent.className = 'carousel-section__accent';
    accent.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    title.className = 'carousel-section__title';
    title.id = 'new-games-title';
    title.textContent = 'New Games';
    headingGroup.append(accent, title);

    const controls = document.createElement('div');
    controls.className = 'carousel-section__controls';
    controls.setAttribute('aria-hidden', 'true');

    const previousButton = document.createElement('button');
    previousButton.className = 'carousel-section__control';
    previousButton.type = 'button';
    previousButton.textContent = '←';
    previousButton.tabIndex = -1;

    const nextButton = document.createElement('button');
    nextButton.className =
        'carousel-section__control carousel-section__control--next';
    nextButton.type = 'button';
    nextButton.textContent = '→';
    nextButton.tabIndex = -1;

    controls.append(previousButton, nextButton);
    header.append(headingGroup, controls);

    const track = document.createElement('div');
    track.className = 'carousel-section__track';
    track.setAttribute('aria-label', 'New games');

    for (const game of games) {
        track.append(createGameCard(game));
    }
    section.append(header, track);

    return section;
};