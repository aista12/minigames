import '../shared/styles/globals.scss';
import { createCarousel } from '../pages/home/carousel';
import { createDeveloperCta } from '../pages/home/developer-cta';
import { createHero } from '../pages/home/hero';
import { createLeaderboard } from '../pages/home/leaderboard';
import { createHeader } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
app.append(
    createHeader(),
    createHero(),
    createCarousel(),
    createLeaderboard(),
    createDeveloperCta(),
);

document.body.append(app);
