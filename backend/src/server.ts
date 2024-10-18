import App from './app';
import { FiatTokenRoute } from './routes/fiatToken.route';
import { IndexRoute } from './routes/index.route';
// -------------

const app = new App([new IndexRoute(), new FiatTokenRoute()]);

app.listen();
