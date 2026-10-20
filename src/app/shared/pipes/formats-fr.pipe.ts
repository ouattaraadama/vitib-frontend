import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats francais de l'interface.
 *
 * L'API renvoie des dates ISO (« 2026-07-08 »), des heures (« 13:30:00 ») et
 * des horodatages (« 2026-07-08T13:30:00 »). Ces pipes les presentent comme
 * la plateforme PHP le faisait, sans dependance de localisation.
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Analyse une valeur ISO sans decalage de fuseau. */
function analyser(valeur: string | null | undefined): Date | null {
  if (!valeur) {
    return null;
  }
  // Une date seule (« 2026-07-08 ») serait interpretee en UTC par Date :
  // on la construit explicitement en heure locale.
  const dateSeule = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  if (dateSeule) {
    return new Date(Number(dateSeule[1]), Number(dateSeule[2]) - 1, Number(dateSeule[3]));
  }
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deuxChiffres(nombre: number): string {
  return nombre < 10 ? `0${nombre}` : `${nombre}`;
}

/** « 08/07/2026 » */
@Pipe({ name: 'dateFr' })
export class DateFrPipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    const date = analyser(valeur);
    if (!date) {
      return '—';
    }
    return `${deuxChiffres(date.getDate())}/${deuxChiffres(date.getMonth() + 1)}/${date.getFullYear()}`;
  }
}

/** « mardi 8 juillet 2026 » */
@Pipe({ name: 'dateLongueFr' })
export class DateLongueFrPipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    const date = analyser(valeur);
    if (!date) {
      return '—';
    }
    return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
  }
}

/** « 13h30 » — accepte une heure seule ou un horodatage complet. */
@Pipe({ name: 'heureFr' })
export class HeureFrPipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    if (!valeur) {
      return '—';
    }
    const heureSeule = /^(\d{2}):(\d{2})/.exec(valeur);
    if (heureSeule && !valeur.includes('T')) {
      return `${heureSeule[1]}h${heureSeule[2]}`;
    }
    const date = analyser(valeur);
    if (!date) {
      return '—';
    }
    return `${deuxChiffres(date.getHours())}h${deuxChiffres(date.getMinutes())}`;
  }
}

/** « 08/07/2026 à 13h30 » */
@Pipe({ name: 'dateHeureFr' })
export class DateHeureFrPipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    const date = analyser(valeur);
    if (!date) {
      return '—';
    }
    return `${deuxChiffres(date.getDate())}/${deuxChiffres(date.getMonth() + 1)}/${date.getFullYear()}`
      + ` à ${deuxChiffres(date.getHours())}h${deuxChiffres(date.getMinutes())}`;
  }
}

/** « à l'instant », « il y a 5 min », « le 08/07/2026 à 13h30 », « jamais ». */
@Pipe({ name: 'tempsEcoule' })
export class TempsEcoulePipe implements PipeTransform {
  transform(valeur: string | null | undefined): string {
    const date = analyser(valeur);
    if (!date) {
      return 'jamais';
    }
    const secondes = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secondes < 60) {
      return "à l'instant";
    }
    if (secondes < 3600) {
      return `il y a ${Math.floor(secondes / 60)} min`;
    }
    if (secondes < 86_400) {
      return `il y a ${Math.floor(secondes / 3600)} h`;
    }
    return `le ${deuxChiffres(date.getDate())}/${deuxChiffres(date.getMonth() + 1)}/${date.getFullYear()}`
      + ` à ${deuxChiffres(date.getHours())}h${deuxChiffres(date.getMinutes())}`;
  }
}

/**
 * Valeur d'un champ « datetime-local » a partir d'un horodatage de l'API,
 * et inversement. Utilise par la programmation de la periode d'enregistrement.
 */
export const HorodatageFormulaire = {
  /** « 2026-07-08T13:30:00 » -> « 2026-07-08T13:30 » */
  versChamp(valeur: string | null | undefined): string {
    if (!valeur) {
      return '';
    }
    return valeur.length >= 16 ? valeur.substring(0, 16) : valeur;
  },

  /** « 2026-07-08T13:30 » -> « 2026-07-08T13:30:00 » (null si vide) */
  versApi(valeur: string | null | undefined): string | null {
    const propre = (valeur ?? '').trim();
    if (propre === '') {
      return null;
    }
    return propre.length === 16 ? `${propre}:00` : propre;
  },
};
