/**
 * API Client для взаимодействия с REST API
 */
const API = {
    baseURL: '/api',

    getToken() {
        return localStorage.getItem('token');
    },

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
            }
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data));
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
    },

    /**
     * Получить все ссылки
     */
    async getAllLinks() {
        try {
            const response = await fetch(`${this.baseURL}/links`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching links:', error);
            throw error;
        }
    },

    /**
     * Получить ссылку по ID
     */
    async getLinkById(id) {
        try {
            const response = await fetch(`${this.baseURL}/links/${id}`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error(`Error fetching link ${id}:`, error);
            throw error;
        }
    },

    /**
     * Создать новую ссылку
     */
    async createLink(data) {
        try {
            const response = await fetch(`${this.baseURL}/links`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating link:', error);
            throw error;
        }
    },

    /**
     * Обновить ссылку
     */
    async updateLink(id, data) {
        try {
            const response = await fetch(`${this.baseURL}/links/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error updating link ${id}:`, error);
            throw error;
        }
    },

    /**
     * Удалить ссылку
     */
    async deleteLink(id) {
        try {
            const response = await fetch(`${this.baseURL}/links/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error(`Error deleting link ${id}:`, error);
            throw error;
        }
    },

    /**
     * Получить статистику
     */
    async getStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/links/stats`, {
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    }
};

/**
 * Утилиты для работы с UI
 */
const UI = {
    /**
     * Показать алерт
     */
    showAlert(message, type = 'info') {
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = alertHTML;
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }
    },

    /**
     * Форматировать дату
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};
