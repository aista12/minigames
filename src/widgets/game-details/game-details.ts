import './game-details.scss';

const images = import.meta.glob<string>(
    '../../pages/library/assets/tukoni-forest-keepers-hero.jpg',
    { eager: true, query: '?url', import: 'default' },
);

const heroImage = Object.values(images)[0];

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
            <div class="game-details__hero">
                <img class="game-details__image" src="${heroImage}" alt="Tukoni in a magical forest" />
                <button class="game-details__close" type="button" aria-label="Close game details">×</button>
            </div>
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
        </div>
    `;

    const favoriteButton = dialog.querySelector<HTMLButtonElement>(
        '.game-details__favorite',
    );
    const resetDialog = (): void => {
        favoriteButton?.setAttribute('aria-pressed', 'false');
        favoriteButton?.classList.remove('game-details__favorite--active');
        if (favoriteButton) {
            favoriteButton.innerHTML = '♡ <span>Add to Favorites</span>';
        }
        document.body.classList.remove('game-details-open');
    };

    const closeDialog = (): void => {
        if (dialog.open) {
            dialog.close();
        }

        resetDialog();
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
        if (event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        closeDialog();
    });
    dialog.addEventListener('close', resetDialog);

    return {
        element: dialog,
        open: () => {
            if (dialog.open) {
                return;
            }

            resetDialog();
            document.body.classList.add('game-details-open');
            dialog.showModal();
        },
    };
};
