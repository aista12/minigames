import './cards.scss';
import { libraryGames } from '../games-section/games';

const gameCardImages = import.meta.glob<string>('../assets/*-card.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

export const createLibraryCardsSection = (
    openGameDetails: () => void,
): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'library-cards';
    section.setAttribute('aria-labelledby', 'library-cards-title');

    const heading = document.createElement('h2');
    heading.className = 'library-cards__heading';
    heading.id = 'library-cards-title';
    heading.textContent = 'All Games';

    const list = document.createElement('ul');
    list.className = 'library-cards__grid';

    for (const [index, game] of libraryGames.entries()) {
        const imageUrl = gameCardImages[`../assets/${game.slug}-card.jpg`];
        if (!imageUrl) {
            throw new Error(`Missing card artwork for ${game.slug}`);
        }

        const item = document.createElement('li');
        item.className = 'library-cards__item';

        const card = document.createElement('article');
        card.className = 'library-card';

        const image = document.createElement('img');
        image.className = 'library-card__image';
        image.src = imageUrl;
        image.alt = `${game.name} game artwork`;
        image.loading = index < 4 ? 'eager' : 'lazy';

        const content = document.createElement('div');
        content.className = 'library-card__content';

        const badges = document.createElement('div');
        badges.className = 'library-card__badges';

        const category = document.createElement('span');
        category.className = 'library-card__badge';
        category.textContent = game.category;

        const price = document.createElement('span');
        price.className = 'library-card__badge library-card__badge--price';
        price.textContent = game.price;
        badges.append(category, price);

        const title = document.createElement('h3');
        title.className = 'library-card__title';
        title.textContent = game.name;

        const description = document.createElement('p');
        description.className = 'library-card__description';
        description.textContent = game.shortDescription;

        const metadata = document.createElement('div');
        metadata.className = 'library-card__metadata';
        const rating = document.createElement('span');
        rating.className = 'library-card__rating';
        rating.innerHTML = `<span aria-hidden="true">★</span> ${game.rating.toFixed(1)}`;

        const likes = document.createElement('span');
        likes.className = 'library-card__likes';
        likes.innerHTML = `<span aria-hidden="true">♡</span> ${new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(game.likesCount)}`;
        metadata.append(rating, likes);

        const details = document.createElement('button');
        details.className = 'library-card__details';
        details.type = 'button';
        details.textContent = 'Details';
        details.setAttribute('aria-label', `View details for ${game.name}`);
        details.addEventListener('click', openGameDetails);

        content.append(badges, title, description, metadata, details);
        card.append(image, content);
        item.append(card);
        list.append(item);
    }

    section.append(heading, list);
    return section;
};
