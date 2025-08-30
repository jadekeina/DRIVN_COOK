import React, { useState, useEffect } from 'react';

const PaymentSuccessPage = () => {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [candidateData, setCandidateData] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    // Récupérer le token depuis l'URL au chargement (comme ActivationPage)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            checkPayment(urlToken);
        } else {
            setError('Token manquant dans l\'URL');
            setLoading(false);
        }
    }, []);

    const checkPayment = async (tokenToCheck) => {
        try {
            console.log('Vérification du paiement pour token:', tokenToCheck);

            // Utiliser l'URL directe comme ActivationPage
            const response = await fetch(
                `http://localhost:3002/api/contract/payment-success/${tokenToCheck}`
            );
            const result = await response.json();

            console.log('Réponse vérification paiement:', result);

            if (result.success) {
                setCandidateData(result.data);
                setLoading(false);
            } else {
                setError(result.message);
                setLoading(false);
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            setError('Erreur lors de la vérification du paiement');
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        setPasswordError('');
        setSuccessMessage('');

        // Validations côté client
        if (password.length < 6) {
            setPasswordError('Le mot de passe doit faire au moins 6 caractères');
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError('Les mots de passe ne correspondent pas');
            return;
        }

        try {
            setProcessing(true);
            console.log('Création du mot de passe pour token:', token);

            // Utiliser l'URL directe comme ActivationPage
            const response = await fetch(
                `http://localhost:3002/api/contract/create-password/${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        password: password,
                        confirmPassword: confirmPassword
                    })
                }
            );

            const result = await response.json();
            console.log('Réponse création mot de passe:', result);

            if (result.success) {
                setSuccessMessage(result.message);

                // Rediriger vers la page de connexion après 3 secondes
                setTimeout(() => {
                    window.location.href = `/login?email=${encodeURIComponent(candidateData.candidature.email)}`;
                }, 3000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Erreur création mot de passe:', error);
            setPasswordError(error.message || 'Erreur lors de la création du compte');
            setProcessing(false);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        // Validation en temps réel
        if (e.target.value && password && password !== e.target.value) {
            setPasswordError('Les mots de passe ne correspondent pas');
        } else {
            setPasswordError('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Vérification de votre paiement...</p>
                        <p className="text-xs text-gray-400 mt-2">Token: {token}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-xs text-gray-400 mb-4">Token: {token || 'Manquant'}</p>
                        <a
                            href="mailto:contact@drivncook.com"
                            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Contacter le support
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-green-500 text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Compte créé !</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-green-700 font-medium">{successMessage}</p>
                            <p className="text-green-600 text-sm mt-2">
                                Redirection vers la page de connexion dans 3 secondes...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { candidature } = candidateData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full">
                {/* Header */}
                <div className="bg-green-600 text-white px-8 py-6 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-3xl font-bold mb-2">Paiement Confirmé !</h1>
                    <p className="text-green-100">Bienvenue dans la famille Driv'n Cook</p>
                </div>

                <div className="p-8">
                    {/* Debug Info */}
                    <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
                        Debug: Token = {token}
                    </div>

                    {/* Candidate Info */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 border-l-4 border-green-500">
                        <h3 className="font-semibold text-green-800 mb-3">Franchisé confirmé</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <p><span className="font-medium">Nom :</span> {candidature.prenom} {candidature.nom}</p>
                            <p><span className="font-medium">Email :</span> {candidature.email}</p>
                        </div>
                    </div>

                    {/* Amount Paid */}
                    <div className="bg-green-50 rounded-lg p-6 mb-6 text-center">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Droit d'entrée payé</h3>
                        <div className="text-4xl font-bold text-green-600 mb-2">50 000 € TTC</div>
                        <p className="text-green-700">Paiement traité avec succès</p>
                    </div>

                    {/* Password Form */}
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-green-500">
                        <h3 className="text-lg font-semibold text-green-700 mb-4 text-center">Créer votre mot de passe</h3>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Mot de passe *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength="6"
                                    placeholder="Minimum 6 caractères"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmer le mot de passe *
                                </label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    required
                                    minLength="6"
                                    placeholder="Retapez votre mot de passe"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {passwordError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing || !password || !confirmPassword}
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                                    processing || !password || !confirmPassword
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {processing ? 'Création du compte...' : 'Créer mon compte'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;