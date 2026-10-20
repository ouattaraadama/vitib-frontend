/**
 * Notification persistante de la cloche (creation d'evenements, salle et
 * creneau reserves), distincte des messages "flash" ephemeres geres par
 * NotificationService.
 */
export interface NotificationCompte {
    id: number;
    type: string;
    titre: string;
    message: string;
    lien: string | null;
    lu: boolean;
    creeLe: string;
}

export interface NotificationsReponse {
    nbNonLues: number;
    notifications: NotificationCompte[];
}