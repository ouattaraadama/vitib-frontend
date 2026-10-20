import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { configurationApplication } from './app/app.config';

bootstrapApplication(App, configurationApplication)
  .catch((erreur) => console.error(erreur));
