import './game-details.scss';
import { API_BASE_URL } from '../../shared/api';
import type { Snackbar } from '../../shared/snackbar';

type GameDetails = {
    slug: string;
    name: string;
    heroImage: string;
    rating: number;
    likesCount: number;
    isLikedByCurrentUser: boolean;
    fullDescription: string;
    specs: {
        genre: string;
        players: string;
        duration: string;
        price: string;
    };
    topRecords: {
        position: number;
        playerName: string;
        score: number;
        achievedAt: string;
    }[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const isGameDetails = (value: unknown): value is GameDetails =>
    isRecord(value) &&
    isRecord(value.specs) &&
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.heroImage === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.likesCount === 'number' &&
    typeof value.isLikedByCurrentUser === 'boolean' &&
    typeof value.fullDescription === 'string' &&
    typeof value.specs.genre === 'string' &&
    typeof value.specs.players === 'string' &&
    typeof value.specs.duration === 'string' &&
    typeof value.specs.price === 'string' &&
    Array.isArray(value.topRecords) &&
    value.topRecords.every(
        (record: unknown) =>
            isRecord(record) &&
            typeof record.position === 'number' &&
            typeof record.playerName === 'string' &&
            typeof record.score === 'number' &&
            typeof record.achievedAt === 'string',
    );

const localHeroImages = import.meta.glob<string>(
    '../../pages/library/assets/*-hero.jpg',
    { eager: true, query: '?url', import: 'default' },
);
const localCardImages = import.meta.glob<string>(
    '../../pages/library/assets/*-card.jpg',
    { eager: true, query: '?url', import: 'default' },
);
const transitionDuration = 180;
const formatNumber = new Intl.NumberFormat('en');
const relativeTime = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
});

