import React, { useState, useEffect } from "react";

interface Franchisee {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    is_verified: boolean;
    date_franchise: string;
    droit_entree_paye: boolean;
    pourcentage_ca: number;
    zone_attribution: string;
    created_at: string;
    camion_id?: number;
    immatriculation?: string;
    camion_statut?: string;
    emplacement_actuel?: string;
}

const FranchiseesManagement: React.FC = () => {
    const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit'>('create');
    const [selectedFranchisee, setSelectedFranchisee] = useState<Franchisee | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        zone_attribution: '',
        droit_entree_paye: false,
        pourcentage_ca: 4.00,
        is_verified: true
    });

    // Chargement des franchisés depuis l'API
    const loadFranchisees = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token manquant');
            }

            const response = await fetch('/api/admin/franchisees', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement');
            }

            const data = await response.json();

            if (data.success) {
                setFranchisees(data.data);
                console.log(`${data.count} franchisés chargés`);
            } else {
                throw new Error(data.message || 'Erreur serveur');
            }
        } catch (err: any) {
            console.error('Erreur chargement franchisés:', err);
            setError(err.message || 'Erreur lors du chargement des franchisés');
        } finally {
            setLoading(false);
        }
    };

    // Créer un nouveau franchisé
    const createFranchisee = async () => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch('/api/admin/franchisees', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la création');
            }

            const data = await response.json();

            if (data.success) {
                alert(`Franchisé créé avec succès!\nMot de passe temporaire: ${data.data.tempPassword}`);
                await loadFranchisees(); // Recharger la liste
                handleCloseModal();
            } else {
                throw new Error(data.message || 'Erreur serveur');
            }
        } catch (err: any) {
            console.error('Erreur création franchisé:', err);
            alert('Erreur: ' + err.message);
        }
    };

    // Modifier un franchisé
    const updateFranchisee = async () => {
        if (!selectedFranchisee) return;

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/admin/franchisees/${selectedFranchisee.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la modification');
            }

            const data = await response.json();

            if (data.success) {
                alert('Franchisé modifié avec succès!');
                await loadFranchisees(); // Recharger la liste
                handleCloseModal();
            } else {
                throw new Error(data.message || 'Erreur serveur');
            }
        } catch (err: any) {
            console.error('Erreur modification franchisé:', err);
            alert('Erreur: ' + err.message);
        }
    };

    // Supprimer un franchisé
    const deleteFranchisee = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce franchisé ?')) return;

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/admin/franchisees/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la suppression');
            }

            const data = await response.json();

            if (data.success) {
                alert('Franchisé supprimé avec succès!');
                await loadFranchisees(); // Recharger la liste
            } else {
                throw new Error(data.message || 'Erreur serveur');
            }
        } catch (err: any) {
            console.error('Erreur suppression franchisé:', err);
            alert('Erreur: ' + err.message);
        }
    };

    useEffect(() => {
        loadFranchisees();
    }, []);

    const handleOpenModal = (type: 'create' | 'edit', franchisee?: Franchisee) => {
        setModalType(type);
        setSelectedFranchisee(franchisee || null);

        if (type === 'create') {
            setFormData({
                email: '',
                first_name: '',
                last_name: '',
                phone: '',
                zone_attribution: '',
                droit_entree_paye: false,
                pourcentage_ca: 4.00,
                is_verified: true
            });
        } else if (franchisee) {
            setFormData({
                email: franchisee.email,
                first_name: franchisee.first_name,
                last_name: franchisee.last_name,
                phone: franchisee.phone,
                zone_attribution: franchisee.zone_attribution,
                droit_entree_paye: franchisee.droit_entree_paye,
                pourcentage_ca: franchisee.pourcentage_ca,
                is_verified: franchisee.is_verified
            });
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedFranchisee(null);
    };

    const handleSubmit = () => {
        if (modalType === 'create') {
            createFranchisee();
        } else {
            updateFranchisee();
        }
    };

    const filteredFranchisees = franchisees.filter(franchisee =>
        franchisee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchisee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchisee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        franchisee.zone_attribution.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des franchisés...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={loadFranchisees} className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Franchisés</h1>
                    <p className="text-gray-600">Gérez vos franchisés ({franchisees.length} franchisés)</p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)" }}
                >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nouveau franchisé
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: "Total", count: franchisees.length, color: "#7E6C6C" },
                    { label: "Vérifiés", count: franchisees.filter(f => f.is_verified).length, color: "#28a745" },
                    { label: "Avec camion", count: franchisees.filter(f => f.camion_id).length, color: "#5C95FF" },
                    { label: "Droits payés", count: franchisees.filter(f => f.droit_entree_paye).length, color: "#FFA9A3" }
                ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recherche */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou zone..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={loadFranchisees}
                        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Tableau des franchisés */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchisé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">%CA</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFranchisees.map((franchisee) => (
                            <tr key={franchisee.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3" style={{ backgroundColor: "#5C95FF" }}>
                                            {franchisee.first_name[0]}{franchisee.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{franchisee.first_name} {franchisee.last_name}</div>
                                            <div className="text-sm text-gray-500">ID: {franchisee.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{franchisee.email}</div>
                                    <div className="text-sm text-gray-500">{franchisee.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{franchisee.zone_attribution}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {franchisee.camion_id ? (
                                        <div>
                                            <div className="text-sm text-gray-900">{franchisee.immatriculation}</div>
                                            <div className="text-sm text-gray-500">{franchisee.camion_statut}</div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">Aucun</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${franchisee.is_verified ? 'bg-green-500' : 'bg-red-500'}`}>
                        {franchisee.is_verified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                                        {franchisee.droit_entree_paye && (
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white bg-blue-500">
                          Droits payés
                        </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {franchisee.pourcentage_ca}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleOpenModal('edit', franchisee)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Modifier"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => deleteFranchisee(franchisee.id)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                            title="Supprimer"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredFranchisees.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun franchisé trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm ? "Modifiez votre recherche pour voir plus de résultats." : "Aucun franchisé n'a encore été créé."}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {modalType === 'create' ? 'Nouveau Franchisé' : 'Modifier Franchisé'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                            placeholder="Jean"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                            placeholder="Dupont"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                        style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                        placeholder="jean.dupont@drivncook.fr"
                                        disabled={modalType === 'edit'}
                                    />
                                    {modalType === 'edit' && (
                                        <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                        style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                        placeholder="01 23 45 67 89"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Zone d'attribution</label>
                                    <select
                                        value={formData.zone_attribution}
                                        onChange={(e) => setFormData({...formData, zone_attribution: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                        style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                    >
                                        <option value="">Sélectionner une zone</option>
                                        <option value="Paris Centre">Paris Centre</option>
                                        <option value="Paris Nord">Paris Nord</option>
                                        <option value="Paris Sud">Paris Sud</option>
                                        <option value="Lyon Centre">Lyon Centre</option>
                                        <option value="Lyon Presqu'île">Lyon Presqu'île</option>
                                        <option value="Marseille Vieux Port">Marseille Vieux Port</option>
                                        <option value="Marseille Canebière">Marseille Canebière</option>
                                        <option value="Bordeaux Centre">Bordeaux Centre</option>
                                        <option value="Toulouse Capitole">Toulouse Capitole</option>
                                        <option value="Nice Promenade">Nice Promenade</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage CA (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={formData.pourcentage_ca}
                                        onChange={(e) => setFormData({...formData, pourcentage_ca: parseFloat(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                                        style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                        placeholder="4.0"
                                    />
                                </div>

                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.droit_entree_paye}
                                            onChange={(e) => setFormData({...formData, droit_entree_paye: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Droit d'entrée payé</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_verified}
                                            onChange={(e) => setFormData({...formData, is_verified: e.target.checked})}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Compte vérifié</span>
                                    </label>
                                </div>

                                {modalType === 'create' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> Un mot de passe temporaire sera généré automatiquement et affiché après la création.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 text-white rounded-md"
                                    style={{ backgroundColor: "#5C95FF" }}
                                >
                                    {modalType === 'create' ? 'Créer' : 'Modifier'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseesManagement;