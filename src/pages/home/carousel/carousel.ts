import './carousel.scss';
import { API_BASE_URL, fetchCollection } from '../../../shared/api';
import type { Snackbar } from '../../../shared/snackbar';

type FeaturedGame = {
    slug: string;
    name: string;
    rating: number;
    likesCount: number;
    cardImage: string;
};

const localGameCardImages = import.meta.glob<string>(
    '../../library/assets/*-card.jpg',
    { eager: true, query: '?url', import: 'default' },
);

const isFeaturedGame = (value: unknown): value is FeaturedGame => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const game = value as Record<string, unknown>;
    return (
        typeof game.slug === 'string' &&
        typeof game.name === 'string' &&
        typeof game.rating === 'number' &&
        typeof game.likesCount === 'number' &&
        typeof game.cardImage === 'string'
    );
};

const autoplayDuration = 4000;
const swipeThreshold = 40;

type CarouselCard = HTMLElement & { gameIndex: number };
export type InteractiveCarousel = HTMLElement & { destroy: () => void };

const formatLikes = (likesCount: number): string =>
    new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(likesCount);

const createGameCard = (
    game: FeaturedGame,
    gameIndex: number,
    openGameDetails: (gameSlug: string) => void,
): CarouselCard => {
    const card = Object.assign(document.createElement('article'), {
        gameIndex,
    });
    card.className = 'carousel-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute(
        'aria-label',
        `View details for ${game.name}, rated ${game.rating.toFixed(1)}, ${formatLikes(game.likesCount)} likes`,
    );

    const image = document.createElement('img');
    image.className = 'carousel-card__image';
    image.addEventListener(
        'error',
        () => {
            const localImage =
                localGameCardImages[
                    `../../library/assets/${game.slug}-card.jpg`
                ];
            if (localImage) {
                image.src = localImage;
            }
        },
        { once: true },
    );
    image.src = new URL(game.cardImage, API_BASE_URL).href;
    image.alt = '';
    image.draggable = false;

    const overlay = document.createElement('div');
    overlay.className = 'carousel-card__overlay';

    const title = document.createElement('h3');
    title.className = 'carousel-card__title';
    title.textContent = game.name;

    const details = document.createElement('div');
    details.className = 'carousel-card__details';

    const rating = document.createElement('span');
    rating.className = 'carousel-card__rating';
    rating.innerHTML = '<span aria-hidden="true">★</span>';
    rating.append(document.createTextNode(game.rating.toFixed(1)));

    const likes = document.createElement('span');
    likes.className = 'carousel-card__likes';
    likes.innerHTML = '<span aria-hidden="true">♡</span>';
    likes.append(document.createTextNode(formatLikes(game.likesCount)));

    details.append(rating, likes);
    overlay.append(title, details);
    card.append(image, overlay);
    card.addEventListener('click', () => openGameDetails(game.slug));
    card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        openGameDetails(game.slug);
    });

    return card;
};