const formatRelativeTime = (dateValue: string): string => {
    const date = new Date(dateValue);
    const elapsedDays = Math.floor(
        (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return Number.isNaN(date.getTime())
        ? dateValue
        : relativeTime.format(elapsedDays, 'day');
};

export type GameDetailsDialog = {
    element: HTMLDialogElement;
    open: (gameSlug: string, userEmail?: string) => void;
};

const createSkeleton = (): HTMLElement => {
    const state = document.createElement('div');
    state.className = 'game-details__state game-details__state--loading';
    state.setAttribute('role', 'status');
    state.setAttribute('aria-label', 'Loading game details');
    state.innerHTML = `
        <span class="game-details__skeleton game-details__skeleton--title"></span>
        <span class="game-details__skeleton"></span>
        <span class="game-details__skeleton"></span>
        <span class="game-details__skeleton game-details__skeleton--short"></span>
        <span class="game-details__skeleton game-details__skeleton--block"></span>
    `;
    return state;
};

const createState = (
    variant: 'error' | 'empty',
    message: string,
    retry?: () => void,
): HTMLElement => {
    const state = document.createElement('div');
    state.className = `game-details__state game-details__state--${variant}`;
    state.setAttribute('role', variant === 'error' ? 'alert' : 'status');

    const title = document.createElement('h2');
    title.id = 'game-details-title';
    title.textContent =
        variant === 'error'
            ? 'Game details could not be loaded'
            : 'Game not found';

    const description = document.createElement('p');
    description.textContent = message;
    state.append(title, description);

    if (retry) {
        const retryButton = document.createElement('button');
        retryButton.className = 'game-details__retry';
        retryButton.type = 'button';
        retryButton.textContent = 'Try again';
        retryButton.addEventListener('click', retry);
        state.append(retryButton);
    }

    return state;
};

const createInfoSection = (
    details: GameDetails,
    isFavorite: boolean,
): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'game-details__info';
    section.setAttribute('aria-labelledby', 'game-details-title');

    const eyebrow = document.createElement('div');
    eyebrow.className = 'game-details__eyebrow';
    eyebrow.textContent = details.specs.genre.toUpperCase();

    const title = document.createElement('h2');
    title.id = 'game-details-title';
    title.textContent = details.name;

    const description = document.createElement('p');
    description.textContent = details.fullDescription;

    const summary = document.createElement('div');
    summary.className = 'game-details__summary';
    const rating = document.createElement('span');
    rating.textContent = `★ ${details.rating.toFixed(1)}`;
    const likes = document.createElement('span');
    likes.textContent = `♡ ${new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(details.likesCount)}`;
    summary.append(rating, likes);

    const specs = document.createElement('ul');
    specs.className = 'game-details__specs';
    specs.setAttribute('aria-label', 'Game details');
    for (const [label, value] of [
        ['Genre', details.specs.genre],
        ['Players', details.specs.players],
        ['Duration', details.specs.duration],
        ['Price', details.specs.price],
    ]) {
        const item = document.createElement('li');
        const labelElement = document.createElement('span');
        labelElement.textContent = label;
        const valueElement = document.createElement('strong');
        valueElement.textContent = value;
        item.append(labelElement, valueElement);
        specs.append(item);
    }

    const actions = document.createElement('div');
    actions.className = 'game-details__actions';
    const play = document.createElement('button');
    play.className = 'game-details__play';
    play.type = 'button';
    play.textContent = 'Play Now';

    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'game-details__favorite';
    favoriteButton.type = 'button';
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
    favoriteButton.classList.toggle(
        'game-details__favorite--active',
        isFavorite,
    );
    favoriteButton.innerHTML = isFavorite
        ? '♥ <span>Added to Favorites</span>'
        : '♡ <span>Add to Favorites</span>';
    favoriteButton.addEventListener('click', () => {
        const isActive = favoriteButton.getAttribute('aria-pressed') === 'true';
        favoriteButton.setAttribute('aria-pressed', String(!isActive));
        favoriteButton.classList.toggle(
            'game-details__favorite--active',
            !isActive,
        );
        favoriteButton.innerHTML = isActive
            ? '♡ <span>Add to Favorites</span>'
            : '♥ <span>Added to Favorites</span>';
    });
    actions.append(play, favoriteButton);
    section.append(eyebrow, title, description, summary, specs, actions);
    return section;
};

const createRecordsSection = (
    records: GameDetails['topRecords'],
): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'game-details__records';
    section.setAttribute('aria-labelledby', 'game-details-records-title');

    const heading = document.createElement('h3');
    heading.id = 'game-details-records-title';
    heading.textContent = 'Top Records';

    const table = document.createElement('table');
    table.className = 'game-details__records-table';
    table.innerHTML = `
        <thead>
            <tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Score</th><th scope="col">Achieved</th></tr>
        </thead>
    `;
    const body = document.createElement('tbody');
    if (records.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No records yet.';
        row.append(cell);
        body.append(row);
    } else {
        for (const record of records) {
            const row = document.createElement('tr');
            const position = document.createElement('td');
            position.textContent = String(record.position);

            const player = document.createElement('td');
            const avatar = document.createElement('span');
            avatar.className = 'game-details__player-avatar';
            avatar.setAttribute('aria-hidden', 'true');
            avatar.textContent = record.playerName.slice(0, 1).toUpperCase();
            player.append(avatar, document.createTextNode(record.playerName));

            const score = document.createElement('td');
            score.textContent = `${formatNumber.format(record.score)} pts`;

            const achieved = document.createElement('td');
            achieved.textContent = formatRelativeTime(record.achievedAt);
            row.append(position, player, score, achieved);
            body.append(row);
        }
    }
    table.append(body);
    section.append(heading, table);
    return section;
};

