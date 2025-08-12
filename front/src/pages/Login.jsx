import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { authService } from '../services/authService.ts';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        // Validation simple (garde ton code existant)
        const newErrors = {};
        if (!email) newErrors.email = 'Email requis';
        if (!email.includes('@')) newErrors.email = 'Email invalide';
        if (!password) newErrors.password = 'Mot de passe requis';
        if (password.length < 6) newErrors.password = 'Au moins 6 caractères requis';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsLoading(false);
            return;
        }

        // NOUVELLE PARTIE - Connexion à l'API
        try {
            const result = await authService.login(email, password);

            if (result.success) {
                // Redirection selon le rôle
                const user = result.data?.user;
                if (user?.role === 'admin') {
                    window.location.href = '/admin'; // Ton interface admin
                } else if (user?.role === 'franchise_owner') {
                    window.location.href = '/franchise-dashboard'; // Interface franchisé
                } else {
                    window.location.href = '/dashboard'; // Interface client
                }
            } else {
                setErrors({ general: result.message || 'Erreur de connexion' });
            }
        } catch (error) {
            setErrors({ general: 'Erreur de connexion au serveur' });
        } finally {
            setIsLoading(false);
        }
    };

// AJOUTE aussi ça après tes autres erreurs (dans le JSX) :
    {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
    )}

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left side - Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Header avec logo */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-6">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-3" style={{backgroundColor: '#5C95FF'}}>
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold" style={{color: '#7E6C6C'}}>Driv'n Cook</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-2" style={{color: '#7E6C6C'}}>Se connecter</h2>
                        <p className="text-gray-600">Accédez à votre espace franchisé</p>
                    </div>

                    {/* Login form */}
                    <div className="space-y-6">
                        {/* Email field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium block" style={{color: '#7E6C6C'}}>
                                Adresse email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-400' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300`}
                                    style={{
                                        focusRingColor: '#5C95FF',
                                        '--tw-ring-color': '#5C95FF'
                                    }}
                                    placeholder="votre@email.com"
                                />
                            </div>
                            {errors.email && <p style={{color: '#F87575'}} className="text-sm">{errors.email}</p>}
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium block" style={{color: '#7E6C6C'}}>
                                Mot de passe
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
                                    className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-400' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300`}
                                    style={{
                                        focusRingColor: '#5C95FF',
                                        '--tw-ring-color': '#5C95FF'
                                    }}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && <p style={{color: '#F87575'}} className="text-sm">{errors.password}</p>}
                        </div>

                        {/* Remember me & Forgot password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                                    style={{
                                        accentColor: '#5C95FF',
                                        '--tw-ring-color': '#5C95FF'
                                    }}
                                />
                                <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm transition-colors duration-200 hover:underline"
                                style={{color: '#5C95FF'}}
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-lg"
                            style={{backgroundColor: '#5C95FF'}}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#4A7FE7'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#5C95FF'}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span>Se connecter</span>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-50 text-gray-500">ou</span>
                        </div>
                    </div>

                    {/* Sign up link */}
                    <div className="text-center">
                        <p className="text-gray-600">
                            Pas encore franchisé ?{' '}
                            <button
                                className="font-medium transition-colors duration-200 hover:underline"
                                style={{color: '#5C95FF'}}
                            >
                                Rejoindre le réseau
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Visual/Branding */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8" style={{backgroundColor: '#B9E6FF'}}>
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl" style={{backgroundColor: '#5C95FF'}}>
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-4" style={{color: '#7E6C6C'}}>
                        Votre espace franchisé
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        Gérez votre activité, suivez vos performances et développez votre business en toute autonomie avec nos outils dédiés.
                    </p>

                    {/* Features */}
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center text-left">
                            <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{backgroundColor: '#5C95FF'}}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span style={{color: '#7E6C6C'}}>Gestion de stock intelligente</span>
                        </div>
                        <div className="flex items-center text-left">
                            <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{backgroundColor: '#5C95FF'}}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span style={{color: '#7E6C6C'}}>Suivi des performances</span>
                        </div>
                        <div className="flex items-center text-left">
                            <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" style={{backgroundColor: '#5C95FF'}}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span style={{color: '#7E6C6C'}}>Support dédié</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