export const createCarousel = (
    openGameDetails: (gameSlug: string) => void,
    snackbar: Snackbar,
): InteractiveCarousel => {
    const section = document.createElement('section') as InteractiveCarousel;
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
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Carousel controls');

    const previousButton = document.createElement('button');
    previousButton.className = 'carousel-section__control';
    previousButton.type = 'button';
    previousButton.setAttribute('aria-label', 'Previous games');
    previousButton.textContent = '←';

    const nextButton = document.createElement('button');
    nextButton.className =
        'carousel-section__control carousel-section__control--next';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next games');
    nextButton.textContent = '→';

    controls.append(previousButton, nextButton);
    header.append(headingGroup, controls);

    const track = document.createElement('div');
    track.className = 'carousel-section__track';
    track.setAttribute('role', 'group');
    track.setAttribute('aria-label', 'Featured games');
    track.setAttribute('aria-roledescription', 'carousel');

    const cards: CarouselCard[] = [];
    section.append(header, track);

    let games: FeaturedGame[] = [];
    let centerIndex = 0;
    let timer: number | undefined;
    let timerDeadline = 0;
    let remainingDuration = autoplayDuration;
    let activePointerId: number | undefined;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerStartCard: CarouselCard | undefined;
    let shouldSuppressCardClick = false;
    let controller: AbortController | undefined;

    const visibleRange = (): number => (globalThis.innerWidth >= 1280 ? 2 : 1);

    const render = (): void => {
        const range = visibleRange();
        const cardsWithOffsets = cards.map((card) => {
            let offset =
                (card.gameIndex - centerIndex + games.length) % games.length;
            if (offset > games.length / 2) {
                offset -= games.length;
            }

            return { card, offset };
        });

        for (const { card, offset } of cardsWithOffsets) {
            const isVisible = Math.abs(offset) <= range;
            card.classList.toggle('carousel-card--visible', isVisible);
            card.classList.toggle('carousel-card--center', offset === 0);
            card.classList.toggle('carousel-card--left', offset === -1);
            card.classList.toggle('carousel-card--right', offset === 1);
            card.classList.toggle('carousel-card--far-left', offset === -2);
            card.classList.toggle('carousel-card--far-right', offset === 2);
            card.setAttribute('aria-hidden', String(!isVisible));
            card.tabIndex = isVisible ? 0 : -1;
        }

        cardsWithOffsets.sort((first, second) => first.offset - second.offset);
        track.append(...cardsWithOffsets.map(({ card }) => card));
    };

    const clearTimer = (): void => {
        if (timer === undefined) {
            return;
        }

        globalThis.clearTimeout(timer);
        timer = undefined;
    };

    const scheduleAutoplay = (delay: number): void => {
        clearTimer();
        if (games.length < 2) {
            return;
        }

        remainingDuration = delay;
        timerDeadline = globalThis.performance.now() + delay;
        timer = globalThis.setTimeout(() => {
            timer = undefined;
            centerIndex = (centerIndex + 1) % games.length;
            render();
            scheduleAutoplay(autoplayDuration);
        }, delay);
    };

    const pauseAutoplay = (): void => {
        if (timer === undefined) {
            return;
        }

        remainingDuration = Math.max(
            0,
            timerDeadline - globalThis.performance.now(),
        );
        clearTimer();
    };

    const resumeAutoplay = (shouldReset = false): void => {
        scheduleAutoplay(shouldReset ? autoplayDuration : remainingDuration);
    };

    const move = (direction: -1 | 1): void => {
        if (games.length < 2) {
            return;
        }

        centerIndex = (centerIndex + direction + games.length) % games.length;
        render();
        resumeAutoplay(true);
    };

    const showLoading = (): void => {
        track.setAttribute('aria-busy', 'true');
        const placeholders = Array.from({ length: 3 }, () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'carousel-skeleton';
            placeholder.setAttribute('aria-hidden', 'true');
            return placeholder;
        });
        track.replaceChildren(...placeholders);
    };

    const showError = (): void => {
        const state = document.createElement('div');
        state.className = 'carousel-state carousel-state--error';
        state.setAttribute('role', 'alert');

        const message = document.createElement('p');
        message.textContent = 'Featured games could not be loaded.';

        const retry = document.createElement('button');
        retry.className = 'carousel-state__retry';
        retry.type = 'button';
        retry.textContent = 'Try again';
        retry.addEventListener('click', () => {
            void loadFeaturedGames();
        });

        state.append(message, retry);
        track.replaceChildren(state);
    };

    const loadFeaturedGames = async (): Promise<void> => {
        controller?.abort();
        controller = new AbortController();
        const requestController = controller;
        clearTimer();
        showLoading();

        try {
            games = await fetchCollection(
                '/games?featured=true',
                isFeaturedGame,
                requestController.signal,
            );
            if (requestController.signal.aborted) {
                return;
            }

            track.removeAttribute('aria-busy');
            cards.splice(
                0,
                cards.length,
                ...games.map((game, index) =>
                    createGameCard(game, index, openGameDetails),
                ),
            );
            centerIndex = 0;

            if (games.length === 0) {
                track.removeAttribute('aria-busy');
                const empty = document.createElement('p');
                empty.className = 'carousel-state carousel-state--empty';
                empty.textContent =
                    'No featured games are available right now.';
                track.replaceChildren(empty);
                return;
            }

            previousButton.disabled = games.length < 2;
            nextButton.disabled = games.length < 2;
            track.replaceChildren(...cards);
            track.removeAttribute('aria-busy');
            render();
            scheduleAutoplay(autoplayDuration);
        } catch {
            if (requestController.signal.aborted) {
                return;
            }

            track.removeAttribute('aria-busy');
            showError();
            snackbar.show(
                'Unable to load featured games. Please try again.',
                'error',
            );
        }
    };

    previousButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));

    track.addEventListener('pointerdown', (event) => {
        if (activePointerId !== undefined || event.button !== 0) {
            return;
        }

        activePointerId = event.pointerId;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        pointerStartCard =
            event.target instanceof Element
                ? (event.target.closest<CarouselCard>('.carousel-card') ??
                  undefined)
                : undefined;
        pauseAutoplay();
    });

    const handlePointerUp = (event: PointerEvent): void => {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const deltaX = event.clientX - pointerStartX;
        const deltaY = event.clientY - pointerStartY;
        activePointerId = undefined;

        if (
            games.length > 1 &&
            Math.abs(deltaX) > swipeThreshold &&
            Math.abs(deltaX) > Math.abs(deltaY)
        ) {
            pointerStartCard = undefined;
            centerIndex =
                (centerIndex + (deltaX < 0 ? 1 : -1) + games.length) %
                games.length;
            render();
            shouldSuppressCardClick = true;
            globalThis.setTimeout(() => {
                shouldSuppressCardClick = false;
            }, 0);
            resumeAutoplay(true);
            return;
        }

        const clickedCard = pointerStartCard;
        pointerStartCard = undefined;
        resumeAutoplay();
        if (clickedCard) {
            openGameDetails(games[clickedCard.gameIndex].slug);
        }
    };

    const handlePointerCancel = (event: PointerEvent): void => {
        if (event.pointerId !== activePointerId) {
            return;
        }

        activePointerId = undefined;
        pointerStartCard = undefined;
        resumeAutoplay();
    };

    globalThis.addEventListener('pointerup', handlePointerUp);
    globalThis.addEventListener('pointercancel', handlePointerCancel);

    track.addEventListener(
        'click',
        (event) => {
            if (!shouldSuppressCardClick) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        },
        { capture: true },
    );

    section.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            move(-1);
        } else if (event.key === 'ArrowRight') {
            move(1);
        }
    });

    globalThis.addEventListener('resize', render);

    section.destroy = (): void => {
        clearTimer();
        controller?.abort();
        globalThis.removeEventListener('resize', render);
        globalThis.removeEventListener('pointerup', handlePointerUp);
        globalThis.removeEventListener('pointercancel', handlePointerCancel);
    };

    void loadFeaturedGames();
    return section;
};