const createCommentsSection = (): HTMLElement => {
    const comments = [
        {
            name: 'Alex',
            text: 'A lovely little adventure. The art and puzzles are so relaxing!',
            likes: 12,
        },
        {
            name: 'Sam',
            text: "Perfect for a cozy evening. I can't wait to explore more of the forest.",
            likes: 8,
        },
    ];
    const section = document.createElement('section');
    section.className = 'game-details__comments';
    section.setAttribute('aria-labelledby', 'game-details-comments-title');

    const heading = document.createElement('h3');
    heading.id = 'game-details-comments-title';
    heading.textContent = 'Comments';

    const form = document.createElement('form');
    form.className = 'game-details__comment-form';
    form.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    const label = document.createElement('label');
    label.className = 'game-details__comment-label';
    label.htmlFor = 'game-details-comment';
    label.textContent = 'Share your thoughts';

    const compose = document.createElement('div');
    compose.className = 'game-details__comment-compose';
    const input = document.createElement('textarea');
    input.id = 'game-details-comment';
    input.className = 'game-details__comment-input';
    input.rows = 1;
    input.placeholder = 'Write a comment...';
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        const maxHeight = 88;
        input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
        input.style.overflowY =
            input.scrollHeight > maxHeight ? 'auto' : 'hidden';
    });

    const submit = document.createElement('button');
    submit.className = 'game-details__comment-submit';
    submit.type = 'submit';
    submit.setAttribute('aria-label', 'Submit comment');
    submit.textContent = '➤';
    compose.append(input, submit);
    form.append(label, compose);

    const list = document.createElement('ul');
    list.className = 'game-details__comment-list';
    list.setAttribute('aria-label', 'Player comments');
    for (const comment of comments) {
        const item = document.createElement('li');
        const article = document.createElement('article');
        article.className = 'game-details__comment';

        const avatar = document.createElement('div');
        avatar.className = 'game-details__comment-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = comment.name.slice(0, 1);

        const body = document.createElement('div');
        body.className = 'game-details__comment-body';
        const name = document.createElement('h4');
        name.textContent = comment.name;
        const text = document.createElement('p');
        text.textContent = comment.text;

        const like = document.createElement('button');
        like.className = 'game-details__like';
        like.type = 'button';
        like.setAttribute('aria-pressed', 'false');
        like.setAttribute('aria-label', `Like ${comment.name}'s comment`);
        const icon = document.createElement('span');
        icon.className = 'game-details__like-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '♡';
        const count = document.createElement('span');
        count.textContent = String(comment.likes);
        like.append(icon, count);
        like.addEventListener('click', () => {
            const isActive = like.getAttribute('aria-pressed') === 'true';
            like.setAttribute('aria-pressed', String(!isActive));
            like.classList.toggle('game-details__like--active', !isActive);
            icon.textContent = isActive ? '♡' : '♥';
            count.textContent = String(comment.likes + (isActive ? 0 : 1));
        });

        body.append(name, text, like);
        article.append(avatar, body);
        item.append(article);
        list.append(item);
    }

    section.append(heading, form, list);
    return section;
};

const renderDetails = (
    body: HTMLElement,
    heroImage: HTMLImageElement,
    details: GameDetails,
    dialog: HTMLDialogElement,
): void => {
    const localImage =
        localHeroImages[`../../pages/library/assets/${details.slug}-hero.jpg`];
    const localCardImage =
        localCardImages[`../../pages/library/assets/${details.slug}-card.jpg`];
    const fallbackImage = localImage ?? localCardImage;
    let hasTriedLocalImage = false;
    heroImage.hidden = false;
    heroImage.alt = `${details.name} game cover`;
    const handleImageError = (): void => {
        if (fallbackImage && !hasTriedLocalImage) {
            hasTriedLocalImage = true;
            heroImage.addEventListener('error', handleImageError, {
                once: true,
            });
            heroImage.src = fallbackImage;
            return;
        }
        heroImage.hidden = true;
    };
    heroImage.addEventListener('error', handleImageError, { once: true });
    heroImage.src = new URL(details.heroImage, API_BASE_URL).href;

    body.setAttribute('aria-busy', 'false');
    dialog.removeAttribute('aria-label');
    dialog.setAttribute('aria-labelledby', 'game-details-title');
    body.replaceChildren(
        createInfoSection(details, details.isLikedByCurrentUser),
        createRecordsSection(details.topRecords),
        createCommentsSection(),
    );
};

