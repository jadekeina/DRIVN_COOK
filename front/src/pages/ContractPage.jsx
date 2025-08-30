import React, { useState, useEffect } from 'react';

const ContractPage = () => {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [candidateData, setCandidateData] = useState(null);
    const [acceptContract, setAcceptContract] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Récupérer le token depuis l'URL au chargement (comme ActivationPage)
    useEffect(() => {
        const urlToken = window.location.pathname.split("/contract/")[1];
        if (urlToken) {
            setToken(urlToken);
            checkContract(urlToken);
        } else {
            setError('Token manquant dans l\'URL');
            setLoading(false);
        }
    }, []);

    const checkContract = async (tokenToCheck) => {
        try {
            console.log('Chargement du contrat pour token:', tokenToCheck);

            // Utiliser l'URL directe comme ActivationPage
            const response = await fetch(
                `http://localhost:3002/api/contract/view/${tokenToCheck}`
            );
            const result = await response.json();

            console.log('Réponse API:', result);

            if (result.success) {
                setCandidateData(result.data);
                setLoading(false);
            } else {
                setError(result.message);
                setLoading(false);
            }
        } catch (error) {
            console.error('Erreur chargement contrat:', error);
            setError('Erreur lors du chargement du contrat');
            setLoading(false);
        }
    };

    const handleAcceptContract = async () => {
        if (!acceptContract) {
            alert('Vous devez accepter les termes du contrat pour continuer');
            return;
        }

        try {
            setProcessing(true);
            console.log('Acceptation du contrat pour token:', token);

            // Utiliser l'URL directe comme ActivationPage
            const response = await fetch(
                `http://localhost:3002/api/contract/accept/${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const result = await response.json();
            console.log('Réponse acceptation:', result);

            if (result.success) {
                console.log('Redirection vers Stripe:', result.checkout_url);
                window.location.href = result.checkout_url;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erreur acceptation contrat:', error);
            alert('Erreur lors de la création de la session de paiement: ' + error.message);
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de votre contrat...</p>
                    <p className="text-sm text-gray-500 mt-2">Token: {token}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-xs text-gray-400 mb-4">Token: {token || 'Manquant'}</p>
                        <a
                            href="mailto:contact@drivncook.com"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Contacter le support
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const { candidature } = candidateData;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white shadow-lg">
                {/* Header */}
                <div className="bg-green-600 text-white px-6 py-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Contrat de Franchise</h1>
                    <p className="text-green-100">Driv'n Cook - Réseau de Food Trucks</p>
                </div>

                {/* Debug Info */}
                <div className="px-6 py-2 bg-gray-100 text-xs text-gray-600">
                    Debug: Token = {token}
                </div>

                {/* Candidate Info */}
                <div className="px-6 py-4 bg-green-50 border-l-4 border-green-500">
                    <h3 className="font-semibold text-green-800 mb-2">Candidat accepté</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="font-medium">Nom :</span> {candidature.prenom} {candidature.nom}</p>
                        <p><span className="font-medium">Email :</span> {candidature.email}</p>
                        <p><span className="font-medium">Zone :</span> {candidature.zone}</p>
                        <p><span className="font-medium">Ville :</span> {candidature.ville}</p>
                    </div>
                </div>

                {/* Contract Content */}
                <div className="px-6 py-6 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b-2 border-green-500 pb-1">
                            Article 1 - Objet du contrat
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                            Le présent contrat a pour objet l'attribution d'une franchise Driv'n Cook permettant au franchisé
                            d'exploiter un food truck sous l'enseigne et selon les méthodes commerciales développées par le franchiseur.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b-2 border-green-500 pb-1">
                            Article 4 - Conditions financières
                        </h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="font-semibold text-yellow-800 mb-2">Droit d'entrée :</p>
                            <div className="text-3xl font-bold text-red-600 text-center mb-3">50 000 € TTC</div>
                            <p className="text-sm text-yellow-700 mb-2">Ce montant couvre :</p>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• L'accès au savoir-faire Driv'n Cook</li>
                                <li>• La formation initiale (2 semaines)</li>
                                <li>• Le matériel de démarrage</li>
                                <li>• L'accompagnement pendant les 3 premiers mois</li>
                            </ul>
                        </div>
                        <p className="text-gray-700"><span className="font-semibold">Redevances mensuelles :</span> 4% du chiffre d'affaires HT</p>
                    </section>
                </div>

                {/* Acceptance Checkbox */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="accept-contract"
                            checked={acceptContract}
                            onChange={(e) => setAcceptContract(e.target.checked)}
                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="accept-contract" className="text-sm text-gray-700 font-medium cursor-pointer">
                            J'ai lu et j'accepte l'intégralité des termes et conditions de ce contrat de franchise
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-6 bg-white border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleAcceptContract}
                            disabled={!acceptContract || processing}
                            className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                                acceptContract && !processing
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {processing ? 'Redirection vers le paiement...' : 'Accepter le contrat et procéder au paiement'}
                        </button>
                        <a
                            href="mailto:contact@drivncook.com"
                            className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-center"
                        >
                            Poser une question
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractPage;