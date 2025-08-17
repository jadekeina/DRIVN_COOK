import React, { useState, useEffect } from "react";

interface Camion {
    id: number;
    immatriculation: string;
    modele: string;
    annee: number;
    statut: 'disponible' | 'en_service' | 'en_panne' | 'maintenance';
    emplacement_actuel?: string;
    franchisee_id?: number;
    date_attribution?: string;
    franchisee_name?: string;
    franchisee_email?: string;
    created_at: string;
}

interface Franchisee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

const Camions: React.FC = () => {
    const [camions, setCamions] = useState<Camion[]>([]);
    const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'create' | 'edit' | 'assign' | 'panne'>('create');
    const [selectedCamion, setSelectedCamion] = useState<Camion | null>(null);

    // Données de démonstration réalistes
    const demoData: Camion[] = [
        {
            id: 1,
            immatriculation: "AB-123-CD",
            modele: "Iveco Daily Food Truck",
            annee: 2022,
            statut: "en_service",
            emplacement_actuel: "Paris 1er - Place Vendôme",
            franchisee_id: 1,
            franchisee_name: "Jean Dupont",
            franchisee_email: "jean.dupont@drivncook.fr",
            date_attribution: "2024-01-15",
            created_at: "2024-01-10T10:00:00Z"
        },
        {
            id: 2,
            immatriculation: "EF-456-GH",
            modele: "Mercedes Sprinter Custom",
            annee: 2023,
            statut: "disponible",
            emplacement_actuel: "Dépôt Central Paris",
            created_at: "2024-02-01T14:30:00Z"
        },
        {
            id: 3,
            immatriculation: "IJ-789-KL",
            modele: "Ford Transit Food Van",
            annee: 2021,
            statut: "en_panne",
            emplacement_actuel: "Garage Maintenance Lyon",
            franchisee_id: 2,
            franchisee_name: "Marie Martin",
            franchisee_email: "marie.martin@drivncook.fr",
            date_attribution: "2024-02-20",
            created_at: "2024-01-25T09:15:00Z"
        },
        {
            id: 4,
            immatriculation: "MN-012-OP",
            modele: "Citroën Jumper Aménagé",
            annee: 2023,
            statut: "maintenance",
            emplacement_actuel: "Service Technique Marseille",
            created_at: "2024-03-01T11:45:00Z"
        }
    ];

    const demoFranchisees: Franchisee[] = [
        { id: 1, first_name: "Jean", last_name: "Dupont", email: "jean.dupont@drivncook.fr" },
        { id: 2, first_name: "Marie", last_name: "Martin", email: "marie.martin@drivncook.fr" },
        { id: 3, first_name: "Pierre", last_name: "Durand", email: "pierre.durand@drivncook.fr" }
    ];

    useEffect(() => {
        // Simulation du chargement des données
        setTimeout(() => {
            setCamions(demoData);
            setFranchisees(demoFranchisees);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "disponible": return "#28a745";
            case "en_service": return "#5C95FF";
            case "en_panne": return "#F87575";
            case "maintenance": return "#FFA9A3";
            default: return "#7E6C6C";
        }
    };

    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case "disponible": return "Disponible";
            case "en_service": return "En service";
            case "en_panne": return "En panne";
            case "maintenance": return "Maintenance";
            default: return statut;
        }
    };

    const filteredCamions = camions.filter((camion) => {
        const matchesStatus = selectedStatus === "all" || camion.statut === selectedStatus;
        const matchesSearch =
            camion.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            camion.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (camion.franchisee_name && camion.franchisee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (camion.emplacement_actuel && camion.emplacement_actuel.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const handleOpenModal = (type: typeof modalType, camion?: Camion) => {
        setModalType(type);
        setSelectedCamion(camion || null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCamion(null);
    };

    const generateImmatriculation = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';

        const getRandomLetter = () => letters[Math.floor(Math.random() * letters.length)];
        const getRandomNumber = () => numbers[Math.floor(Math.random() * numbers.length)];

        return `${getRandomLetter()}${getRandomLetter()}-${getRandomNumber()}${getRandomNumber()}${getRandomNumber()}-${getRandomLetter()}${getRandomLetter()}`;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Chargement des camions...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Camions</h1>
                    <p className="text-gray-600">Gérez votre flotte de food trucks ({camions.length} camions)</p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)" }}
                >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nouveau camion
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: "Total", count: camions.length, color: "#7E6C6C" },
                    { label: "Disponibles", count: camions.filter(c => c.statut === 'disponible').length, color: "#28a745" },
                    { label: "En service", count: camions.filter(c => c.statut === 'en_service').length, color: "#5C95FF" },
                    { label: "En panne", count: camions.filter(c => c.statut === 'en_panne').length, color: "#F87575" }
                ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
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

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher par immatriculation, modèle, franchisé..."
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sm:w-48">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="disponible">Disponibles</option>
                            <option value="en_service">En service</option>
                            <option value="en_panne">En panne</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tableau des camions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camion</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchisé</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emplacement</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribution</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCamions.map((camion) => (
                            <tr key={camion.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium mr-3" style={{ backgroundColor: getStatusColor(camion.statut) }}>
                                            🚛
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{camion.immatriculation}</div>
                                            <div className="text-sm text-gray-500">{camion.modele} ({camion.annee})</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getStatusColor(camion.statut) }}
                    >
                      {getStatusLabel(camion.statut)}
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {camion.franchisee_name ? (
                                        <div>
                                            <div className="text-sm text-gray-900">{camion.franchisee_name}</div>
                                            <div className="text-sm text-gray-500">{camion.franchisee_email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">Non assigné</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{camion.emplacement_actuel || 'Non défini'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {camion.date_attribution ? new Date(camion.date_attribution).toLocaleDateString('fr-FR') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleOpenModal('edit', camion)}
                                            className="text-blue-600 hover:text-blue-900 p-1"
                                            title="Modifier"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => handleOpenModal('assign', camion)}
                                            className="text-green-600 hover:text-green-900 p-1"
                                            title="Assigner/Désassigner"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {camion.statut !== 'en_panne' && (
                                            <button
                                                onClick={() => handleOpenModal('panne', camion)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Signaler une panne"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredCamions.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun camion trouvé</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || selectedStatus !== "all" ? "Modifiez vos filtres pour voir plus de résultats." : "Aucun camion n'a encore été ajouté."}
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
                                    {modalType === 'create' && 'Nouveau Camion'}
                                    {modalType === 'edit' && 'Modifier Camion'}
                                    {modalType === 'assign' && 'Assigner Camion'}
                                    {modalType === 'panne' && 'Signaler une Panne'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {modalType === 'create' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:border-transparent"
                                                style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                                                placeholder="AB-123-CD"
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.querySelector('input[placeholder="AB-123-CD"]') as HTMLInputElement;
                                                    if (input) input.value = generateImmatriculation();
                                                }}
                                                className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm hover:bg-gray-200"
                                            >
                                                Générer
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}>
                                            <option>Iveco Daily Food Truck</option>
                                            <option>Mercedes Sprinter Custom</option>
                                            <option>Ford Transit Food Van</option>
                                            <option>Citroën Jumper Aménagé</option>
                                            <option>Peugeot Boxer Food Truck</option>
                                            <option>Renault Master Cuisine Mobile</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}>
                                            <option>2024</option>
                                            <option>2023</option>
                                            <option>2022</option>
                                            <option>2021</option>
                                            <option>2020</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement initial</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties} placeholder="Dépôt Central Paris" />
                                    </div>
                                </div>
                            )}

                            {modalType === 'assign' && selectedCamion && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Camion</label>
                                        <input type="text" value={`${selectedCamion.immatriculation} - ${selectedCamion.modele}`} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Franchisé</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}>
                                            <option value="">-- Non assigné --</option>
                                            {franchisees.map(f => (
                                                <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nouvel emplacement</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties} placeholder="Zone d'affectation" />
                                    </div>
                                </div>
                            )}

                            {modalType === 'panne' && selectedCamion && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Camion</label>
                                        <input type="text" value={`${selectedCamion.immatriculation} - ${selectedCamion.modele}`} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description de la panne</label>
                                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties} rows={3} placeholder="Décrivez le problème rencontré..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Coût estimé (€)</label>
                                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent" style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties} placeholder="0" />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-white rounded-md"
                                    style={{ backgroundColor: modalType === 'panne' ? "#F87575" : "#5C95FF" }}
                                >
                                    {modalType === 'create' && 'Créer'}
                                    {modalType === 'edit' && 'Modifier'}
                                    {modalType === 'assign' && 'Assigner'}
                                    {modalType === 'panne' && 'Signaler'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Camions;