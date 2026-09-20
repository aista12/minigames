import './developer-cta.scss';

export const createDeveloperCta = (): HTMLElement => {
    const section = document.createElement('section');
    section.className = 'developer-cta';
    section.setAttribute('aria-labelledby', 'developer-cta-title');

    const layout = document.createElement('div');
    layout.className = 'developer-cta__layout';

    const illustration = document.createElement('div');
    illustration.className = 'developer-cta__illustration';
    illustration.setAttribute('aria-hidden', 'true');
    illustration.innerHTML = `
        <div class="developer-cta__screen">
            <span class="developer-cta__screen-bar"></span>
            <span class="developer-cta__screen-bar"></span>
            <span class="developer-cta__screen-bar"></span>
        </div>
        <span class="developer-cta__piece developer-cta__piece--yellow">+</span>
        <span class="developer-cta__piece developer-cta__piece--coral">&#9670;</span>
        <span class="developer-cta__piece developer-cta__piece--blue">&#9679;</span>
        <span class="developer-cta__piece developer-cta__piece--mint">&#9733;</span>
    `;

    const card = document.createElement('article');
    card.className = 'developer-cta__card';

    const title = document.createElement('h2');
    title.className = 'developer-cta__title';
    title.id = 'developer-cta-title';
    title.textContent = 'Are You a Game Developer?';

    const description = document.createElement('p');
    description.className = 'developer-cta__description';
    description.textContent =
        "Want to see your game on MiniGames? We're always looking for fun, engaging mini games to add to our platform. Submit your game and reach thousands of players!";

    const button = document.createElement('button');
    button.className = 'developer-cta__button';
    button.type = 'button';
    button.innerHTML = '<span aria-hidden="true">&#8593;</span>Submit Form';

    const contact = document.createElement('p');
    contact.className = 'developer-cta__contact';
    contact.textContent = 'or contact us at developers@minigames.com';

    card.append(title, description, button, contact);
    layout.append(illustration, card);
    section.append(layout);

    return section;
};
