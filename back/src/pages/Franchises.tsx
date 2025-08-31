import React, { useState, useEffect } from "react";

interface Franchise {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  owner_id: number | null;
  assigned_to_user_id: number | null;
  // Données du propriétaire
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_payment_status: string;
  // Données de l'utilisateur assigné
  assigned_first_name: string;
  assigned_last_name: string;
  assigned_email: string;
  assigned_phone: string;
  assigned_zone: string;
  assigned_at: string;
  // Autres champs
  statut_assignation: 'disponible' | 'assignee';
  is_active: boolean;
  created_at: string;
}

interface EligibleUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  assigned_zone: string;
  payment_status: string;
  franchise_payment_completed_at: string;
}

interface AssignmentData {
  availableFranchises: Franchise[];
  eligibleUsers: EligibleUser[];
  summary: {
    total_franchises: number;
    franchises_assignees: number;
    franchises_disponibles: number;
  };
}

const Franchises: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // Fonction pour faire les appels API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const response = await fetch(`/api/franchises${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Charger toutes les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les franchises
      const franchisesResponse = await apiCall('/');
      setFranchises(franchisesResponse.data || []);

      // Charger les données d'assignation (admin seulement)
      try {
        const assignmentResponse = await apiCall('/admin/assignment-data');
        setAssignmentData(assignmentResponse.data);
      } catch (error) {
        console.log('Pas de droits admin - assignations masquées');
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Assigner une franchise à un utilisateur
  const handleAssignFranchise = async () => {
    if (!selectedFranchise || !selectedUser) {
      alert('Veuillez sélectionner une franchise et un utilisateur');
      return;
    }

    try {
      setIsAssigning(true);

      await apiCall('/admin/assign', {
        method: 'POST',
        body: JSON.stringify({
          franchiseId: selectedFranchise,
          userId: selectedUser
        }),
      });

      alert('Franchise assignée avec succès');
      setShowAssignModal(false);
      setSelectedFranchise(null);
      setSelectedUser(null);

      // Recharger les données
      await loadData();

    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('Erreur lors de l\'assignation de la franchise');
    } finally {
      setIsAssigning(false);
    }
  };

  // Libérer une franchise
  const handleUnassignFranchise = async (franchiseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir libérer cette franchise ?')) {
      return;
    }

    try {
      await apiCall(`/admin/unassign/${franchiseId}`, {
        method: 'POST',
      });

      alert('Franchise libérée avec succès');
      await loadData();

    } catch (error) {
      console.error('Erreur lors de la libération:', error);
      alert('Erreur lors de la libération de la franchise');
    }
  };

  if (loading) {
    return (
        <div className="p-6 flex justify-center items-center">
          <div className="text-lg text-gray-600">Chargement...</div>
        </div>
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchises</h1>
            <p className="text-gray-600">Gérez votre réseau de franchises</p>
          </div>
          <div className="flex space-x-3">
            {assignmentData && (
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                    }}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Assigner franchise
                </button>
            )}
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #5C95FF 0%, #B9E6FF 100%)",
                }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                />
              </svg>
              Nouvelle franchise
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "#5C95FF15", color: "#5C95FF" }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path
                      fillRule="evenodd"
                      d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                      clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Franchises</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentData?.summary.total_franchises || franchises.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "#28a74515", color: "#28a745" }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentData?.summary.franchises_assignees ||
                      franchises.filter(f => f.statut_assignation === 'assignee').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "#ffc10715", color: "#ffc107" }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentData?.summary.franchises_disponibles ||
                      franchises.filter(f => f.statut_assignation === 'disponible').length}
                </p>
              </div>
            </div>
          </div>

          {assignmentData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: "#17a2b815", color: "#17a2b8" }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs éligibles</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignmentData.eligibleUsers.length}
                    </p>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Liste des franchises */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des franchises
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Franchise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propriétaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigné à
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {franchises.map((franchise) => (
                  <tr key={franchise.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium mr-3"
                            style={{ backgroundColor: "#5C95FF" }}
                        >
                          {franchise.name.charAt(0)}
                          {franchise.city ? franchise.city.charAt(0) : ''}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {franchise.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {franchise.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {franchise.owner_id ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {franchise.owner_first_name} {franchise.owner_last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {franchise.owner_payment_status === 'franchise_active' ? 'Propriétaire actif' : 'En attente'}
                            </div>
                          </div>
                      ) : (
                          <span className="text-sm text-yellow-600 font-medium">
                        Disponible
                      </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {franchise.assigned_to_user_id ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {franchise.assigned_first_name} {franchise.assigned_last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {franchise.assigned_email}
                            </div>
                            <div className="text-xs text-blue-600">
                              Assigné le: {franchise.assigned_at ? new Date(franchise.assigned_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </div>
                          </div>
                      ) : (
                          <span className="text-sm text-gray-400 italic">
                        Non assigné
                      </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {franchise.owner_email || franchise.email || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {franchise.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {franchise.address || '-'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {franchise.city} {franchise.postal_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                            franchise.statut_assignation === 'assignee'
                                ? "bg-green-500"
                                : "bg-yellow-500"
                        }`}
                    >
                      {franchise.statut_assignation === 'assignee' ? 'Assignée' : 'Disponible'}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Voir détails"
                        >
                          <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {assignmentData && franchise.owner_id && (
                            <button
                                onClick={() => handleUnassignFranchise(franchise.id)}
                                className="text-orange-600 hover:text-orange-900 p-1"
                                title="Libérer la franchise"
                            >
                              <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                        )}

                        <button
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Modifier"
                        >
                          <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal assignation de franchise */}
        {showAssignModal && assignmentData && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Assigner une Franchise
                    </h3>
                    <button
                        onClick={() => {
                          setShowAssignModal(false);
                          setSelectedFranchise(null);
                          setSelectedUser(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Franchise disponible
                      </label>
                      <select
                          value={selectedFranchise || ''}
                          onChange={(e) => setSelectedFranchise(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                      >
                        <option value="">Sélectionnez une franchise</option>
                        {assignmentData.availableFranchises.map((franchise) => (
                            <option key={franchise.id} value={franchise.id}>
                              {franchise.name} - {franchise.city}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Utilisateur éligible (a payé ses 50K)
                      </label>
                      <select
                          value={selectedUser || ''}
                          onChange={(e) => setSelectedUser(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                      >
                        <option value="">Sélectionnez un utilisateur</option>
                        {assignmentData.eligibleUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.first_name} {user.last_name} ({user.email})
                            </option>
                        ))}
                      </select>
                    </div>

                    {assignmentData.eligibleUsers.length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <p className="text-sm text-yellow-800">
                            Aucun utilisateur éligible trouvé. Les utilisateurs doivent avoir payé leurs droits d'entrée (50K) pour être éligibles.
                          </p>
                        </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={() => {
                          setShowAssignModal(false);
                          setSelectedFranchise(null);
                          setSelectedUser(null);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        disabled={isAssigning}
                    >
                      Annuler
                    </button>
                    <button
                        onClick={handleAssignFranchise}
                        disabled={!selectedFranchise || !selectedUser || isAssigning}
                        className="px-4 py-2 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: (!selectedFranchise || !selectedUser || isAssigning) ? '#9CA3AF' : '#28a745'
                        }}
                    >
                      {isAssigning ? 'Attribution...' : 'Assigner'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Modal nouvelle franchise (existant) */}
        {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Nouvelle Franchise
                    </h3>
                    <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la franchise
                      </label>
                      <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                          placeholder="Driv'n Cook..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                          placeholder="franchise@drivncook.fr"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                          placeholder="01 23 45 67 89"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          style={
                            { "--tw-ring-color": "#5C95FF" } as React.CSSProperties
                          }
                          placeholder="Paris, Lyon..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                    <button
                        onClick={() => {
                          setShowModal(false);
                        }}
                        className="px-4 py-2 text-white rounded-md"
                        style={{ backgroundColor: "#5C95FF" }}
                    >
                      Créer
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default Franchises;