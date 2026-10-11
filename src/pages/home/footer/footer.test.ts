// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFooter } from './footer';

describe('home footer', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('provides footer navigation and calls back only for internal page links', () => {
        const onNavigate = vi.fn();
        const footer = createFooter(onNavigate);
        document.body.append(footer);

        expect(footer.querySelector('nav')?.getAttribute('aria-label')).toBe(
            'Footer navigation',
        );
        expect(
            footer
                .querySelector('.site-footer__logo')
                ?.getAttribute('aria-label'),
        ).toBe('MiniGames home');
        expect(footer.textContent).toContain(
            'Hundreds of curated casual mini-games',
        );

        const libraryLink = [
            ...footer.querySelectorAll<HTMLAnchorElement>('a[data-page]'),
        ].find((link) => link.textContent === 'Library')!;
        const click = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        libraryLink.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
        expect(onNavigate).toHaveBeenCalledOnce();
        expect(onNavigate).toHaveBeenCalledWith('library');

        const shareLink = footer.querySelector<HTMLAnchorElement>(
            'a[aria-label="Share"]',
        )!;
        shareLink
            .querySelector('span')!
            .dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
        expect(onNavigate).toHaveBeenLastCalledWith('home');

        const external = footer.querySelector<HTMLAnchorElement>(
            '.site-footer__credit-link[target="_blank"]',
        )!;
        const externalClick = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        external.dispatchEvent(externalClick);
        expect(externalClick.defaultPrevented).toBe(false);
        expect(onNavigate).toHaveBeenCalledTimes(2);
    });
});
