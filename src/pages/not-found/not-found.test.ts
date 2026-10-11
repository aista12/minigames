// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createNotFoundPage } from './not-found';

describe('not-found page', () => {
    it('renders an accessible not-found message and routes its action home', () => {
        const onReturnHome = vi.fn();
        const page = createNotFoundPage(onReturnHome);
        const link =
            page.querySelector<HTMLAnchorElement>('.not-found__button')!;

        expect(page.getAttribute('aria-labelledby')).toBe('not-found-title');
        expect(page.querySelector('h1')?.textContent).toBe('Page not found');
        expect(page.querySelector('.not-found__code')?.textContent).toBe('404');
        expect(link.textContent).toBe('Return to Home Page');
        expect(link.getAttribute('href')).toBe(import.meta.env.BASE_URL);

        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        link.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(onReturnHome).toHaveBeenCalledOnce();
    });
});
