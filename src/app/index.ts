import '../shared/styles/globals.scss';
import { createCarousel } from '../pages/home/carousel/carousel';
import { createDeveloperCta } from '../pages/home/developer-cta/developer-cta';
import { createFooter } from '../pages/home/footer/footer';
import { createHero } from '../pages/home/hero/hero';
import { createLeaderboard } from '../pages/home/leaderboard/leaderboard';
import { createHeader } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
const main = document.createElement('main');
main.append(
    createHero(),
    createCarousel(),
    createLeaderboard(),
    createDeveloperCta(),
);
app.append(createHeader(), main, createFooter());

document.body.append(app);