export const createGameDetailsDialog = (
    snackbar: Snackbar,
): GameDetailsDialog => {
    const dialog = document.createElement('dialog');
    dialog.className = 'game-details';
    dialog.setAttribute('aria-label', 'Game details');
    dialog.innerHTML = `
        <div class="game-details__content">
            <header class="game-details__hero">
                <img class="game-details__image" alt="" hidden />
                <button class="game-details__close" type="button" aria-label="Close game details">×</button>
            </header>
            <div class="game-details__body" aria-live="polite"></div>
        </div>
    `;

    const body = dialog.querySelector<HTMLElement>('.game-details__body');
    const heroImage = dialog.querySelector<HTMLImageElement>(
        '.game-details__image',
    );
    let closeTimer: number | undefined;
    let requestController: AbortController | undefined;
    let currentRequest: (() => void) | undefined;

    const closeDialog = (): void => {
        if (
            !dialog.open ||
            dialog.classList.contains('game-details--closing')
        ) {
            return;
        }

        requestController?.abort();
        dialog.classList.remove('game-details--visible');
        dialog.classList.add('game-details--closing');
        closeTimer = globalThis.setTimeout(() => {
            dialog.close();
            dialog.classList.remove('game-details--closing');
            closeTimer = undefined;
            document.body.classList.remove('game-details-open');
        }, transitionDuration);
    };

    dialog
        .querySelector<HTMLButtonElement>('.game-details__close')
        ?.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            closeDialog();
        }
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeDialog();
    });
    dialog.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !dialog.open) {
            return;
        }

        event.preventDefault();
        closeDialog();
    });
    dialog.addEventListener('close', () => {
        document.body.classList.remove('game-details-open');
    });

    const loadDetails = async (
        gameSlug: string,
        userEmail: string | undefined,
    ): Promise<void> => {
        if (!body || !heroImage) {
            return;
        }

        requestController?.abort();
        requestController = new AbortController();
        const controller = requestController;
        body.setAttribute('aria-busy', 'true');
        body.replaceChildren(createSkeleton());
        dialog.removeAttribute('aria-labelledby');
        dialog.setAttribute('aria-label', 'Game details');
        heroImage.hidden = true;
        heroImage.removeAttribute('src');

        try {
            const query = new URLSearchParams();
            if (userEmail?.trim()) {
                query.set('userEmail', userEmail.trim());
            }
            const queryString = query.size > 0 ? `?${query.toString()}` : '';
            const response = await fetch(
                `${API_BASE_URL}/games/${encodeURIComponent(gameSlug)}${queryString}`,
                { signal: controller.signal },
            );
            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`,
                );
            }

            const payload: unknown = await response.json();
            if (!isRecord(payload) || !('data' in payload)) {
                throw new Error('The server returned an invalid response.');
            }
            if (controller.signal.aborted) {
                return;
            }
            if (payload.data === null) {
                body.setAttribute('aria-busy', 'false');
                dialog.removeAttribute('aria-label');
                dialog.setAttribute('aria-labelledby', 'game-details-title');
                body.replaceChildren(
                    createState('empty', 'This game could not be found.'),
                );
                return;
            }
            if (!isGameDetails(payload.data)) {
                throw new Error('The server returned invalid game details.');
            }
            renderDetails(body, heroImage, payload.data, dialog);
        } catch {
            if (controller.signal.aborted) {
                return;
            }

            body.setAttribute('aria-busy', 'false');
            dialog.removeAttribute('aria-label');
            dialog.setAttribute('aria-labelledby', 'game-details-title');
            body.replaceChildren(
                createState(
                    'error',
                    'Please check your connection and try again.',
                    () => currentRequest?.(),
                ),
            );
            snackbar.show(
                'Unable to load game details. Please try again.',
                'error',
            );
        }
    };

    return {
        element: dialog,
        open: (gameSlug, userEmail): void => {
            if (!gameSlug) {
                throw new Error(
                    'A game slug is required to open game details.',
                );
            }

            if (closeTimer !== undefined) {
                globalThis.clearTimeout(closeTimer);
                closeTimer = undefined;
            }
            currentRequest = () => {
                void loadDetails(gameSlug, userEmail);
            };
            dialog.classList.remove('game-details--closing');
            if (!dialog.open) {
                dialog.showModal();
                document.body.classList.add('game-details-open');
            }
            globalThis.requestAnimationFrame(() => {
                dialog.classList.add('game-details--visible');
            });
            void loadDetails(gameSlug, userEmail);
        },
    };
};
