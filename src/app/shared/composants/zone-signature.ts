import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Zone de signature tactile — portee du canvas de la plateforme PHP.
 *
 * Fonctionne au doigt comme a la souris, s'adapte a la largeur disponible et
 * tient compte de la densite de l'ecran pour rester nette a l'impression.
 * Emet l'image PNG encodee en base64 a chaque trait.
 */
@Component({
  selector: 'app-zone-signature',
  template: `
    <div class="zone-signature">
      <canvas #toile aria-label="Zone de signature"></canvas>
      <button type="button" class="btn btn-outline-secondary btn-sm mt-2" (click)="effacer()">
        Effacer la signature
      </button>
    </div>
    <div class="form-text text-center">Signez au doigt ou à la souris dans le cadre.</div>
  `,
})
export class ZoneSignature implements AfterViewInit {
  private readonly toile = viewChild.required<ElementRef<HTMLCanvasElement>>('toile');

  /** Image PNG en base64, ou chaine vide lorsque la zone est vierge. */
  readonly signature = output<string>();

  private readonly _signee = signal(false);
  readonly signee = this._signee.asReadonly();

  private contexte: CanvasRenderingContext2D | null = null;
  private enCours = false;
  private dernierX = 0;
  private dernierY = 0;
  private largeurAffichee = 440;
  private hauteurAffichee = 180;

  private readonly redimensionner = () => this.preparerToile();

  constructor() {
    // Le minuteur de redimensionnement ne doit pas survivre au composant.
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', this.redimensionner));
  }

  ngAfterViewInit(): void {
    this.preparerToile();
    this.brancherEvenements();
    window.addEventListener('resize', this.redimensionner);
  }

  /** Remet la zone a blanc et prévient le formulaire. */
  effacer(): void {
    const canvas = this.toile().nativeElement;
    this.contexte?.clearRect(0, 0, canvas.width, canvas.height);
    this._signee.set(false);
    this.signature.emit('');
  }

  // -------------------------------------------------------------------------
  // Dessin
  // -------------------------------------------------------------------------

  private preparerToile(): void {
    const canvas = this.toile().nativeElement;
    const densite = window.devicePixelRatio || 1;
    const largeurParente = canvas.parentElement?.clientWidth ?? 440;

    this.largeurAffichee = Math.min(440, Math.max(260, largeurParente));
    this.hauteurAffichee = Math.round(this.largeurAffichee * (180 / 440));

    canvas.width = Math.round(this.largeurAffichee * densite);
    canvas.height = Math.round(this.hauteurAffichee * densite);
    canvas.style.width = `${this.largeurAffichee}px`;
    canvas.style.height = `${this.hauteurAffichee}px`;

    const contexte = canvas.getContext('2d');
    if (!contexte) {
      return;
    }
    contexte.setTransform(1, 0, 0, 1, 0, 0);
    contexte.scale(densite, densite);
    contexte.strokeStyle = '#003366';
    contexte.lineWidth = 2;
    contexte.lineCap = 'round';
    contexte.lineJoin = 'round';
    this.contexte = contexte;

    // Un redimensionnement efface le trace : la zone repart vierge.
    if (this._signee()) {
      this._signee.set(false);
      this.signature.emit('');
    }
  }

  private brancherEvenements(): void {
    const canvas = this.toile().nativeElement;

    canvas.addEventListener('mousedown', (evenement) => this.commencer(evenement));
    canvas.addEventListener('mousemove', (evenement) => this.tracer(evenement));
    canvas.addEventListener('mouseup', () => this.terminer());
    canvas.addEventListener('mouseleave', () => this.terminer());

    canvas.addEventListener('touchstart', (evenement) => this.commencer(evenement), { passive: false });
    canvas.addEventListener('touchmove', (evenement) => this.tracer(evenement), { passive: false });
    canvas.addEventListener('touchend', () => this.terminer());
  }

  private position(evenement: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.toile().nativeElement;
    const cadre = canvas.getBoundingClientRect();
    // « touches » plutot que « instanceof TouchEvent » : ce type n'existe pas
    // dans tous les navigateurs de bureau.
    const tactile = 'touches' in evenement ? evenement.touches[0] : undefined;
    const point = tactile ?? (evenement as MouseEvent);

    return {
      x: (point.clientX - cadre.left) * (this.largeurAffichee / cadre.width),
      y: (point.clientY - cadre.top) * (this.hauteurAffichee / cadre.height),
    };
  }

  private commencer(evenement: MouseEvent | TouchEvent): void {
    evenement.preventDefault();
    const point = this.position(evenement);
    this.enCours = true;
    this.dernierX = point.x;
    this.dernierY = point.y;
  }

  private tracer(evenement: MouseEvent | TouchEvent): void {
    if (!this.enCours || !this.contexte) {
      return;
    }
    evenement.preventDefault();
    const point = this.position(evenement);

    this.contexte.beginPath();
    this.contexte.moveTo(this.dernierX, this.dernierY);
    this.contexte.lineTo(point.x, point.y);
    this.contexte.stroke();

    this.dernierX = point.x;
    this.dernierY = point.y;
    this._signee.set(true);
  }

  private terminer(): void {
    if (!this.enCours) {
      return;
    }
    this.enCours = false;
    if (this._signee()) {
      this.signature.emit(this.toile().nativeElement.toDataURL('image/png'));
    }
  }
}
