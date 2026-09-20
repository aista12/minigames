import '../shared/styles/globals.scss';
import { createCarousel } from '../pages/home/carousel';
import { createHero } from '../pages/home/hero';
import { createHeader } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
app.append(createHeader(), createHero(), createCarousel());

document.body.append(app);
