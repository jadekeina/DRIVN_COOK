import React, { useState, useEffect } from 'react';
import { CheckCircle, CreditCard, FileText, Clock, Send, AlertTriangle } from 'lucide-react';

const FranchisePaymentFlow = () => {
    const [currentStep, setCurrentStep] = useState('contract');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [contractAccepted, setContractAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userStatus, setUserStatus] = useState('pending_contract');

    // Récupérer le statut utilisateur depuis l'API
    useEffect(() => {
        fetchUserStatus();
    }, []);

    const fetchUserStatus = async () => {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                setUserStatus(data.user.payment_status);
                setCurrentStep(getStepFromStatus(data.user.payment_status));
            }
        } catch (error) {
            console.error('Erreur récupération statut:', error);
        }
    };

    const getStepFromStatus = (status) => {
        switch (status) {
            case 'pending_contract': return 'contract';
            case 'contract_signed': return 'deposit_payment';
            case 'deposit_paid': return 'franchise_payment_method';
            case 'franchise_payment_pending': return 'waiting_full_payment';
            case 'franchise_payment_completed': return 'completed';
            case 'franchise_active': return 'active';
            default: return 'contract';
        }
    };

    const handleSignContract = async () => {
        if (!contractAccepted) {
            alert('Vous devez accepter les termes du contrat de franchise');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/franchise/sign-contract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ accepted: true })
            });

            const data = await response.json();
            if (data.success) {
                setCurrentStep('deposit_payment');
                setUserStatus('contract_signed');
            } else {
                alert('Erreur lors de la signature: ' + data.message);
            }
        } catch (error) {
            alert('Erreur réseau: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDepositPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/payments/create-deposit-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: 3000,
                    description: 'Acompte activation compte franchise Driv\'n Cook'
                })
            });

            const data = await response.json();
            if (data.success) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            alert('Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFranchisePaymentMethod = async (method) => {
        setLoading(true);
        setPaymentMethod(method);

        try {
            const response = await fetch('/api/franchise/set-franchise-payment-method', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ payment_method: method })
            });

            const data = await response.json();
            if (data.success) {
                setCurrentStep('waiting_full_payment');
                setUserStatus('franchise_payment_pending');
            }
        } catch (error) {
            alert('Erreur: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'contract':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <FileText className="w-8 h-8 text-blue-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Contrat de Franchise Driv'n Cook</h2>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-96 overflow-y-auto">
                            <h3 className="font-semibold mb-3">CONTRAT DE FRANCHISE DRIV'N COOK</h3>
                            <div className="text-sm text-gray-700 space-y-3">
                                <div>
                                    <p><strong>Article 1 - Objet du contrat</strong></p>
                                    <p>Le présent contrat porte sur l'octroi d'une franchise de restauration rapide sous l'enseigne "Driv'n Cook".</p>
                                </div>

                                <div>
                                    <p><strong>Article 2 - Conditions financières</strong></p>
                                    <ul className="list-disc ml-4 space-y-1">
                                        <li><strong>Droit d'entrée :</strong> 50,000€ HT</li>
                                        <li><strong>Acompte d'activation :</strong> 3,000€ pour accès au système</li>
                                        <li><strong>Redevances :</strong> 4% du chiffre d'affaires HT mensuel</li>
                                    </ul>
                                </div>

                                <div>
                                    <p><strong>Article 3 - Approvisionnement</strong></p>
                                    <p>Le franchisé s'engage à acheter au minimum 80% de son stock (ingrédients, plats préparés, boissons) auprès des entrepôts Driv'n Cook en Île-de-France. Le solde de 20% peut être libre.</p>
                                </div>

                                <div>
                                    <p><strong>Article 4 - Territoire et exclusivité</strong></p>
                                    <p>Le franchisé bénéficie d'une exclusivité territoriale selon la zone géographique attribuée.</p>
                                </div>

                                <div>
                                    <p><strong>Article 5 - Durée</strong></p>
                                    <p>Le contrat est conclu pour une durée de 5 ans renouvelable par tacite reconduction.</p>
                                </div>

                                <div>
                                    <p><strong>Article 6 - Entrepôts et production</strong></p>
                                    <p>Driv'n Cook dispose de 4 entrepôts en Île-de-France équipés de cuisines où sont préparés les plats avec attention.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <input
                                type="checkbox"
                                id="accept-contract"
                                checked={contractAccepted}
                                onChange={(e) => setContractAccepted(e.target.checked)}
                                className="mr-3 w-4 h-4 text-blue-600"
                            />
                            <label htmlFor="accept-contract" className="text-sm text-gray-700">
                                J'accepte les termes et conditions du contrat de franchise Driv'n Cook
                            </label>
                        </div>

                        <button
                            onClick={handleSignContract}
                            disabled={!contractAccepted || loading}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
                        >
                            {loading ? 'Signature en cours...' : 'Signer le contrat'}
                        </button>
                    </div>
                );

            case 'deposit_payment':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <CreditCard className="w-8 h-8 text-green-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Acompte d'activation</h2>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900">Étape obligatoire</h3>
                                    <p className="text-sm text-blue-800 mt-1">
                                        Pour accéder à votre compte franchisé et pouvoir ensuite vous attribuer une franchise,
                                        vous devez verser un acompte de <strong>3,000€</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">Récapitulatif des paiements</h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span>Acompte d'activation (maintenant)</span>
                                    <span className="font-semibold text-green-600">3,000€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Solde droit d'entrée (après attribution)</span>
                                    <span className="font-semibold">47,000€</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between font-bold">
                                    <span>Total droit d'entrée</span>
                                    <span>50,000€</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDepositPayment}
                            disabled={loading}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300"
                        >
                            {loading ? 'Redirection vers le paiement...' : 'Payer l\'acompte de 3,000€'}
                        </button>

                        <p className="text-xs text-gray-500 mt-3 text-center">
                            Paiement sécurisé par Stripe • Cartes acceptées : Visa, Mastercard, Amex
                        </p>
                    </div>
                );

            case 'franchise_payment_method':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <CreditCard className="w-8 h-8 text-orange-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Solde du droit d'entrée</h2>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-green-800">
                                Votre acompte de 3,000€ a été reçu. Votre compte est activé.
                            </p>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Il reste maintenant <strong>47,000€</strong> à régler pour finaliser votre droit d'entrée.
                            Choisissez votre mode de paiement :
                        </p>

                        <div className="space-y-4">
                            <div
                                onClick={() => handleFranchisePaymentMethod('bank_transfer')}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-green-50 hover:border-green-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Virement bancaire</h3>
                                        <p className="text-sm text-gray-600">Aucun frais - Délai 1-3 jours</p>
                                        <p className="text-xs text-green-600">Recommandé pour 47,000€</p>
                                    </div>
                                    <Send className="w-6 h-6 text-green-600" />
                                </div>
                            </div>

                            <div
                                onClick={() => handleFranchisePaymentMethod('check')}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-yellow-50 hover:border-yellow-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Chèque de banque</h3>
                                        <p className="text-sm text-gray-600">Sécurisé et garanti - Délai 5-7 jours</p>
                                        <p className="text-xs text-yellow-600">Idéal pour les gros montants</p>
                                    </div>
                                    <FileText className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>

                            <div
                                onClick={() => handleFranchisePaymentMethod('installments')}
                                className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Paiement échelonné</h3>
                                        <p className="text-sm text-gray-600">En plusieurs versements - Conditions à négocier</p>
                                        <p className="text-xs text-blue-600">Sur 6 ou 12 mois</p>
                                    </div>
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'waiting_full_payment':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <Clock className="w-8 h-8 text-orange-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Finalisation du paiement</h2>
                        </div>

                        {paymentMethod === 'bank_transfer' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-green-800 mb-3">Coordonnées bancaires</h3>
                                <div className="text-sm space-y-1">
                                    <p><strong>Bénéficiaire:</strong> DRIV'N COOK SAS</p>
                                    <p><strong>IBAN:</strong> FR76 1234 5678 9012 3456 7890 123</p>
                                    <p><strong>BIC:</strong> BNPAFRPPXXX</p>
                                    <p><strong>Montant:</strong> 47,000€</p>
                                    <p><strong>Référence:</strong> FRANCHISE-SOLDE-{new Date().getTime()}</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'check' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-yellow-800 mb-3">Adresse d'envoi du chèque</h3>
                                <div className="text-sm">
                                    <p><strong>DRIV'N COOK SAS</strong></p>
                                    <p>Service Comptabilité - Franchise</p>
                                    <p>123 Rue de la Franchise</p>
                                    <p>75001 PARIS</p>
                                    <p className="mt-2"><strong>Montant:</strong> 47,000€</p>
                                    <p><strong>Ordre:</strong> DRIV'N COOK SAS</p>
                                    <p><strong>Référence au dos:</strong> Solde droit entrée + votre nom</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'installments' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-blue-800 mb-3">Paiement échelonné</h3>
                                <p className="text-sm text-blue-800">
                                    Nos équipes vont vous contacter sous 48h pour établir un échéancier personnalisé
                                    pour les 47,000€ restants. Options disponibles : 6 ou 12 mois.
                                </p>
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                Votre franchise sera définitivement attribuée et activée dès réception
                                et validation du paiement complet. Vous recevrez une confirmation par email.
                            </p>
                        </div>
                    </div>
                );

            case 'completed':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Paiement intégral reçu</h2>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800">
                                Votre paiement de 50,000€ est complet. Votre franchise va être attribuée
                                et activée définitivement sous 24-48h.
                            </p>
                        </div>
                    </div>
                );

            case 'active':
                return (
                    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                        <div className="flex items-center mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-900">Franchise active</h2>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-green-800 mb-3">
                                Félicitations ! Votre franchise Driv'n Cook est maintenant active.
                            </p>
                            <div className="text-sm text-green-700">
                                <p><strong>Vous pouvez maintenant :</strong></p>
                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                    <li>Passer des commandes de stock depuis nos entrepôts</li>
                                    <li>Accéder aux recettes et procédures Driv'n Cook</li>
                                    <li>Bénéficier du support technique et commercial</li>
                                    <li>Utiliser la marque et les outils marketing</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Rappel :</strong> Redevance mensuelle de 4% du CA + 80% minimum
                                d'approvisionnement depuis nos entrepôts d'Île-de-France.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Progress bar */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center ${currentStep === 'contract' ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'contract' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
                            <span className="ml-2 text-sm">Contrat</span>
                        </div>
                        <div className={`flex items-center ${currentStep === 'deposit_payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['deposit_payment', 'franchise_payment_method'].includes(currentStep) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
                            <span className="ml-2 text-sm">Acompte 3K</span>
                        </div>
                        <div className={`flex items-center ${['franchise_payment_method', 'waiting_full_payment'].includes(currentStep) ? 'text-orange-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['franchise_payment_method', 'waiting_full_payment'].includes(currentStep) ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>3</div>
                            <span className="ml-2 text-sm">Solde 47K</span>
                        </div>
                        <div className={`flex items-center ${['completed', 'active'].includes(currentStep) ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['completed', 'active'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>4</div>
                            <span className="ml-2 text-sm">Activation</span>
                        </div>
                    </div>
                </div>

                {renderStep()}
            </div>
        </div>
    );
};





export default FranchisePaymentFlow;