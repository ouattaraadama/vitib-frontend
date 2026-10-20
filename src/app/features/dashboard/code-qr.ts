import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { DonneesCodeQr } from '../../core/resolvers/evenement.resolvers';
import { BadgeStatut } from '../../shared/composants/badges';
import { DateLongueFrPipe, HeureFrPipe } from '../../shared/pipes/formats-fr.pipe';

/**
 * Fiche imprimable du code QR d'un évènement.
 *
 * Le code est généré par l'API, en SVG : net à l'écran comme au papier, sans
 * aucun appel à un service externe. La plateforme reste utilisable sur un
 * réseau interne sans accès à Internet.
 */
@Component({
  selector: 'app-code-qr',
  imports: [RouterLink, BadgeStatut, DateLongueFrPipe, HeureFrPipe],
  templateUrl: './code-qr.html',
})
export class CodeQrPage {
  private readonly sanitizer = inject(DomSanitizer);

  readonly donnees = input.required<DonneesCodeQr>();

  protected readonly evenement = computed(() => this.donnees().evenement);
  protected readonly codeQr = computed(() => this.donnees().codeQr);

  /**
   * Le SVG provient de notre propre API : il est inséré tel quel afin de
   * rester vectoriel (donc parfaitement net à l'impression).
   */
  protected readonly svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.codeQr().svg),
  );

  protected imprimer(): void {
    window.print();
  }
}
