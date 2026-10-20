import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { ActiviteService } from './core/services/activite.service';
import { Notifications } from './shared/composants/notifications';

@Component({
  selector: 'app-racine',
  imports: [RouterOutlet, Notifications],
  template: `
    @if (chargement()) {
      <div
        class="barre-chargement"
        role="progressbar"
        aria-label="Chargement"
      ></div>
    }

    <app-notifications />
    <router-outlet />
  `,
})
export class App {
  private readonly activite = inject(ActiviteService);
  private readonly router = inject(Router);

  protected readonly chargement = toSignal(
    this.router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}