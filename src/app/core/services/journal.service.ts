import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../models/commun.model';
import {
  EntreeJournalActivite,
  EntreeJournalConnexion,
  EtatEnLigne,
  FiltresJournal,
} from '../models/journal.model';

/** Journal des connexions, statut en ligne et journal des actions sensibles. */
@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.urlApi}/journal`;

  /** Journal des connexions, filtre et pagine (100 entrees par page). */
  connexions(filtres: Partial<FiltresJournal>): Observable<Page<EntreeJournalConnexion>> {
    let parametres = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== null && valeur !== undefined && `${valeur}`.trim() !== '') {
        parametres = parametres.set(cle, `${valeur}`.trim());
      }
    }
    return this.http.get<Page<EntreeJournalConnexion>>(`${this.base}/connexions`, {
      params: parametres,
    });
  }

  /** Pastilles « qui est en ligne » du perimetre visible. */
  enLigne(): Observable<EtatEnLigne[]> {
    return this.http.get<EtatEnLigne[]>(`${this.base}/en-ligne`);
  }

  /** Journal des actions sensibles — superadministrateur uniquement. */
  activites(page = 1): Observable<Page<EntreeJournalActivite>> {
    return this.http.get<Page<EntreeJournalActivite>>(`${this.base}/activites`, {
      params: new HttpParams().set('page', `${page}`),
    });
  }
}
