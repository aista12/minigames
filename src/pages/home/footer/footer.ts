import './footer.scss';
import brandLogoUrl from '../../../shared/assets/brand-logo.png';

const homeLink = '#home';
const githubLink = 'https://github.com/aista12';
const rsSchoolLink = 'https://rs.school/courses/short-track';

const createLogo = (): HTMLAnchorElement => {
    const logo = document.createElement('a');
    logo.className = 'site-footer__logo';
    logo.href = homeLink;
    logo.setAttribute('aria-label', 'MiniGames home');

    const icon = document.createElement('span');
    icon.className = 'site-footer__logo-icon';
    icon.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.src = brandLogoUrl;
    image.alt = '';
    icon.append(image);

    const label = document.createElement('span');
    label.textContent = 'MiniGames';
    logo.append(icon, label);

    return logo;
};

const createLinkList = (
    title: string,
    links: string[],
    className: string,
): HTMLElement => {
    const group = document.createElement('div');
    group.className = `site-footer__link-group ${className}`;

    const heading = document.createElement('h2');
    heading.textContent = title;

    const list = document.createElement('ul');
    for (const label of links) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = homeLink;
        link.textContent = label;
        item.append(link);
        list.append(item);
    }

    group.append(heading, list);
    return group;
};

const createCommunity = (): HTMLElement => {
    const group = document.createElement('div');
    group.className = 'site-footer__link-group site-footer__community';

    const heading = document.createElement('h2');
    heading.textContent = 'Community';

    const socialLinks = document.createElement('div');
    socialLinks.className = 'site-footer__social-links';
    const socialItems = [
        ['share', 'Share'],
        ['chat', 'Chat'],
        ['rss_feed', 'RSS feed'],
    ];

    for (const [icon, label] of socialItems) {
        const link = document.createElement('a');
        link.href = homeLink;
        link.setAttribute('aria-label', label);
        link.innerHTML = `<span aria-hidden="true">${icon}</span>`;
        socialLinks.append(link);
    }

    group.append(heading, socialLinks);
    return group;
};

const createCreditLink = (
    href: string,
    icon: string,
    label: string,
    isExternal = false,
): HTMLAnchorElement => {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'site-footer__credit-link';
    if (isExternal) {
        link.target = '_blank';
        link.rel = 'noreferrer';
    }
    link.innerHTML = `
        <span class="site-footer__credit-icon" aria-hidden="true">${icon}</span>
        <span>${label}</span>
    `;
    return link;
};

export const createFooter = (): HTMLElement => {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';

    const top = document.createElement('div');
    top.className = 'site-footer__top';

    const brand = document.createElement('div');
    brand.className = 'site-footer__brand';
    const description = document.createElement('p');
    description.textContent =
        'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.';
    brand.append(createLogo(), description);

    const links = document.createElement('nav');
    links.className = 'site-footer__links';
    links.setAttribute('aria-label', 'Footer navigation');
    links.append(
        createLinkList(
            'Explore',
            ['Home', 'Library', 'Categories', 'Tournaments'],
            'site-footer__explore',
        ),
        createLinkList(
            'Company',
            ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'],
            'site-footer__company',
        ),
        createCommunity(),
    );
    top.append(brand, links);

    const bottom = document.createElement('div');
    bottom.className = 'site-footer__bottom';

    const copyright = document.createElement('span');
    copyright.textContent = '© 2026 MiniGames. All rights reserved.';

    const credits = document.createElement('div');
    credits.className = 'site-footer__credits';
    credits.append(
        createCreditLink(rsSchoolLink, 'RS', 'RS School', true),
        createCreditLink(githubLink, 'code', '@aista12', true),
    );

    const designCredit = document.createElement('span');
    designCredit.className = 'site-footer__design-credit';
    designCredit.textContent = 'Designed with love';

    bottom.append(copyright, credits, designCredit);
    footer.append(top, bottom);

    return footer;
};
