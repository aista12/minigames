import './leaderboard.scss';
import { fetchCollection } from '../../../shared/api';
import type { Snackbar } from '../../../shared/snackbar';

type Player = {
    rank: number;
    playerName: string;
    gamesPlayed: number;
    totalScore: number;
    streakDays: number;
    favoriteGameName: string;
};

const isPlayer = (value: unknown): value is Player => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const player = value as Record<string, unknown>;
    return (
        typeof player.rank === 'number' &&
        typeof player.playerName === 'string' &&
        typeof player.gamesPlayed === 'number' &&
        typeof player.totalScore === 'number' &&
        typeof player.streakDays === 'number' &&
        typeof player.favoriteGameName === 'string'
    );
};

const createCell = (
    content: string,
    className: string,
): HTMLTableCellElement => {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = content;
    return cell;
};

const createPlayerCell = (player: Player): HTMLTableCellElement => {
    const cell = document.createElement('td');
    cell.className = 'leaderboard__player-cell';

    const avatar = document.createElement('span');
    avatar.className = 'leaderboard__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = player.playerName.slice(0, 2).toUpperCase();

    const name = document.createElement('span');
    name.className = 'leaderboard__player-name';
    name.textContent = player.playerName;

    cell.append(avatar, name);
    return cell;
};

const createPlayerRow = (player: Player): HTMLTableRowElement => {
    const row = document.createElement('tr');
    row.className = `leaderboard__row leaderboard__row--${player.rank}`;
    row.append(
        createCell(`#${player.rank}`, 'leaderboard__rank'),
        createPlayerCell(player),
        createCell(String(player.gamesPlayed), 'leaderboard__games'),
    );

    const score = createCell('', 'leaderboard__score');
    const desktopScore = document.createElement('span');
    desktopScore.className = 'leaderboard__desktop-score';
    desktopScore.textContent = new Intl.NumberFormat('en').format(
        player.totalScore,
    );
    const mobileScore = document.createElement('span');
    mobileScore.className = 'leaderboard__mobile-score';
    mobileScore.textContent = new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(player.totalScore);
    score.append(desktopScore, mobileScore);
    row.append(
        score,
        createCell(`🔥 ${player.streakDays}d`, 'leaderboard__streak'),
        createCell(player.favoriteGameName, 'leaderboard__favorite'),
    );

    return row;
};

const createTable = (
    players: Player[],
    isLoading: boolean,
): HTMLTableElement => {
    const table = document.createElement('table');
    table.className = 'leaderboard__table';
    if (isLoading) {
        table.setAttribute('aria-busy', 'true');
    }

    const caption = document.createElement('caption');
    caption.className = 'visually-hidden';
    caption.textContent = 'Top players leaderboard';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        ['Rank', 'leaderboard__rank'],
        ['Player', 'leaderboard__player-cell'],
        ['Games Played', 'leaderboard__games'],
        ['Total Score', 'leaderboard__score'],
        ['Streak', 'leaderboard__streak'],
        ['Favorite Game', 'leaderboard__favorite'],
    ];

    for (const [label, className] of headers) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.className = className;
        if (label === 'Total Score') {
            const desktopLabel = document.createElement('span');
            desktopLabel.className = 'leaderboard__desktop-label';
            desktopLabel.textContent = label;
            const mobileLabel = document.createElement('span');
            mobileLabel.className = 'leaderboard__mobile-label';
            mobileLabel.textContent = 'Score';
            cell.append(desktopLabel, mobileLabel);
        } else {
            cell.textContent = label;
        }
        headerRow.append(cell);
    }

    const body = document.createElement('tbody');
    if (isLoading) {
        for (let index = 0; index < 3; index += 1) {
            const row = document.createElement('tr');
            row.className = 'leaderboard__skeleton-row';
            for (let column = 0; column < headers.length; column += 1) {
                const cell = document.createElement('td');
                const placeholder = document.createElement('span');
                placeholder.className = 'leaderboard__skeleton';
                placeholder.setAttribute('aria-hidden', 'true');
                cell.append(placeholder);
                row.append(cell);
            }
            body.append(row);
        }
    } else {
        for (const player of players) {
            body.append(createPlayerRow(player));
        }
    }

    thead.append(headerRow);
    table.append(caption, thead, body);
    return table;
};

export type InteractiveLeaderboard = HTMLElement & { destroy: () => void };

export const createLeaderboard = (
    snackbar: Snackbar,
): InteractiveLeaderboard => {
    const section = document.createElement('section') as InteractiveLeaderboard;
    section.className = 'leaderboard';
    section.setAttribute('aria-labelledby', 'leaderboard-title');

    const heading = document.createElement('header');
    heading.className = 'leaderboard__header';

    const accent = document.createElement('span');
    accent.className = 'leaderboard__accent';
    accent.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    title.className = 'leaderboard__title';
    title.id = 'leaderboard-title';
    title.textContent = 'Top Players';
    heading.append(accent, title);

    const content = document.createElement('div');
    content.className = 'leaderboard__content';
    content.setAttribute('aria-live', 'polite');
    section.append(heading, content);

    let controller: AbortController | undefined;
    section.destroy = (): void => {
        controller?.abort();
    };

    const loadLeaderboard = async (): Promise<void> => {
        controller?.abort();
        controller = new AbortController();
        const requestController = controller;
        content.replaceChildren(createTable([], true));

        try {
            const players = await fetchCollection(
                '/leaderboard',
                isPlayer,
                requestController.signal,
            );
            if (requestController.signal.aborted) {
                return;
            }

            if (players.length === 0) {
                const empty = document.createElement('p');
                empty.className =
                    'leaderboard__state leaderboard__state--empty';
                empty.textContent = 'No player scores are available right now.';
                content.replaceChildren(empty);
                return;
            }

            content.replaceChildren(createTable(players, false));
        } catch {
            if (requestController.signal.aborted) {
                return;
            }

            const state = document.createElement('div');
            state.className = 'leaderboard__state leaderboard__state--error';
            state.setAttribute('role', 'alert');

            const message = document.createElement('p');
            message.textContent = 'The leaderboard could not be loaded.';

            const retry = document.createElement('button');
            retry.className = 'leaderboard__retry';
            retry.type = 'button';
            retry.textContent = 'Try again';
            retry.addEventListener('click', () => {
                void loadLeaderboard();
            });

            state.append(message, retry);
            content.replaceChildren(state);
            snackbar.show(
                'Unable to load the leaderboard. Please try again.',
                'error',
            );
        }
    };

    void loadLeaderboard();
    return section;
};
