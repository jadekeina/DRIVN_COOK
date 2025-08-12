// services/authService.ts
const API_BASE_URL = 'http://localhost:3002/api';

export interface LoginResponse {
    success: boolean;
    message?: string;
    data?: {
        token: string;
        user: {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            role: string;
        };
    };
}

export const authService = {
    // Connexion
    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success && data.data?.token) {
                // Sauvegarder le token
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }

            return data;
        } catch (error) {
            console.error('Erreur login:', error);
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            };
        }
    },

    // Déconnexion
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // Vérifier si l'utilisateur est connecté
    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Récupérer l'utilisateur connecté
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Récupérer le token
    getToken(): string | null {
        return localStorage.getItem('token');
    }
};