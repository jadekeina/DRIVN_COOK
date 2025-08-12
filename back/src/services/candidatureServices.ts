// back/src/services/candidatureService.ts
const API_BASE_URL = "http://localhost:3002/api"; // Remplace par ton port API

export interface Candidature {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  zone: "urbaine" | "peripherie" | "evenementiel";
  experience_resto: "oui" | "non";
  commentaire_resto?: string;
  ancien_franchise: "oui" | "non";
  commentaire_franchise?: string;
  capital: "oui" | "non";
  motivation: string;
  cv_filename: string;
  lettre_filename: string;
  carte_filename: string;
  accept_terms: boolean;
  read_contract: boolean;
  statut: "en_attente" | "en_cours" | "acceptee" | "refusee";
  notes_internes?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatureStats {
  en_attente: number;
  en_cours: number;
  acceptee: number;
  refusee: number;
  total: number;
}

export const candidatureService = {
  // Récupérer toutes les candidatures
  async getAll(): Promise<Candidature[]> {
    try {
      const token = localStorage.getItem("token"); // Si tu as un système d'auth
      const response = await fetch(`${API_BASE_URL}/candidatures`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      throw new Error(
        data.message || "Erreur lors de la récupération des candidatures",
      );
    } catch (error) {
      console.error("Erreur getAll candidatures:", error);
      throw error;
    }
  },

  // Récupérer les statistiques
  async getStats(): Promise<CandidatureStats> {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/candidatures/stats`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      throw new Error(
        data.message || "Erreur lors de la récupération des statistiques",
      );
    } catch (error) {
      console.error("Erreur getStats candidatures:", error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une candidature
  async updateStatus(
    id: number,
    statut: string,
    notes_internes?: string,
  ): Promise<void> {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/candidatures/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            statut,
            notes_internes,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Erreur lors de la mise à jour du statut",
        );
      }
    } catch (error) {
      console.error("Erreur updateStatus candidature:", error);
      throw error;
    }
  },
};

export default candidatureService;
