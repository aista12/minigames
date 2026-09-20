import '../shared/styles/globals.scss';
import { createHeader } from '../widgets/header/header';

const app = document.createElement('div');

app.id = 'app';
app.append(createHeader());

document.body.append(app);
