import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Interface pour les données de candidature
interface Candidature {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    ville: string;
    zone: string;
    experience_resto: string;
    commentaire_resto?: string;
    ancien_franchise: string;
    commentaire_franchise?: string;
    capital: string;
    motivation: string;
    cv_filename: string;
    lettre_filename: string;
    carte_filename: string;
    accept_terms: boolean;
    read_contract: boolean;
    statut: string;
    notes_internes?: string;
    created_at: string;
    updated_at: string;
}

const CandidatureDetails: React.FC = () => {
    // Récupérer l'ID depuis l'URL
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [candidature, setCandidature] = useState<Candidature | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les détails de la candidature au montage
    useEffect(() => {
        if (id) {
            loadCandidatureDetails(parseInt(id));
        } else {
            setError("ID de candidature manquant");
            setLoading(false);
        }
    }, [id]);

    const loadCandidatureDetails = async (candidatureId: number) => {
        try {
            setLoading(true);
            setError(null);

            // Appel direct à votre API existante
            const response = await fetch(`/api/candidatures/${candidatureId}`);
            const data = await response.json();

            if (data.success) {
                setCandidature(data.data);
            } else {
                setError(data.message || "Erreur lors du chargement");
            }
        } catch (err: any) {
            console.error("Erreur chargement détails:", err);
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour obtenir la couleur du statut
    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "en_attente":
                return "#5C95FF";
            case "en_cours":
                return "#FFA9A3";
            case "acceptee":
                return "#28a745";
            case "refusee":
                return "#F87575";
            default:
                return "#7E6C6C";
        }
    };

    // Fonction pour obtenir le libellé du statut
    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case "en_attente":
                return "En attente";
            case "en_cours":
                return "En cours";
            case "acceptee":
                return "Acceptée";
            case "refusee":
                return "Refusée";
            default:
                return statut;
        }
    };

    // Fonction pour télécharger un fichier
    const downloadFile = async (filename: string, type: string) => {
        try {
            // Utiliser l'API de téléchargement que nous avons créée
            const downloadUrl = `/api/candidatures/download/${id}/${type}`;

            // Créer un lien temporaire pour télécharger le fichier
            const response = await fetch(downloadUrl);

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }

            // Convertir la réponse en blob
            const blob = await response.blob();

            // Créer un URL temporaire pour le blob
            const url = window.URL.createObjectURL(blob);

            // Créer un lien de téléchargement temporaire
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Nettoyer
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erreur téléchargement:', error);
            alert('Erreur lors du téléchargement du fichier');
        }
    };

    // Fonction pour revenir à la liste
    const handleBackToList = () => {
        navigate('/candidatures');
    };

    // Affichage pendant le chargement
    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des détails...</span>
                </div>
            </div>
        );
    }

    // Affichage en cas d'erreur
    if (error || !candidature) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-800">{error || "Candidature non trouvée"}</span>
                    </div>
                    <button
                        onClick={handleBackToList}
                        className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm"
                    >
                        Retour à la liste
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header avec bouton retour */}
            <div className="mb-6">
                <button
                    onClick={handleBackToList}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
                >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Retour à la liste
                </button>

                <h1 className="text-3xl font-bold text-gray-900">
                    Candidature #{candidature.id}
                </h1>
                <p className="text-gray-600">
                    Soumise le {new Date(candidature.created_at).toLocaleDateString("fr-FR")}
                </p>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Informations personnelles */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Informations personnelles
                    </h2>

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium mr-4"
                                style={{ backgroundColor: "#7E6C6C" }}
                            >
                                {candidature.prenom[0]}{candidature.nom[0]}
                            </div>
                            <div>
                                <div className="text-lg font-medium text-gray-900">
                                    {candidature.prenom} {candidature.nom}
                                </div>
                                <div className="text-sm text-gray-500">Candidat(e)</div>
                            </div>
                        </div>

                        <div className="border-t pt-3">
                            <div className="grid grid-cols-1 gap-2">
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Email:</span>
                                    <div className="text-gray-900">{candidature.email}</div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Téléphone:</span>
                                    <div className="text-gray-900">{candidature.telephone}</div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Ville:</span>
                                    <div className="text-gray-900">{candidature.ville}</div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Zone:</span>
                                    <div className="text-gray-900 capitalize">{candidature.zone}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statut et suivi */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Statut et suivi
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <span className="text-sm font-medium text-gray-600">Statut actuel:</span>
                            <div className="mt-1">
                <span
                    className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(candidature.statut) }}
                >
                  {getStatusLabel(candidature.statut)}
                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-medium text-gray-600">Date de création:</span>
                            <div className="text-gray-900">
                                {new Date(candidature.created_at).toLocaleDateString("fr-FR", {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        {candidature.updated_at && candidature.updated_at !== candidature.created_at && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Dernière modification:</span>
                                <div className="text-gray-900">
                                    {new Date(candidature.updated_at).toLocaleDateString("fr-FR", {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        )}

                        {candidature.notes_internes && (
                            <div>
                                <span className="text-sm font-medium text-gray-600">Notes internes:</span>
                                <div className="text-gray-900 bg-gray-50 p-2 rounded mt-1">
                                    {candidature.notes_internes}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expérience et informations complémentaires */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Expérience et informations
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600">Expérience restauration:</span>
                            <div className="text-gray-900 font-medium">
                                {candidature.experience_resto === 'oui' ? 'Oui' : 'Non'}
                            </div>
                            {candidature.commentaire_resto && (
                                <div className="text-gray-600 text-sm mt-1 bg-gray-50 p-2 rounded">
                                    {candidature.commentaire_resto}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600">Ancien franchisé:</span>
                            <div className="text-gray-900 font-medium">
                                {candidature.ancien_franchise === 'oui' ? 'Oui' : 'Non'}
                            </div>
                            {candidature.commentaire_franchise && (
                                <div className="text-gray-600 text-sm mt-1 bg-gray-50 p-2 rounded">
                                    {candidature.commentaire_franchise}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-4">
                            <span className="text-sm font-medium text-gray-600">Capital disponible:</span>
                            <div className="text-gray-900 font-medium">{candidature.capital}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Motivation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Lettre de motivation
                </h2>
                <div className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {candidature.motivation}
                </div>
            </div>

            {/* Documents téléchargeables */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Documents fournis
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CV */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Curriculum Vitae</div>
                                <div className="text-sm text-gray-500">{candidature.cv_filename}</div>
                            </div>
                            <button
                                onClick={() => downloadFile(candidature.cv_filename, 'cv')}
                                className="text-blue-600 hover:text-blue-800 p-2"
                                title="Télécharger le CV"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Lettre de motivation */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Lettre de motivation</div>
                                <div className="text-sm text-gray-500">{candidature.lettre_filename}</div>
                            </div>
                            <button
                                onClick={() => downloadFile(candidature.lettre_filename, 'lettre')}
                                className="text-blue-600 hover:text-blue-800 p-2"
                                title="Télécharger la lettre"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Carte d'identité */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Carte d'identité</div>
                                <div className="text-sm text-gray-500">{candidature.carte_filename}</div>
                            </div>
                            <button
                                onClick={() => downloadFile(candidature.carte_filename, 'carte')}
                                className="text-blue-600 hover:text-blue-800 p-2"
                                title="Télécharger la carte d'identité"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                    Cliquez sur les icônes de téléchargement pour voir les documents
                </div>
            </div>

            {/* Conformité */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Conformité et acceptations
                </h2>

                <div className="space-y-2">
                    <div className="flex items-center">
                        <div className="w-5 h-5 mr-3">
                            {candidature.accept_terms ? (
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-gray-900">
              Conditions générales acceptées
            </span>
                    </div>

                    <div className="flex items-center">
                        <div className="w-5 h-5 mr-3">
                            {candidature.read_contract ? (
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className="text-gray-900">
              Contrat de franchise lu
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidatureDetails;