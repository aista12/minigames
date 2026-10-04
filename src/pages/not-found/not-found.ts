import './not-found.scss';
import { pageHref } from '../../shared/router';

export const createNotFoundPage = (onReturnHome: () => void): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'not-found';
    section.setAttribute('aria-labelledby', 'not-found-title');

    const content = document.createElement('div');
    content.className = 'not-found__content';

    const code = document.createElement('p');
    code.className = 'not-found__code';
    code.textContent = '404';
    code.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h1');
    title.id = 'not-found-title';
    title.textContent = 'Page not found';

    const message = document.createElement('p');
    message.textContent =
        'Sorry, the page you are looking for does not exist or may have been moved.';

    const returnHome = document.createElement('a');
    returnHome.className = 'not-found__button';
    returnHome.href = pageHref('home', import.meta.env.BASE_URL);
    returnHome.textContent = 'Return to Home Page';
    returnHome.addEventListener('click', (event) => {
        event.preventDefault();
        onReturnHome();
    });

    content.append(code, title, message, returnHome);
    section.append(content);
    return section;
};
