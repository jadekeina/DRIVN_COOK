// Utilitaires pour les calculs financiers

/**
 * Calcule le statut global d'un franchisé
 */
exports.calculateFranchiseStatus = (franchise, ventes, droitEntreePaye) => {
    if (!droitEntreePaye) {
        return 'en_attente';
    }

    if (!ventes || ventes.length === 0) {
        return 'en_attente';
    }

    // Vérifier si la dernière vente date de plus de 30 jours
    const derniereVente = new Date(Math.max(...ventes.map(v => new Date(v.date_vente))));
    const maintenant = new Date();
    const joursDepuisderniereVente = Math.floor((maintenant - derniereVente) / (1000 * 60 * 60 * 24));

    if (joursDepuisderniereVente > 30) {
        return 'en_retard';
    }

    return 'a_jour';
};

/**
 * Calcule les échéances de droits d'entrée
 */
exports.calculateEcheancesDroitsEntree = (dateCreation, droitEntreePaye) => {
    const dateCreationObj = new Date(dateCreation);
    const montantEcheance = 10000;
    const nombreEcheances = 4;

    const echeances = [];

    for (let i = 1; i <= nombreEcheances; i++) {
        const dateLimite = new Date(dateCreationObj);
        dateLimite.setMonth(dateLimite.getMonth() + i);

        // Pour la démo, on considère que si le droit initial est payé,
        // les 2 premières échéances le sont aussi
        const paye = droitEntreePaye && i <= 2;

        echeances.push({
            numero: i,
            montant: montantEcheance,
            date_limite: dateLimite.toISOString().split('T')[0],
            paye: paye,
            date_paiement: paye ? dateCreation : null,
            jours_retard: paye ? 0 : Math.max(0, Math.floor((new Date() - dateLimite) / (1000 * 60 * 60 * 24)))
        });
    }

    return echeances;
};

/**
 * Calcule les totaux financiers d'un franchisé
 */
exports.calculateTotauxFinanciers = (ventes, commandes, pourcentageCA = 4) => {
    const caTotal = ventes.reduce((sum, vente) => sum + parseFloat(vente.chiffre_affaires || 0), 0);
    const redevancesDues = caTotal * (pourcentageCA / 100);
    const redevancesPayees = redevancesDues * 0.8; // 80% payées en moyenne pour la démo

    const totalCommandes = commandes.reduce((sum, commande) => sum + parseFloat(commande.total_ttc || 0), 0);
    const margeCommandes = totalCommandes * 0.15; // 15% de marge

    return {
        ca_total: caTotal,
        redevances_dues: redevancesDues,
        redevances_payees: redevancesPayees,
        total_commandes: totalCommandes,
        marge_commandes: margeCommandes,
        revenus_drivncook: redevancesPayees + margeCommandes
    };
};

/**
 * Formate les montants en euros
 */
exports.formatMontant = (montant, devise = '€') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant || 0);
};

/**
 * Calcule la différence en jours entre deux dates
 */
exports.calculerJoursEntre = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

/**
 * Détermine le niveau d'urgence basé sur les jours de retard
 */
exports.determinerNiveauUrgence = (joursRetard) => {
    if (joursRetard > 90) return 'critique';
    if (joursRetard > 60) return 'urgent';
    if (joursRetard > 30) return 'attention';
    return 'normal';
};

/**
 * Génère une prochaine date d'échéance
 */
exports.genererProchaineEcheance = (dateReference, moisAjouter = 1) => {
    const date = new Date(dateReference);
    date.setMonth(date.getMonth() + moisAjouter);
    return date.toISOString().split('T')[0];
};

/**
 * Valide les données financières
 */
exports.validerDonneesFinancieres = (donnees) => {
    const erreurs = [];

    if (donnees.montant && (isNaN(donnees.montant) || donnees.montant < 0)) {
        erreurs.push('Le montant doit être un nombre positif');
    }

    if (donnees.date_paiement && !this.validerDate(donnees.date_paiement)) {
        erreurs.push('Format de date invalide');
    }

    if (donnees.pourcentage && (isNaN(donnees.pourcentage) || donnees.pourcentage < 0 || donnees.pourcentage > 100)) {
        erreurs.push('Le pourcentage doit être entre 0 et 100');
    }

    return {
        valide: erreurs.length === 0,
        erreurs: erreurs
    };
};

/**
 * Valide le format d'une date
 */
exports.validerDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Calcule les statistiques d'un ensemble de données
 */
