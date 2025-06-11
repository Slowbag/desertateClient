/**
 * Authentication module
 */
class AuthModule {
    constructor() {
        this.init();
    }

    /**
     * Initialize the authentication module
     */
    init() {
        this.loginForm = document.getElementById('login-form');
        this.loginError = document.getElementById('login-error');
        this.errorMessage = document.getElementById('error-message');
        this.loginContainer = document.getElementById('login-container');
        this.dynamicContent = document.getElementById('dynamic-content');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('toggle-password');

        this.setupEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        if (this.togglePasswordBtn && this.passwordInput) {
            this.togglePasswordBtn.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }
        
        // Add input focus event listeners for animation effects
        const inputs = document.querySelectorAll('.auth-input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                const icon = input.parentElement.querySelector('.auth-input-icon');
                if (icon) {
                    icon.style.color = '#a777e3';
                }
            });
            
            input.addEventListener('blur', () => {
                const icon = input.parentElement.querySelector('.auth-input-icon');
                if (icon) {
                    icon.style.color = '#6c757d';
                }
            });
        });
    }
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const type = this.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        this.passwordInput.setAttribute('type', type);
        
        // Change the eye icon
        const icon = this.togglePasswordBtn.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    }

    /**
     * Handle login form submission
     * @param {Event} event - Form submit event
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        
        try {
            this.loginError.classList.add('d-none');
            const loginButton = this.loginForm.querySelector('button[type="submit"]');
            const buttonContent = loginButton.innerHTML;
            
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Вход...';
            
            const userData = await apiService.login(identifier, password);
            
            console.log('Login successful:', userData);
            
            // Update UI on successful login
            this.showLoggedInUI();
            
            // Trigger user data loading
            this.loadUserData();
        } catch (error) {
            console.error('Login failed:', error);
            this.errorMessage.textContent = error.message || 'Неверный логин или пароль';
            this.loginError.classList.remove('d-none');
            
            // Add shake animation to the auth card
            const authCard = document.querySelector('.auth-card');
            if (authCard) {
                authCard.classList.add('auth-shake');
                setTimeout(() => {
                    authCard.classList.remove('auth-shake');
                }, 500);
            }
        } finally {
            const loginButton = this.loginForm.querySelector('button[type="submit"]');
            loginButton.disabled = false;
            loginButton.innerHTML = '<span class="auth-btn-text">Войти</span> <i class="bi bi-arrow-right-circle ms-2"></i>';
        }
    }

    /**
     * Check authentication status on page load
     */
    checkAuthStatus() {
        if (apiService.isAuthenticated()) {
            this.showLoggedInUI();
            this.loadUserData();
        } else {
            this.showLoginUI();
        }
    }

    /**
     * Show the logged in UI
     */
    showLoggedInUI() {
        this.loginContainer.classList.add('d-none');
        this.dynamicContent.classList.remove('d-none');
        document.body.classList.remove('auth-page');
    }

    /**
     * Show the login UI
     */
    showLoginUI() {
        this.loginContainer.classList.remove('d-none');
        this.dynamicContent.classList.add('d-none');
        document.body.classList.add('auth-page');
    }

    /**
     * Load user data and organizations
     */
    async loadUserData() {
        try {
            const userData = await apiService.getCurrentUser();
            console.log('User data loaded:', userData);
            
            // Dispatch custom event for main.js to handle
            const event = new CustomEvent('userDataLoaded', { detail: userData });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error loading user data:', error);
            // Если ошибка авторизации (401), удаляем токен и показываем форму логина
            if (error.status === 401 || error.message === 'Не авторизован') {
                apiService.clearToken();
                this.showLoginUI();
            }
        }
    }

    /**
     * Log out the current user
     */
    logout() {
        apiService.clearToken();
        this.showLoginUI();
    }
}

// Initialize authentication module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authModule = new AuthModule();
}); 