import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function ActivationPage() {
    const [token, setToken] = useState('');
    const [candidatureData, setCandidatureData] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState('checking'); // checking, form, success, error

    // Récupérer le token depuis l'URL au chargement
    useEffect(() => {
        // Récupérer le token depuis l'URL (ex: /activation/abc123)
        const urlToken = window.location.pathname.split('/activation/')[1];
        if (urlToken) {
            setToken(urlToken);
            checkToken(urlToken);
        } else {
            setStep('error');
            setIsCheckingToken(false);
        }
    }, []);

    const checkToken = async (tokenToCheck) => {
        try {
            const response = await fetch(`http://localhost:3002/api/activation/check/${tokenToCheck}`);
            const data = await response.json();

            if (data.success) {
                setCandidatureData(data.data);
                setStep('form');
            } else {
                setStep('error');
            }
        } catch (error) {
            console.error('Erreur vérification token:', error);
            setStep('error');
        } finally {
            setIsCheckingToken(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Validation
        const newErrors = {};
        if (!password) newErrors.password = 'Mot de passe requis';
        if (password.length < 6) newErrors.password = 'Au moins 6 caractères requis';
        if (!confirmPassword) newErrors.confirmPassword = 'Confirmation requise';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3002/api/activation/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStep('success');
            } else {
                setErrors({ general: data.message });
            }
        } catch (error) {
            console.error('Erreur activation:', error);
            setErrors({ general: 'Erreur lors de l\'activation du compte' });
        } finally {
            setIsLoading(false);
        }
    };

    const redirectToLogin = () => {
        window.location.href = '/login'; // Ou utilise ton router
    };

    // État de chargement
    if (isCheckingToken) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de votre lien d'activation...</p>
                </div>
            </div>
        );
    }

    // Erreur token invalide
    if (step === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Lien invalide</h2>
                    <p className="text-gray-600 mb-6">
                        Ce lien d'activation est invalide ou a expiré. Contactez-nous si vous pensez qu'il s'agit d'une erreur.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            Retour à l'accueil
                        </button>
                        <p className="text-sm text-gray-500">
                            Besoin d'aide ? <a href="mailto:contact@drivncook.com" className="text-blue-500 hover:underline">Contactez-nous</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Succès
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Compte activé ! 🎉</h2>
                    <p className="text-gray-600 mb-6">
                        Votre compte franchisé a été créé avec succès. Vous pouvez maintenant vous connecter à votre espace.
                    </p>
                    <button
                        onClick={redirectToLogin}
                        className="w-full py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                        Se connecter maintenant
                    </button>
                </div>
            </div>
        );
    }

    // Formulaire d'activation
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mr-3">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Driv'n Cook</h1>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activez votre compte</h2>
                        <p className="text-gray-600">
                            Bienvenue <strong>{candidatureData?.prenom} {candidatureData?.nom}</strong> !<br/>
                            Créez votre mot de passe pour accéder à votre espace franchisé.
                        </p>
                    </div>

                    {/* Erreur générale */}
                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Formulaire */}
                    <div className="space-y-6">
                        {/* Email (lecture seule) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                value={candidatureData?.email || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                            />
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-400' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="Choisissez un mot de passe sécurisé"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>

                        {/* Confirmation mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="Confirmez votre mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span>Activer mon compte</span>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Une fois activé, vous pourrez accéder à votre espace franchisé avec votre email et ce mot de passe.
                    </div>
                </div>
            </div>
        </div>
    );
}