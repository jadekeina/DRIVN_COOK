// Script de test pour vérifier les endpoints de l'API
// Utilisation: node test_api.js

const BASE_URL = 'http://localhost:3001/api';

// Fonction helper pour faire des requêtes
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

        console.log(`\n=== ${method} ${endpoint} ===`);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        return { status: response.status, data: result, token: result.data?.token };
    } catch (error) {
        console.error(`Erreur sur ${endpoint}:`, error.message);
        return null;
    }
}

// Tests séquentiels
async function runTests() {
    console.log('🧪 Début des tests API...\n');

    // 1. Test de l'endpoint de base
    await makeRequest('/');

    // 2. Test d'inscription
    const registerData = {
        email: 'test@example.com',
        password: 'motdepasse123',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'franchise_owner',
        phone: '+33123456789'
    };

    const registerResult = await makeRequest('/auth/register', 'POST', registerData);
    const userToken = registerResult?.token;

    // 3. Test de connexion
    const loginData = {
        email: 'test@example.com',
        password: 'motdepasse123'
    };

    const loginResult = await makeRequest('/auth/login', 'POST', loginData);
    const loginToken = loginResult?.token || userToken;

    // 4. Test du profil utilisateur
    if (loginToken) {
        await makeRequest('/auth/profile', 'GET', null, loginToken);
    }

    // 5. Test de récupération des franchises (public)
    await makeRequest('/franchises');

    // 6. Test de création d'une franchise (protégé)
    if (loginToken) {
        const franchiseData = {
            name: 'Franchise Test Paris',
            email: 'paris@test.com',
            phone: '+33123456789',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001'
        };

        await makeRequest('/franchises', 'POST', franchiseData, loginToken);
    }

    // 7. Test des franchises de l'utilisateur
    if (loginToken) {
        await makeRequest('/franchises/my/franchises', 'GET', null, loginToken);
    }

    console.log('\nTests terminés !');
}

// Exécuter les tests
runTests().catch(console.error);