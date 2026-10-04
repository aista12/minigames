import './cards.scss';
import { API_BASE_URL, fetchPaginatedCollection } from '../../../shared/api';
import type { Snackbar } from '../../../shared/snackbar';

type LibraryGame = {
    slug: string;
    name: string;
    category: string;
    price: string;
    shortDescription: string;
    rating: number;
    likesCount: number;
    cardImage: string;
};

const isLibraryGame = (value: unknown): value is LibraryGame => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const game = value as Record<string, unknown>;
    return (
        typeof game.slug === 'string' &&
        typeof game.name === 'string' &&
        typeof game.category === 'string' &&
        typeof game.price === 'string' &&
        typeof game.shortDescription === 'string' &&
        typeof game.rating === 'number' &&
        typeof game.likesCount === 'number' &&
        typeof game.cardImage === 'string'
    );
};

const gameCardImages = import.meta.glob<string>('../assets/*-card.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
});

const cardsPerPage = 6;

export type InteractiveLibraryCardsSection = HTMLElement & {
    load: (category: string, sort: string, page?: number) => void;
    destroy: () => void;
};

const createCard = (
    game: LibraryGame,
    index: number,
    openGameDetails: (gameSlug: string) => void,
): HTMLLIElement => {
    const item = document.createElement('li');
    item.className = 'library-cards__item';

    const card = document.createElement('article');
    card.className = 'library-card';

    const image = document.createElement('img');
    image.className = 'library-card__image';
    image.alt = `${game.name} game artwork`;
    image.loading = index < 4 ? 'eager' : 'lazy';
    image.addEventListener(
        'error',
        () => {
            const localImage =
                gameCardImages[`../assets/${game.slug}-card.jpg`];
            if (localImage) {
                image.src = localImage;
            }
        },
        { once: true },
    );
    image.src = new URL(game.cardImage, API_BASE_URL).href;

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
    rating.innerHTML = '<span aria-hidden="true">★</span> ';
    rating.append(document.createTextNode(game.rating.toFixed(1)));

    const likes = document.createElement('span');
    likes.className = 'library-card__likes';
    likes.innerHTML = '<span aria-hidden="true">♡</span> ';
    likes.append(
        document.createTextNode(
            new Intl.NumberFormat('en', {
                notation: 'compact',
                maximumFractionDigits: 1,
            }).format(game.likesCount),
        ),
    );
    metadata.append(rating, likes);

    const details = document.createElement('button');
    details.className = 'library-card__details';
    details.type = 'button';
    details.textContent = 'Details';
    details.setAttribute('aria-label', `View details for ${game.name}`);
    details.addEventListener('click', () => openGameDetails(game.slug));

    content.append(badges, title, description, metadata, details);
    card.append(image, content);
    item.append(card);
    return item;
};

const createSkeletonCard = (): HTMLLIElement => {
    const item = document.createElement('li');
    item.className = 'library-cards__item';
    item.setAttribute('aria-hidden', 'true');

    const card = document.createElement('article');
    card.className = 'library-card library-card--skeleton';

    const image = document.createElement('div');
    image.className = 'library-card__skeleton-image';

    const content = document.createElement('div');
    content.className = 'library-card__skeleton-content';
    for (let index = 0; index < 4; index += 1) {
        const line = document.createElement('span');
        line.className = 'library-card__skeleton-line';
        content.append(line);
    }

    card.append(image, content);
    item.append(card);
    return item;
};

export const createLibraryCardsSection = (
    openGameDetails: (gameSlug: string) => void,
    snackbar: Snackbar,
    onPaginationUpdate: (page: number, totalPages: number) => void,
): InteractiveLibraryCardsSection => {
    const section = document.createElement(
        'section',
    ) as InteractiveLibraryCardsSection;
    section.className = 'library-cards';
    section.setAttribute('aria-labelledby', 'library-cards-title');

    const heading = document.createElement('h2');
    heading.className = 'library-cards__heading';
    heading.id = 'library-cards-title';
    heading.textContent = 'All Games';

    const list = document.createElement('ul');
    list.className = 'library-cards__grid';
    list.setAttribute('aria-live', 'polite');

    section.append(heading, list);

    let controller: AbortController | undefined;
    let selectedCategory = 'all';
    let selectedSort = 'rating-desc';
    let selectedPage = 1;
    section.load = (category, sort, page = 1): void => {
        selectedCategory = category;
        selectedSort = sort;
        selectedPage = page;
        void loadGames();
    };
    section.destroy = (): void => {
        controller?.abort();
    };

    const showLoading = (): void => {
        list.setAttribute('aria-busy', 'true');
        list.replaceChildren(
            ...Array.from({ length: cardsPerPage }, createSkeletonCard),
        );
    };

    const showError = (): void => {
        const item = document.createElement('li');
        item.className = 'library-cards__state-item';

        const state = document.createElement('div');
        state.className = 'library-cards__state library-cards__state--error';
        state.setAttribute('role', 'alert');

        const message = document.createElement('p');
        message.textContent = 'Games could not be loaded.';

        const retry = document.createElement('button');
        retry.className = 'library-cards__retry';
        retry.type = 'button';
        retry.textContent = 'Try again';
        retry.addEventListener('click', () => {
            void loadGames();
        });

        state.append(message, retry);
        item.append(state);
        list.replaceChildren(item);
    };

    async function loadGames(): Promise<void> {
        controller?.abort();
        controller = new AbortController();
        const requestController = controller;
        showLoading();

        try {
            const response = await fetchPaginatedCollection(
                `/games?${new URLSearchParams({
                    category: selectedCategory,
                    sort: selectedSort,
                    page: String(selectedPage),
                    limit: String(cardsPerPage),
                })}`,
                isLibraryGame,
                requestController.signal,
            );
            if (requestController.signal.aborted) {
                return;
            }

            selectedPage = response.page;
            onPaginationUpdate(response.page, Math.max(response.totalPages, 1));

            list.removeAttribute('aria-busy');
            if (response.items.length === 0) {
                const item = document.createElement('li');
                item.className = 'library-cards__state-item';

                const empty = document.createElement('div');
                empty.className =
                    'library-cards__state library-cards__state--empty';
                empty.setAttribute('role', 'status');

                const title = document.createElement('h3');
                title.textContent = 'Data Not Found';

                const message = document.createElement('p');
                message.textContent =
                    'No games match the selected filters on this page.';
                empty.append(title, message);
                item.append(empty);
                list.replaceChildren(item);
                return;
            }

            list.replaceChildren(
                ...response.items.map((game, index) =>
                    createCard(game, index, openGameDetails),
                ),
            );
        } catch {
            if (requestController.signal.aborted) {
                return;
            }

            list.removeAttribute('aria-busy');
            showError();
            snackbar.show('Unable to load games. Please try again.', 'error');
        }
    }

    return section;
};
