import './game-details.scss';

const images = import.meta.glob<string>(
    '../../pages/library/assets/tukoni-forest-keepers-hero.jpg',
    { eager: true, query: '?url', import: 'default' },
);

const heroImage = Object.values(images)[0];
const transitionDuration = 180;

export type GameDetailsDialog = {
    element: HTMLDialogElement;
    open: () => void;
};

export const createGameDetailsDialog = (): GameDetailsDialog => {
    const dialog = document.createElement('dialog');
    dialog.className = 'game-details';
    dialog.setAttribute('aria-labelledby', 'game-details-title');
    dialog.innerHTML = `
        <div class="game-details__content">
            <header class="game-details__hero">
                <img class="game-details__image" src="${heroImage}" alt="Tukoni: Forest Keepers game cover" />
                <button class="game-details__close" type="button" aria-label="Close game details">×</button>
            </header>
            <section class="game-details__info" aria-labelledby="game-details-title">
                <div class="game-details__eyebrow">PUZZLE ADVENTURE</div>
                <h2 id="game-details-title">Tukoni: Forest Keepers</h2>
                <p>Tukoni: Forest Keepers — a cozy hand-drawn puzzle-adventure. You are Traveller, a little forest spirit on an important mission. Wander storybook meadows, visit mushroom villages, meet adorable inhabitants, solve gentle hand-crafted puzzles, brew herbal teas and help the Tukoni forest prepare peacefully for the coming winter.</p>
                <ul class="game-details__specs" aria-label="Game details">
                    <li><span>Genre</span><strong>Puzzle</strong></li>
                    <li><span>Players</span><strong>Solo</strong></li>
                    <li><span>Duration</span><strong>40–90 min</strong></li>
                    <li><span>Price</span><strong>Free</strong></li>
                </ul>
                <div class="game-details__actions">
                    <button class="game-details__play" type="button">Play Now</button>
                    <button class="game-details__favorite" type="button" aria-pressed="false">♡ <span>Add to Favorites</span></button>
                </div>
            </section>
            <section class="game-details__records" aria-labelledby="game-details-records-title">
                <h3 id="game-details-records-title">Top Records</h3>
                <table class="game-details__records-table">
                    <thead>
                        <tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Best time</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td><span class="game-details__player-avatar" aria-hidden="true">L</span>Luna</td><td>02:14</td></tr>
                        <tr><td>2</td><td><span class="game-details__player-avatar" aria-hidden="true">M</span>Mossy</td><td>02:38</td></tr>
                        <tr><td>3</td><td><span class="game-details__player-avatar" aria-hidden="true">F</span>Fern</td><td>03:05</td></tr>
                    </tbody>
                </table>
            </section>
            <section class="game-details__comments" aria-labelledby="game-details-comments-title">
                <h3 id="game-details-comments-title">Comments</h3>
                <form class="game-details__comment-form">
                    <label class="game-details__comment-label" for="game-details-comment">Share your thoughts</label>
                    <div class="game-details__comment-compose">
                        <textarea id="game-details-comment" class="game-details__comment-input" rows="1" placeholder="Write a comment..." aria-label="Write a comment"></textarea>
                        <button class="game-details__comment-submit" type="submit">Submit</button>
                    </div>
                </form>
                <ul class="game-details__comment-list" aria-label="Player comments">
                    <li>
                        <article class="game-details__comment">
                            <div class="game-details__comment-avatar" aria-hidden="true">A</div>
                            <div class="game-details__comment-body">
                                <h4>Alex</h4>
                                <p>A lovely little adventure. The art and puzzles are so relaxing!</p>
                                <button class="game-details__like" type="button" aria-pressed="false" aria-label="Like Alex's comment"><span class="game-details__like-icon" aria-hidden="true">♡</span><span>12</span></button>
                            </div>
                        </article>
                    </li>
                    <li>
                        <article class="game-details__comment">
                            <div class="game-details__comment-avatar" aria-hidden="true">S</div>
                            <div class="game-details__comment-body">
                                <h4>Sam</h4>
                                <p>Perfect for a cozy evening. I can't wait to explore more of the forest.</p>
                                <button class="game-details__like" type="button" aria-pressed="false" aria-label="Like Sam's comment"><span class="game-details__like-icon" aria-hidden="true">♡</span><span>8</span></button>
                            </div>
                        </article>
                    </li>
                </ul>
            </section>
        </div>
    `;

    const favoriteButton = dialog.querySelector<HTMLButtonElement>(
        '.game-details__favorite',
    );
    const commentInput = dialog.querySelector<HTMLTextAreaElement>(
        '.game-details__comment-input',
    );
    let closeTimer: number | undefined;

    const resetDialog = (): void => {
        favoriteButton?.setAttribute('aria-pressed', 'false');
        favoriteButton?.classList.remove('game-details__favorite--active');
        if (favoriteButton) {
            favoriteButton.innerHTML = '♡ <span>Add to Favorites</span>';
        }
        for (const likeButton of dialog.querySelectorAll<HTMLButtonElement>(
            '.game-details__like',
        )) {
            likeButton.setAttribute('aria-pressed', 'false');
            likeButton.classList.remove('game-details__like--active');
            const icon = likeButton.querySelector('.game-details__like-icon');
            if (icon) {
                icon.textContent = '♡';
            }
        }
        if (commentInput) {
            commentInput.value = '';
            commentInput.style.height = '';
            commentInput.style.overflowY = '';
        }
        document.body.classList.remove('game-details-open');
    };

    const closeDialog = (): void => {
        if (
            !dialog.open ||
            dialog.classList.contains('game-details--closing')
        ) {
            return;
        }

        dialog.classList.remove('game-details--visible');
        dialog.classList.add('game-details--closing');
        closeTimer = globalThis.setTimeout(() => {
            dialog.close();
            dialog.classList.remove('game-details--closing');
            closeTimer = undefined;
            resetDialog();
        }, transitionDuration);
    };

    dialog
        .querySelector<HTMLButtonElement>('.game-details__close')
        ?.addEventListener('click', closeDialog);

    favoriteButton?.addEventListener('click', () => {
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

    commentInput?.addEventListener('input', () => {
        commentInput.style.height = 'auto';
        const maxHeight = 88;
        commentInput.style.height = `${Math.min(commentInput.scrollHeight, maxHeight)}px`;
        commentInput.style.overflowY =
            commentInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
    });

    dialog.querySelector('form')?.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    for (const likeButton of dialog.querySelectorAll<HTMLButtonElement>(
        '.game-details__like',
    )) {
        likeButton.addEventListener('click', () => {
            const isActive = likeButton.getAttribute('aria-pressed') === 'true';
            likeButton.setAttribute('aria-pressed', String(!isActive));
            likeButton.classList.toggle(
                'game-details__like--active',
                !isActive,
            );
            const icon = likeButton.querySelector('.game-details__like-icon');
            if (icon) {
                icon.textContent = isActive ? '♡' : '♥';
            }
        });
    }

    dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) {
            return;
        }

        closeDialog();
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
    dialog.addEventListener('close', resetDialog);

    return {
        element: dialog,
        open: () => {
            if (
                dialog.open &&
                !dialog.classList.contains('game-details--closing')
            ) {
                return;
            }

            if (closeTimer !== undefined) {
                globalThis.clearTimeout(closeTimer);
                closeTimer = undefined;
            }

            dialog.classList.remove('game-details--closing');
            resetDialog();
            if (!dialog.open) {
                dialog.showModal();
                document.body.classList.add('game-details-open');
            }
            globalThis.requestAnimationFrame(() => {
                dialog.classList.add('game-details--visible');
            });
        },
    };
};
