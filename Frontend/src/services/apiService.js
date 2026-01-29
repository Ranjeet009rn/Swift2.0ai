import { API_ENDPOINTS, getAuthHeaders, getAuthToken, setAuthToken, removeAuthToken, setStoredUser } from '../config/api';

class ApiService {
    // Generic request method
    async request(url, options = {}) {
        try {
            // Append token to URL for GET requests (Fallback for WAMP header stripping)
            const token = getAuthToken();
            if (token && (!options.method || options.method === 'GET')) {
                const separator = url.includes('?') ? '&' : '?';
                url = `${url}${separator}token=${token}`;
            }

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...options.headers,
                },
            });

            const data = await response.json();

            // Handle 401 specifically
            if (response.status === 401) {
                console.warn('Authentication failed - redirecting to login');
                // Clear invalid token
                removeAuthToken();
                // Redirect to login if in browser
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                throw new Error('Authentication required. Please login again.');
            }

            if (!data.success) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        const data = await this.request(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.success && data.data.token) {
            setAuthToken(data.data.token);
            setStoredUser(data.data.user);
        }

        return data;
    }

    async getCurrentUser() {
        return await this.request(API_ENDPOINTS.ME);
    }

    async register(userData) {
        return await this.request(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        removeAuthToken();
    }

    // Dashboard
    async getDashboard() {
        return await this.request(API_ENDPOINTS.DASHBOARD);
    }

    // Profile
    async getProfile() {
        return await this.request(API_ENDPOINTS.PROFILE);
    }

    async updateProfile(profileData) {
        return await this.request(API_ENDPOINTS.PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    // Packages
    async getPackages() {
        return await this.request(API_ENDPOINTS.PACKAGES);
    }

    async purchasePackage(packageId, paymentMethod) {
        return await this.request(API_ENDPOINTS.PURCHASE_PACKAGE, {
            method: 'POST',
            body: JSON.stringify({ package_id: packageId, payment_method: paymentMethod }),
        });
    }

    // Wallet
    async getWallet() {
        return await this.request(API_ENDPOINTS.WALLET);
    }

    // Income
    async getIncome(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const url = `${API_ENDPOINTS.INCOME}${queryParams ? `?${queryParams}` : ''}`;
        return await this.request(url);
    }

    // Withdrawals
    async getWithdrawals() {
        return await this.request(API_ENDPOINTS.WITHDRAWAL);
    }

    async createWithdrawal(amount, bankAccountId) {
        return await this.request(API_ENDPOINTS.WITHDRAWAL, {
            method: 'POST',
            body: JSON.stringify({ amount, bank_account_id: bankAccountId }),
        });
    }

    // Check User for Reference
    async checkUser(searchTerm) {
        return await this.request(`${API_ENDPOINTS.CHECK_USER}?search=${encodeURIComponent(searchTerm)}`);
    }

    // Team
    async getTeam(userId = null) {
        const url = userId ? `${API_ENDPOINTS.TEAM}?user_id=${userId}` : API_ENDPOINTS.TEAM;
        return await this.request(url);
    }

    async getUserDetails(userId) {
        return await this.request(`${API_ENDPOINTS.GET_USER_DETAILS}?user_id=${userId}`);
    }

    async updateUser(userId, userData) {
        return await this.request(API_ENDPOINTS.UPDATE_USER, {
            method: 'PUT',
            body: JSON.stringify({ user_id: userId, ...userData }),
        });
    }

    // Bank Accounts
    async getBankAccounts() {
        return await this.request(API_ENDPOINTS.BANK);
    }

    async addBankAccount(bankData) {
        return await this.request(API_ENDPOINTS.BANK, {
            method: 'POST',
            body: JSON.stringify(bankData),
        });
    }

    async deleteBankAccount(accountId) {
        return await this.request(`${API_ENDPOINTS.BANK}?id=${accountId}`, {
            method: 'DELETE',
        });
    }

    // KYC
    async getKYC() {
        return await this.request(API_ENDPOINTS.KYC);
    }

    async submitKYC(formData) {
        const token = localStorage.getItem('authToken');
        const response = await fetch(API_ENDPOINTS.KYC, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData, // FormData for file upload
        });

        return await response.json();
    }

    // Notifications
    async getNotifications(unreadOnly = false) {
        const url = `${API_ENDPOINTS.NOTIFICATIONS}${unreadOnly ? '?unread=true' : ''}`;
        return await this.request(url);
    }

    async markNotificationAsRead(notificationId) {
        return await this.request(API_ENDPOINTS.NOTIFICATIONS, {
            method: 'PUT',
            body: JSON.stringify({ notification_id: notificationId }),
        });
    }

    async markAllNotificationsAsRead() {
        return await this.request(API_ENDPOINTS.NOTIFICATIONS, {
            method: 'PUT',
            body: JSON.stringify({ mark_all_read: true }),
        });
    }

    // Support
    async getSupportTickets() {
        return await this.request(API_ENDPOINTS.SUPPORT);
    }

    async getTicketDetails(ticketId) {
        return await this.request(`${API_ENDPOINTS.SUPPORT}?ticket_id=${ticketId}`);
    }

    async createSupportTicket(ticketData) {
        return await this.request(API_ENDPOINTS.SUPPORT, {
            method: 'POST',
            body: JSON.stringify(ticketData),
        });
    }

    // Change Password
    async changePassword(currentPassword, newPassword) {
        return await this.request(API_ENDPOINTS.CHANGE_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
    }

    // Stats
    async getStats() {
        return await this.request(API_ENDPOINTS.STATS);
    }

    // Admin
    async getAdminUsers() {
        return await this.request(API_ENDPOINTS.ADMIN_USERS);
    }

    async getAdminUserDetails(userId) {
        return await this.request(`${API_ENDPOINTS.ADMIN_USER_DETAILS}?user_id=${userId}`);
    }

    async adminManageUser(action, userId, data = {}) {
        return await this.request(API_ENDPOINTS.ADMIN_USERS, {
            method: 'POST',
            body: JSON.stringify({ action, user_id: userId, ...data }),
        });
    }

    async getAdminTree(userId = null, type = 'hierarchy') {
        const url = `${API_ENDPOINTS.ADMIN_TREE}?type=${type}${userId ? `&user_id=${userId}` : ''}`;
        return await this.request(url);
    }

    async getAdminTransactions() {
        return await this.request(API_ENDPOINTS.ADMIN_TRANSACTIONS);
    }

    // Franchise
    async getFranchiseDashboard() {
        return await this.request(API_ENDPOINTS.FRANCHISE_DASHBOARD);
    }

    async getFranchiseProfile() {
        return await this.request(API_ENDPOINTS.FRANCHISE_PROFILE);
    }

    async updateFranchiseProfile(data) {
        return await this.request(API_ENDPOINTS.FRANCHISE_PROFILE, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getFranchiseInventory() {
        return await this.request(API_ENDPOINTS.FRANCHISE_INVENTORY);
    }

    async getFranchiseTree() {
        return await this.request(API_ENDPOINTS.FRANCHISE_TREE);
    }
}

const apiService = new ApiService();
export default apiService;
