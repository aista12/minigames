import './leaderboard.scss';

type Player = {
    initials: string;
    name: string;
    games: string;
    score: string;
    mobileScore: string;
    streak: string;
    favoriteGame: string;
};

const players: Player[] = [
    {
        initials: 'AP',
        name: 'Alex_Pro99',
        games: '142',
        score: '94,250',
        mobileScore: '94.2K',
        streak: '12',
        favoriteGame: 'Heartopia',
    },
    {
        initials: 'CG',
        name: 'CozyGamer_x',
        games: '118',
        score: '81,400',
        mobileScore: '81.4K',
        streak: '8',
        favoriteGame: 'Cat Mail Co.',
    },
    {
        initials: 'MM',
        name: 'MatchMaster',
        games: '98',
        score: '72,110',
        mobileScore: '72.1K',
        streak: '5',
        favoriteGame: 'Tiny Glade',
    },
    {
        initials: 'BP',
        name: 'BubblePop',
        games: '87',
        score: '65,900',
        mobileScore: '65.9K',
        streak: '3',
        favoriteGame: 'Whisper of the House',
    },
    {
        initials: 'SG',
        name: 'SudokuGod',
        games: '74',
        score: '59,320',
        mobileScore: '59.3K',
        streak: '2',
        favoriteGame: 'Cat Chess',
    },
];

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
    avatar.textContent = player.initials;

    const name = document.createElement('span');
    name.className = 'leaderboard__player-name';
    name.textContent = player.name;

    cell.append(avatar, name);
    return cell;
};

const createPlayerRow = (
    player: Player,
    index: number,
): HTMLTableRowElement => {
    const row = document.createElement('tr');
    row.className = `leaderboard__row leaderboard__row--${index + 1}`;
    row.append(
        createCell(`#${index + 1}`, 'leaderboard__rank'),
        createPlayerCell(player),
        createCell(player.games, 'leaderboard__games'),
    );

    const score = createCell('', 'leaderboard__score');
    const desktopScore = document.createElement('span');
    desktopScore.className = 'leaderboard__desktop-score';
    desktopScore.textContent = player.score;
    const mobileScore = document.createElement('span');
    mobileScore.className = 'leaderboard__mobile-score';
    mobileScore.textContent = player.mobileScore;
    score.append(desktopScore, mobileScore);
    row.append(
        score,
        createCell(`🔥 ${player.streak}d`, 'leaderboard__streak'),
    );
    row.append(createCell(player.favoriteGame, 'leaderboard__favorite'));

    return row;
};

export const createLeaderboard = (): HTMLElement => {
    const section = document.createElement('section');
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

    const table = document.createElement('table');
    table.className = 'leaderboard__table';

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

    thead.append(headerRow);

    const body = document.createElement('tbody');
    for (const [index, player] of players.entries()) {
        body.append(createPlayerRow(player, index));
    }

    table.append(caption, thead, body);
    section.append(heading, table);
    return section;
};
