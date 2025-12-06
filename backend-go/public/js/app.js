/**
 * API Client для взаимодействия с REST API
 */
const API = {
    baseURL: '/api',

    /**
     * Получить все ссылки
     */
    async getAllLinks() {
        try {
            const response = await fetch(`${this.baseURL}/links`);
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
            const response = await fetch(`${this.baseURL}/links/${id}`);
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
                headers: {
                    'Content-Type': 'application/json'
                },
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
                headers: {
                    'Content-Type': 'application/json'
                },
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
                method: 'DELETE'
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
            const response = await fetch(`${this.baseURL}/links/stats`);
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
