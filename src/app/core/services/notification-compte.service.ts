import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { NotificationCompte, NotificationsReponse } from '../models/notification.model';

/**
 * Notifications persistantes de la cloche du header (creation d'evenements,
 * salle et creneau reserves), distinctes des messages "flash" ephemeres de
 * NotificationService.
 */
@Injectable({ providedIn: 'root' })
export class NotificationCompteService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.urlApi}/notifications`;

    private readonly _notifications = signal<NotificationCompte[]>([]);
    private readonly _nbNonLues = signal(0);

    readonly notifications = this._notifications.asReadonly();
    readonly nbNonLues = this._nbNonLues.asReadonly();

    rafraichir() {
        return this.http.get<NotificationsReponse>(this.base).pipe(
            tap((reponse) => {
                this._notifications.set(reponse.notifications);
                this._nbNonLues.set(reponse.nbNonLues);
            }),
        );
    }

    marquerLue(id: number) {
        return this.http.post<void>(`${this.base}/${id}/lue`, {}).pipe(
            tap(() => {
                this._notifications.update((liste) =>
                    liste.map((n) => (n.id === id ? { ...n, lu: true } : n)),
                );
                this._nbNonLues.update((n) => Math.max(0, n - 1));
            }),
        );
    }

    marquerToutesLues() {
        return this.http.post<void>(`${this.base}/tout-lire`, {}).pipe(
            tap(() => {
                this._notifications.update((liste) => liste.map((n) => ({ ...n, lu: true })));
                this._nbNonLues.set(0);
            }),
        );
    }

    /** Vide l'etat local, appele a la deconnexion. */
    reinitialiser(): void {
        this._notifications.set([]);
        this._nbNonLues.set(0);
    }
}