exports.calculerStatistiques = (donnees, propriete) => {
    if (!Array.isArray(donnees) || donnees.length === 0) {
        return {
            total: 0,
            moyenne: 0,
            median: 0,
            min: 0,
            max: 0,
            count: 0
        };
    }

    const valeurs = donnees.map(item => parseFloat(item[propriete] || 0)).sort((a, b) => a - b);
    const total = valeurs.reduce((sum, val) => sum + val, 0);
    const count = valeurs.length;
    const moyenne = total / count;

    let median;
    if (count % 2 === 0) {
        median = (valeurs[count/2 - 1] + valeurs[count/2]) / 2;
    } else {
        median = valeurs[Math.floor(count/2)];
    }

    return {
        total: total,
        moyenne: parseFloat(moyenne.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        min: valeurs[0],
        max: valeurs[count - 1],
        count: count
    };
};

/**
 * Génère un ID unique pour les factures/rapports
 */
exports.genererIdDocument = (type = 'DOC') => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random.toString().padStart(3, '0')}`;
};

/**
 * Calcule la rentabilité d'un franchisé
 */
exports.calculerRentabilite = (revenus, couts = 0) => {
    if (couts === 0) return revenus > 0 ? 100 : 0;

    const rentabilite = ((revenus - couts) / couts) * 100;
    return parseFloat(rentabilite.toFixed(2));
};

/**
 * Formate une période au format français
 */
exports.formaterPeriode = (periode) => {
    if (!periode) return 'Non définie';

    try {
        const [annee, mois] = periode.split('-');
        const date = new Date(annee, mois - 1);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long'
        });
    } catch (error) {
        return periode;
    }
};

/**
 * Calcule l'évolution entre deux valeurs
 */
exports.calculerEvolution = (valeurActuelle, valeurPrecedente) => {
    if (!valeurPrecedente || valeurPrecedente === 0) {
        return valeurActuelle > 0 ? 100 : 0;
    }

    const evolution = ((valeurActuelle - valeurPrecedente) / valeurPrecedente) * 100;
    return parseFloat(evolution.toFixed(2));
};

/**
 * Groupe les données par période
 */
exports.grouperParPeriode = (donnees, proprieteDate, formatPeriode = 'YYYY-MM') => {
    const groupes = {};

    donnees.forEach(item => {
        const date = new Date(item[proprieteDate]);
        let periode;

        switch (formatPeriode) {
            case 'YYYY-MM':
                periode = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
            case 'YYYY':
                periode = date.getFullYear().toString();
                break;
            case 'YYYY-Qx':
                const trimestre = Math.ceil((date.getMonth() + 1) / 3);
                periode = `${date.getFullYear()}-Q${trimestre}`;
                break;
            default:
                periode = date.toISOString().split('T')[0];
        }

        if (!groupes[periode]) {
            groupes[periode] = [];
        }
        groupes[periode].push(item);
    });

    return groupes;
};

/**
 * Calcule les prévisions basées sur les données historiques
 */
exports.calculerPrevisions = (donneesHistoriques, nombrePeriodesPrevoir = 3) => {
    if (!Array.isArray(donneesHistoriques) || donneesHistoriques.length < 2) {
        return [];
    }

    // Calcul de la tendance simple (moyenne des différences)
    const differences = [];
    for (let i = 1; i < donneesHistoriques.length; i++) {
        differences.push(donneesHistoriques[i] - donneesHistoriques[i-1]);
    }

    const tendanceMoyenne = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
    const derniereValeur = donneesHistoriques[donneesHistoriques.length - 1];

    const previsions = [];
    for (let i = 1; i <= nombrePeriodesPrevoir; i++) {
        const prevision = derniereValeur + (tendanceMoyenne * i);
        previsions.push(Math.max(0, parseFloat(prevision.toFixed(2))));
    }

    return previsions;
};

/**
 * Détermine la couleur en fonction du statut
 */
exports.getCouleurStatut = (statut) => {
    const couleurs = {
        'a_jour': '#28a745',
        'en_retard': '#F87575',
        'en_attente': '#5C95FF',
        'paye': '#28a745',
        'critique': '#dc3545',
        'urgent': '#fd7e14',
        'attention': '#ffc107',
        'normal': '#28a745'
    };

    return couleurs[statut] || '#6c757d';
};

/**
 * Génère un résumé textuel des données financières
 */
exports.genererResume = (donnees) => {
    const {
        nombreFranchises = 0,
        caTotal = 0,
        redevancesTotales = 0,
        franchisesEnRetard = 0
    } = donnees;

    let resume = `Réseau de ${nombreFranchises} franchisé${nombreFranchises > 1 ? 's' : ''}. `;

    if (caTotal > 0) {
        resume += `CA total: ${this.formatMontant(caTotal)}. `;
        resume += `Redevances: ${this.formatMontant(redevancesTotales)}. `;
    }

    if (franchisesEnRetard > 0) {
        resume += `⚠️ ${franchisesEnRetard} franchisé${franchisesEnRetard > 1 ? 's' : ''} en retard.`;
    } else {
        resume += `✅ Tous les paiements sont à jour.`;
    }

    return resume;
};