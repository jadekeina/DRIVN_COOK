import React, { useState, useEffect } from "react";
import { candidatureService } from "../services/candidatureServices.ts";
import type { Candidature } from "../services/candidatureServices.ts";

const Candidatures: React.FC = () => {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Charger les candidatures au montage du composant
  useEffect(() => {
    loadCandidatures();
  }, []);

  const loadCandidatures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await candidatureService.getAll();
      setCandidatures(data);
    } catch (err: any) {
      console.error("Erreur chargement candidatures:", err);
      setError(err.message || "Erreur lors du chargement des candidatures");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredCandidatures = candidatures.filter((candidature) => {
    const matchesStatus =
      selectedStatus === "all" || candidature.statut === selectedStatus;
    const matchesSearch =
      candidature.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidature.ville.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (
    candidatureId: number,
    newStatus: string,
  ) => {
    try {
      setUpdatingStatus(candidatureId);

      // Appel à l'API pour mettre à jour le statut
      await candidatureService.updateStatus(candidatureId, newStatus);

      // Mettre à jour la candidature localement
      setCandidatures((prev) =>
        prev.map((candidature) =>
          candidature.id === candidatureId
            ? { ...candidature, statut: newStatus as any }
            : candidature,
        ),
      );

      console.log(`Statut de ${candidatureId} changé vers ${newStatus}`);
    } catch (err: any) {
      console.error("Erreur mise à jour statut:", err);
      alert("Erreur lors de la mise à jour du statut: " + err.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleViewDetails = (candidature: Candidature) => {
    // Affichage des détails (tu peux faire une modale plus tard)
    alert(
      `Détails de ${candidature.prenom} ${candidature.nom}\n\nEmail: ${candidature.email}\nTéléphone: ${candidature.telephone}\nVille: ${candidature.ville}\nZone: ${candidature.zone}\n\nMotivation:\n${candidature.motivation}`,
    );
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">
            Chargement des candidatures...
          </span>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={loadCandidatures}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Candidatures</h1>
        <p className="text-gray-600">
          Gérez les demandes de franchise ({candidatures.length} candidature
          {candidatures.length > 1 ? "s" : ""})
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, email ou ville..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div className="sm:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "#5C95FF" } as React.CSSProperties}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="acceptee">Acceptées</option>
              <option value="refusee">Refusées</option>
            </select>
          </div>

          {/* Bouton actualiser */}
          <button
            onClick={loadCandidatures}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Actualiser
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total", count: candidatures.length, color: "#7E6C6C" },
            {
              label: "En attente",
              count: candidatures.filter((c) => c.statut === "en_attente")
                .length,
              color: "#5C95FF",
            },
            {
              label: "En cours",
              count: candidatures.filter((c) => c.statut === "en_cours").length,
              color: "#FFA9A3",
            },
            {
              label: "Acceptées",
              count: candidatures.filter((c) => c.statut === "acceptee").length,
              color: "#28a745",
            },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.count}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidat
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidatures.map((candidature) => (
                <tr key={candidature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3"
                        style={{ backgroundColor: "#7E6C6C" }}
                      >
                        {candidature.prenom[0]}
                        {candidature.nom[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {candidature.prenom} {candidature.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {candidature.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {candidature.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {candidature.telephone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {candidature.ville}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {candidature.zone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{
                        backgroundColor: getStatusColor(candidature.statut),
                      }}
                    >
                      {getStatusLabel(candidature.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(candidature.created_at).toLocaleDateString(
                      "fr-FR",
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(candidature)}
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

                      {candidature.statut === "en_attente" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(candidature.id, "acceptee")
                            }
                            className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                            title="Accepter"
                            disabled={updatingStatus === candidature.id}
                          >
                            {updatingStatus === candidature.id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(candidature.id, "refusee")
                            }
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Refuser"
                            disabled={updatingStatus === candidature.id}
                          >
                            {updatingStatus === candidature.id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCandidatures.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucune candidature trouvée
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== "all"
                ? "Modifiez vos filtres pour voir plus de résultats."
                : "Aucune candidature n'a encore été soumise."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidatures;
