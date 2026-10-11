// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { createDeveloperCta } from './developer-cta';

describe('home developer call to action', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('presents a labelled developer submission section with its contact details and action', () => {
        const section = createDeveloperCta();
        document.body.append(section);

        const heading = section.querySelector('h2')!;
        const button = section.querySelector<HTMLButtonElement>(
            '.developer-cta__button',
        )!;
        expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(heading.textContent).toBe('Are You a Game Developer?');
        expect(
            section.querySelector('.developer-cta__description')?.textContent,
        ).toContain('Submit your game and reach thousands of players!');
        expect(
            section.querySelector('.developer-cta__contact')?.textContent,
        ).toContain('developers@minigames.com');
        expect(
            section
                .querySelector('.developer-cta__illustration')
                ?.getAttribute('aria-hidden'),
        ).toBe('true');
        expect(button.type).toBe('button');
        expect(button.textContent).toContain('Submit Form');
        expect(button.disabled).toBe(false);
    });
});
