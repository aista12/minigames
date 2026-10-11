// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLibraryPagination } from './pagination';

describe('library pagination', () => {
    beforeEach(() => {
        vi.stubGlobal('innerWidth', 1200);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    it('updates the active page, clamps page values, and disables boundary arrows', () => {
        const pagination = createLibraryPagination();
        document.body.append(pagination);
        pagination.update(20, 8);

        expect(
            pagination.querySelector('[aria-current="page"]')?.textContent,
        ).toBe('8');
        expect(
            pagination.querySelectorAll('.library-pagination__page'),
        ).toHaveLength(4);
        expect(
            pagination.querySelector<HTMLButtonElement>(
                '[aria-label="Previous page"]',
            )?.disabled,
        ).toBe(false);
        expect(
            pagination.querySelector<HTMLButtonElement>(
                '[aria-label="Next page"]',
            )?.disabled,
        ).toBe(true);

        pagination.update(-3, 0);
        expect(
            pagination.querySelector('[aria-current="page"]')?.textContent,
        ).toBe('1');
        expect(
            pagination.querySelectorAll('.library-pagination__page'),
        ).toHaveLength(1);
        expect(
            pagination.querySelector<HTMLButtonElement>(
                '[aria-label="Previous page"]',
            )?.disabled,
        ).toBe(true);
        expect(
            pagination.querySelector<HTMLButtonElement>(
                '[aria-label="Next page"]',
            )?.disabled,
        ).toBe(true);
    });

    it('notifies page changes from numbered and arrow buttons', () => {
        const pagination = createLibraryPagination();
        const onPageChange = vi.fn();
        pagination.setPageChangeHandler(onPageChange);
        pagination.update(3, 8);

        pagination
            .querySelector<HTMLButtonElement>('[aria-label="Page 4"]')!
            .click();
        pagination
            .querySelector<HTMLButtonElement>('[aria-label="Next page"]')!
            .click();
        pagination
            .querySelector<HTMLButtonElement>('[aria-label="Previous page"]')!
            .click();

        expect(onPageChange.mock.calls).toEqual([[4], [4], [2]]);
        expect(
            pagination.querySelector('[aria-current="page"]')?.textContent,
        ).toBe('3');

        pagination.setPage(4);
        expect(
            pagination.querySelector('[aria-current="page"]')?.textContent,
        ).toBe('4');
    });

    it('changes the visible page window after a resize', () => {
        const pagination = createLibraryPagination();
        pagination.update(6, 10);
        expect(
            pagination.querySelectorAll('.library-pagination__page'),
        ).toHaveLength(4);

        vi.stubGlobal('innerWidth', 500);
        globalThis.dispatchEvent(new Event('resize'));

        expect(
            pagination.querySelectorAll('.library-pagination__page'),
        ).toHaveLength(3);
        expect(
            pagination.querySelector('[aria-current="page"]')?.textContent,
        ).toBe('6');
    });
});
