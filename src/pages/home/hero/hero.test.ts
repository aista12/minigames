// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import { createHero } from './hero';

describe('home hero', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    it('exposes the landing headline, descriptive copy, decorative image, and browse action', () => {
        const hero = createHero();
        document.body.append(hero);

        const heading = hero.querySelector('h1')!;
        const description = hero.querySelector('.hero__description')!;
        const action = hero.querySelector<HTMLButtonElement>('.hero__button')!;
        const background = hero.querySelector('.hero__background')!;

        expect(hero.id).toBe('home');
        expect(hero.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(heading.textContent).toBe('Take a Short Break & Have Fun');
        expect(description.textContent).toContain(
            'Discover hundreds of curated casual mini-games.',
        );
        expect(description.textContent).toContain(
            'puzzle, match 3, farm, and board classics.',
        );
        expect(background.getAttribute('aria-hidden')).toBe('true');
        expect(background.querySelector('img')?.alt).toBe('');
        expect(action.type).toBe('button');
        expect(action.textContent).toBe('Browse Library');
        expect(action.disabled).toBe(false);
    });
});
