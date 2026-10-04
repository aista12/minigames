import './games-section.scss';
import { fetchCollection } from '../../../shared/api';
import type { Snackbar } from '../../../shared/snackbar';

type Category = {
    slug: string;
    label: string;
    isDefault: boolean;
};

const allowedCategorySlugs = new Set([
    'all',
    'puzzle',
    'card',
    'match',
    'farm',
    'strategy',
    'arcade',
]);

const isCategory = (value: unknown): value is Category => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const category = value as Record<string, unknown>;
    return (
        typeof category.slug === 'string' &&
        allowedCategorySlugs.has(category.slug) &&
        typeof category.label === 'string' &&
        typeof category.isDefault === 'boolean'
    );
};

const sortOptions = [
    { label: 'Recommended', value: 'rating-desc' },
    { label: 'Lowest Rated', value: 'rating-asc' },
    { label: 'Name: A–Z', value: 'name-asc' },
    { label: 'Name: Z–A', value: 'name-desc' },
];

export type InteractiveLibraryGamesSection = HTMLElement & {
    load: () => void;
    setState: (category: string, sort: string) => void;
    destroy: () => void;
};

export const createLibraryGamesSection = (
    onFilterChange: (category: string, sort: string) => void,
    snackbar: Snackbar,
): InteractiveLibraryGamesSection => {
    const section = document.createElement(
        'section',
    ) as InteractiveLibraryGamesSection;
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
        `Sort games: ${sortOptions[0].label}`,
    );

    const selectedSort = document.createElement('span');
    selectedSort.className = 'library-sort__value';
    selectedSort.textContent = sortOptions[0].label;

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
        optionButton.textContent = option.label;
        optionButton.dataset.sort = option.value;
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

    const categoryState = document.createElement('div');
    categoryState.className = 'library-games__category-state';

    categoryScroller.append(categoryList);
    section.append(headingRow, categoryScroller);

    let categoriesController: AbortController | undefined;
    let selectedCategory = 'all';
    let selectedSortValue = 'rating-desc';
    let categories: Category[] = [];

    const closeSortOptions = (shouldReturnFocus: boolean): void => {
        options.hidden = true;
        sortButton.setAttribute('aria-expanded', 'false');
        if (shouldReturnFocus) {
            sortButton.focus();
        }
    };

    const renderCategoryLoading = (): void => {
        categoryScroller.setAttribute('aria-busy', 'true');
        categoryState.className =
            'library-games__category-state library-games__category-state--loading';
        categoryState.setAttribute('aria-label', 'Loading game categories');
        categoryState.replaceChildren();
        for (let index = 0; index < 7; index += 1) {
            const chip = document.createElement('span');
            chip.className = 'library-games__chip-skeleton';
            chip.setAttribute('aria-hidden', 'true');
            categoryState.append(chip);
        }
        categoryScroller.replaceChildren(categoryState);
    };

    const renderCategoryError = (): void => {
        categoryScroller.removeAttribute('aria-busy');
        categoryState.className =
            'library-games__category-state library-games__category-state--error';
        categoryState.removeAttribute('aria-label');

        const message = document.createElement('p');
        message.textContent = 'Game categories could not be loaded.';

        const retry = document.createElement('button');
        retry.className = 'library-games__category-retry';
        retry.type = 'button';
        retry.textContent = 'Try again';
        retry.addEventListener('click', () => {
            void loadCategories();
        });

        categoryState.replaceChildren(message, retry);
        categoryScroller.replaceChildren(categoryState);
    };

    const renderCategories = (): void => {
        categoryScroller.removeAttribute('aria-busy');
        categoryList.replaceChildren();
        categoryScroller.replaceChildren(categoryList);

        for (const category of categories) {
            const chip = document.createElement('button');
            const isActive = category.slug === selectedCategory;
            chip.className = 'library-games__chip';
            chip.type = 'button';
            chip.textContent = category.label;
            chip.dataset.category = category.slug;
            chip.setAttribute('aria-pressed', String(isActive));
            chip.classList.toggle('library-games__chip--active', isActive);
            categoryList.append(chip);
        }
    };

    const renderSort = (): void => {
        const selectedOption = sortOptions.find(
            (option) => option.value === selectedSortValue,
        );
        if (!selectedOption) {
            throw new Error(`Unsupported sort option: ${selectedSortValue}`);
        }
        selectedSort.textContent = selectedOption.label;
        sortButton.setAttribute(
            'aria-label',
            `Sort games: ${selectedOption.label}`,
        );
        for (const optionButton of options.querySelectorAll<HTMLButtonElement>(
            '.library-sort__option',
        )) {
            const isSelected = optionButton.dataset.sort === selectedSortValue;
            optionButton.setAttribute('aria-pressed', String(isSelected));
            optionButton.classList.toggle(
                'library-sort__option--selected',
                isSelected,
            );
        }
    };

    section.setState = (category, sortValue): void => {
        selectedCategory = category;
        selectedSortValue = sortValue;
        renderCategories();
        renderSort();
    };

    section.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const chip = target.closest<HTMLButtonElement>('.library-games__chip');
        if (chip?.dataset.category) {
            if (chip.dataset.category === selectedCategory) {
                return;
            }

            selectedCategory = chip.dataset.category;
            renderCategories();
            onFilterChange(selectedCategory, selectedSortValue);
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

        const nextSort = option.dataset.sort;
        if (!nextSort || nextSort === selectedSortValue) {
            closeSortOptions(true);
            return;
        }

        selectedSortValue = nextSort;
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
        onFilterChange(selectedCategory, selectedSortValue);
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

    section.load = (): void => {
        void loadCategories();
    };
    section.destroy = (): void => {
        categoriesController?.abort();
    };

    async function loadCategories(): Promise<void> {
        categoriesController?.abort();
        categoriesController = new AbortController();
        const requestController = categoriesController;
        renderCategoryLoading();

        try {
            const response = await fetchCollection(
                '/categories',
                isCategory,
                requestController.signal,
            );
            if (requestController.signal.aborted) {
                return;
            }

            const defaults = response.filter((category) => category.isDefault);
            if (defaults.length !== 1 || response.length === 0) {
                throw new Error(
                    'The categories response must contain exactly one default category.',
                );
            }

            categories = response;
            if (
                categories.every(
                    (category) => category.slug !== selectedCategory,
                )
            ) {
                selectedCategory = defaults[0].slug;
            }
            renderCategories();
        } catch {
            if (requestController.signal.aborted) {
                return;
            }

            renderCategoryError();
            snackbar.show(
                'Unable to load game categories. Please try again.',
                'error',
            );
        }
    }

    return section;
};
