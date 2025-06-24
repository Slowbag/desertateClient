/**
 * API Service for handling all API requests
 */
class ApiService {
    constructor() {
        this.baseUrl = 'https://y4xfjg-2a09-bac1-61a0-30--387-30.ru.tuna.am/api';
        this.token = localStorage.getItem('jwt');
    }

    /**
     * Set authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('jwt', token);
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('jwt');
    }

    /**
     * Login user
     * @param {string} identifier - Username or email
     * @param {string} password - User password
     * @returns {Promise} - Response from API
     */
    async login(identifier, password) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/local`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    password,
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                this.setToken(data.jwt);
                return data;
            } else {
                throw new Error(data.error?.message || 'Ошибка авторизации');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get current user with organizations and related data
     * @returns {Promise} - Response from API
     */
    async getCurrentUser() {
        if (!this.token) {
            throw new Error('Не авторизован');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/users/me?populate[Org][populate][Floor][populate][ImageMap]=*&populate[Org][populate][Floor][populate][Room][populate][ImageRoom]=*&populate[Org][populate][Floor][populate][audioFile]=*&populate[Org][populate][Floor][populate][Room][populate][audioFile]=*`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                    },
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                const error = await response.json();
                const err = new Error(error.error?.message || 'Ошибка получения данных пользователя');
                err.status = response.status;
                throw err;
            }
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated() {
        return !!this.token;
    }
}

// Create and export a single instance of ApiService
const apiService = new ApiService(); 