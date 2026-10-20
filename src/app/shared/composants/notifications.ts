import { Component, inject } from '@angular/core';

import { NotificationService } from '../../core/services/notification.service';

/**
 * Zone de notifications — l'equivalent des messages « flash » de la
 * plateforme PHP, sans rechargement de page.
 *
 * La liste vient d'un signal : l'affichage se met a jour tout seul.
 */
@Component({
  selector: 'app-notifications',
  template: `
    @if (service.notifications().length > 0) {
      <div class="zone-notifications sans-impression" aria-live="polite" aria-atomic="true">
        @for (notification of service.notifications(); track notification.id) {
          <div [class]="'alert alert-' + notification.niveau + ' alert-dismissible fade show'" role="alert">
            {{ notification.message }}
            <button
              type="button"
              class="btn-close"
              aria-label="Fermer"
              (click)="service.fermer(notification.id)"
            ></button>
          </div>
        }
      </div>
    }
  `,
})
export class Notifications {
  protected readonly service = inject(NotificationService);
}
