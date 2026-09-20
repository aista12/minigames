import '../shared/styles/globals.scss';
import { createHero } from '../pages/home/hero';
import { createHeader } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
app.append(createHeader(), createHero());

document.body.append(app);
