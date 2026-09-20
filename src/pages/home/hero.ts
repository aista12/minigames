import './hero.scss';
import heroBackgroundUrl from './assets/hero-background.png';

export const createHero = (): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'hero';
    section.id = 'home';
    section.setAttribute('aria-labelledby', 'hero-title');

    const background = document.createElement('div');
    background.className = 'hero__background';
    background.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.className = 'hero__image';
    image.src = heroBackgroundUrl;
    image.alt = '';
    background.append(image);

    const content = document.createElement('div');
    content.className = 'hero__content';

    const title = document.createElement('h1');
    title.className = 'hero__title';
    title.id = 'hero-title';
    title.textContent = 'Take a Short Break & Have Fun';

    const description = document.createElement('p');
    description.className = 'hero__description';
    description.innerHTML =
        'Discover hundreds of curated casual mini-games. Play instantly in your browser &mdash; puzzle, match 3, farm, and board classics.';

    const action = document.createElement('button');
    action.className = 'hero__button';
    action.type = 'button';
    action.textContent = 'Browse Library';

    content.append(title, description, action);
    section.append(background, content);

    return section;
};