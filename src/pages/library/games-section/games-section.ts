import './games-section.scss';

const categories = [
    'All Games',
    'Puzzle',
    'Card',
    'Match',
    'Farm',
    'Strategy',
    'Arcade',
];

const sortOptions = [
    'Recommended',
    'Most Popular',
    'Newest',
    'Top Rated',
    'A–Z',
];

export const createLibraryGamesSection = (): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'library-games';
    section.setAttribute('aria-labelledby', 'library-games-title');

    const headingRow = document.createElement('div');
    headingRow.className = 'library-games__heading-row';

    const title = document.createElement('h1');
    title.className = 'library-games__title';
    title.id = 'library-games-title';
    title.textContent = 'Game Library';

    const sortControl = document.createElement('div');
    sortControl.className = 'library-sort';

    const sortLabel = document.createElement('span');
    sortLabel.className = 'library-sort__label';
    sortLabel.textContent = 'Sort by';

    const sort = document.createElement('div');
    sort.className = 'library-sort__select';

    const sortButton = document.createElement('button');
    sortButton.className = 'library-sort__trigger';
    sortButton.type = 'button';
    sortButton.setAttribute('aria-haspopup', 'listbox');
    sortButton.setAttribute('aria-expanded', 'false');
    sortButton.setAttribute('aria-controls', 'library-sort-options');
    sortButton.setAttribute(
        'aria-label',
        `Sort games: ${sortOptions[0]}`,
    );

    const selectedSort = document.createElement('span');
    selectedSort.className = 'library-sort__value';
    selectedSort.textContent = sortOptions[0];

    const arrow = document.createElement('span');
    arrow.className = 'library-sort__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '⌄';
    sortButton.append(selectedSort, arrow);

    const options = document.createElement('div');
    options.className = 'library-sort__options';
    options.id = 'library-sort-options';
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', 'Sort games by');
    options.hidden = true;

    for (const [index, option] of sortOptions.entries()) {
        const optionButton = document.createElement('button');
        optionButton.className = 'library-sort__option';
        optionButton.type = 'button';
        optionButton.setAttribute('aria-pressed', String(index === 0));
        optionButton.classList.toggle(
            'library-sort__option--selected',
            index === 0,
        );
        optionButton.textContent = option;
        options.append(optionButton);
    }

    sort.append(sortButton, options);
    sortControl.append(sortLabel, sort);
    headingRow.append(title, sortControl);

    const categoryScroller = document.createElement('div');
    categoryScroller.className = 'library-games__category-scroller';
    categoryScroller.setAttribute('role', 'group');
    categoryScroller.setAttribute('aria-label', 'Filter games by category');

    const categoryList = document.createElement('div');
    categoryList.className = 'library-games__categories';
    categoryList.setAttribute('role', 'group');
    categoryList.setAttribute('aria-label', 'Game categories');

    for (const [index, category] of categories.entries()) {
        const chip = document.createElement('button');
        chip.className = 'library-games__chip';
        chip.type = 'button';
        chip.textContent = category;
        chip.setAttribute('aria-pressed', String(index === 0));
        chip.classList.toggle('library-games__chip--active', index === 0);
        categoryList.append(chip);
    }

    categoryScroller.append(categoryList);
    section.append(headingRow, categoryScroller);

    const closeSortOptions = (shouldReturnFocus: boolean): void => {
        options.hidden = true;
        sortButton.setAttribute('aria-expanded', 'false');
        if (shouldReturnFocus) {
            sortButton.focus();
        }
    };

    section.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const chip = target.closest<HTMLButtonElement>(
            '.library-games__chip',
        );
        if (chip) {
            for (const categoryChip of categoryList.querySelectorAll<HTMLButtonElement>(
                '.library-games__chip',
            )) {
                const isActive = categoryChip === chip;
                categoryChip.classList.toggle(
                    'library-games__chip--active',
                    isActive,
                );
                categoryChip.setAttribute('aria-pressed', String(isActive));
            }
            return;
        }

        if (target.closest('.library-sort__trigger')) {
            const isExpanded =
                sortButton.getAttribute('aria-expanded') === 'true';
            options.hidden = isExpanded;
            sortButton.setAttribute('aria-expanded', String(!isExpanded));
            return;
        }

        const option = target.closest<HTMLButtonElement>(
            '.library-sort__option',
        );
        if (!option) {
            return;
        }

        for (const sortOption of options.querySelectorAll<HTMLButtonElement>(
            '.library-sort__option',
        )) {
            const isSelected = sortOption === option;
            sortOption.setAttribute('aria-pressed', String(isSelected));
            sortOption.classList.toggle(
                'library-sort__option--selected',
                isSelected,
            );
        }
        selectedSort.textContent = option.textContent ?? '';
        sortButton.setAttribute(
            'aria-label',
            `Sort games: ${selectedSort.textContent}`,
        );
        closeSortOptions(true);
    });

    document.addEventListener('click', (event) => {
        if (
            !options.hidden &&
            event.target instanceof Node &&
            !sort.contains(event.target)
        ) {
            closeSortOptions(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !options.hidden) {
            closeSortOptions(true);
        }
    });

    return section;
};
