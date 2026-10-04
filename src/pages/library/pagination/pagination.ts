import './pagination.scss';

const mobilePageLimit = 3;
const desktopPageLimit = 4;

export type InteractiveLibraryPagination = HTMLElement & {
    setPageChangeHandler: (handler: (page: number) => void) => void;
    update: (page: number, totalPages: number) => void;
};

export const createLibraryPagination = (): InteractiveLibraryPagination => {
    const navigation = document.createElement(
        'nav',
    ) as InteractiveLibraryPagination;
    navigation.className = 'library-pagination';
    navigation.setAttribute('aria-label', 'Library pages');

    const previousButton = document.createElement('button');
    previousButton.className = 'library-pagination__arrow';
    previousButton.type = 'button';
    previousButton.setAttribute('aria-label', 'Previous page');
    previousButton.textContent = '‹';

    const pageList = document.createElement('ol');
    pageList.className = 'library-pagination__pages';
    pageList.setAttribute('aria-label', 'Page numbers');

    const nextButton = document.createElement('button');
    nextButton.className = 'library-pagination__arrow';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next page');
    nextButton.textContent = '›';

    let activePage = 1;
    let totalPages = 1;
    let onPageChange: ((page: number) => void) | undefined;

    const render = (shouldFocusActivePage = false): void => {
        const pageLimit =
            globalThis.innerWidth <= 767 ? mobilePageLimit : desktopPageLimit;
        const visiblePageCount = Math.min(pageLimit, totalPages);
        const firstVisiblePage = Math.min(
            Math.max(activePage - Math.floor(visiblePageCount / 2), 1),
            totalPages - visiblePageCount + 1,
        );

        previousButton.disabled = activePage <= 1;
        nextButton.disabled = activePage >= totalPages;
        pageList.replaceChildren();

        for (
            let page = firstVisiblePage;
            page < firstVisiblePage + visiblePageCount;
            page += 1
        ) {
            const item = document.createElement('li');
            const pageButton = document.createElement('button');
            const isActive = page === activePage;

            pageButton.className = 'library-pagination__page';
            pageButton.type = 'button';
            pageButton.textContent = String(page);
            pageButton.setAttribute('aria-label', `Page ${page}`);
            if (isActive) {
                pageButton.setAttribute('aria-current', 'page');
            }
            pageButton.classList.toggle(
                'library-pagination__page--active',
                isActive,
            );
            item.append(pageButton);
            pageList.append(item);
        }

        if (shouldFocusActivePage) {
            pageList
                .querySelector<HTMLButtonElement>(
                    '.library-pagination__page--active',
                )
                ?.focus();
        }
    };

    navigation.update = (page, pageCount): void => {
        totalPages = Math.max(1, pageCount);
        activePage = Math.min(Math.max(page, 1), totalPages);
        render();
    };
    navigation.setPageChangeHandler = (handler): void => {
        onPageChange = handler;
    };

    previousButton.addEventListener('click', () => {
        if (activePage > 1) {
            onPageChange?.(activePage - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (activePage < totalPages) {
            onPageChange?.(activePage + 1);
        }
    });

    pageList.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const button = target.closest<HTMLButtonElement>(
            '.library-pagination__page',
        );
        if (!button) {
            return;
        }

        const page = Number(button.textContent);
        if (page !== activePage) {
            onPageChange?.(page);
        }
    });

    globalThis.addEventListener('resize', () => render());

    navigation.append(previousButton, pageList, nextButton);
    render();

    return navigation;
};
