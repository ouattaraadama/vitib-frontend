import {
  DateFrPipe,
  DateLongueFrPipe,
  HeureFrPipe,
  HorodatageFormulaire,
  TempsEcoulePipe,
} from './formats-fr.pipe';

/**
 * Les formats français sont utilisés sur tous les écrans : une erreur de
 * fuseau ou de séparateur s'y verrait partout. Ces tests fixent le contrat.
 */
describe('Formats français', () => {
  it('affiche une date ISO au format jour/mois/année', () => {
    expect(new DateFrPipe().transform('2026-07-08')).toBe('08/07/2026');
  });

  it('ne décale pas la date d’un jour (analyse en heure locale)', () => {
    expect(new DateFrPipe().transform('2026-01-01')).toBe('01/01/2026');
  });

  it('affiche une date longue en français', () => {
    expect(new DateLongueFrPipe().transform('2026-07-08')).toBe('mercredi 8 juillet 2026');
  });

  it('affiche une heure seule au format 13h30', () => {
    expect(new HeureFrPipe().transform('13:30:00')).toBe('13h30');
  });

  it('affiche l’heure d’un horodatage complet', () => {
    expect(new HeureFrPipe().transform('2026-07-08T09:05:00')).toBe('09h05');
  });

  it('remplace une valeur absente par un tiret', () => {
    expect(new DateFrPipe().transform(null)).toBe('—');
    expect(new HeureFrPipe().transform(undefined)).toBe('—');
  });

  it('indique « jamais » quand aucune activité n’a été enregistrée', () => {
    expect(new TempsEcoulePipe().transform(null)).toBe('jamais');
  });

  it('exprime une activité récente en minutes', () => {
    const ilYaCinqMinutes = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(new TempsEcoulePipe().transform(ilYaCinqMinutes)).toBe('il y a 5 min');
  });

  it('convertit un horodatage de l’API vers un champ datetime-local', () => {
    expect(HorodatageFormulaire.versChamp('2026-07-08T13:30:00')).toBe('2026-07-08T13:30');
    expect(HorodatageFormulaire.versChamp(null)).toBe('');
  });

  it('convertit un champ datetime-local vers un horodatage de l’API', () => {
    expect(HorodatageFormulaire.versApi('2026-07-08T13:30')).toBe('2026-07-08T13:30:00');
    expect(HorodatageFormulaire.versApi('   ')).toBeNull();
  });
});
