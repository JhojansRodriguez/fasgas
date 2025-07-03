// src/store/modules/auth/index.js

// Simulate API call for login
const simulateLoginApi = (credentials) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Mock users - In a real app, this comes from a secure backend
            const users = {
                'admin@example.com': { id: 'userAdmin', name: 'Admin User', email: 'admin@example.com', role: 'Administrador' },
                'logistica@example.com': { id: 'userLogistica', name: 'Logistics User', email: 'logistica@example.com', role: 'Logística' },
                'ventas@example.com': { id: 'userVentas', name: 'Sales User', email: 'ventas@example.com', role: 'Ventas' },
                'chofer@example.com': { id: 'userChofer', name: 'Driver User', email: 'chofer@example.com', role: 'Chofer' },
            };
            const user = users[credentials.email];
            if (user && credentials.password === 'password') { // Simplified password check
                resolve({ token: `fake-jwt-token-for-${user.id}`, user });
            } else {
                reject('Invalid credentials');
            }
        }, 500);
    });
};

const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
    // Predefined roles for the system - could also be fetched from backend
    availableRoles: ['Administrador', 'Logística', 'Ventas', 'Chofer', 'Invitado'],
};

const getters = {
    isAuthenticated: (state) => !!state.user && !!state.token,
    currentUser: (state) => state.user,
    userRole: (state) => state.user ? state.user.role : 'Invitado', // Default to 'Invitado' if no user
    isLoadingAuth: (state) => state.isLoading,
    authError: (state) => state.error,
    getToken: (state) => state.token,
};

const actions = {
    async login({ commit }, credentials) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        try {
            const { token, user } = await simulateLoginApi(credentials);
            commit('SET_USER', user);
            commit('SET_TOKEN', token);
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            return user;
        } catch (error) {
            commit('SET_ERROR', error || 'Failed to login.');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },

    logout({ commit }) {
        commit('SET_LOADING', true);
        commit('CLEAR_AUTH_DATA');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Optionally: notify backend about logout
        commit('SET_LOADING', false);
        // No need to return anything, router will handle redirect
    },

    // Action to check if current user has a specific role or one of an array of roles
    hasRole({ getters }, rolesToCheck) {
        const currentUserRole = getters.userRole;
        if (Array.isArray(rolesToCheck)) {
            return rolesToCheck.includes(currentUserRole);
        }
        return currentUserRole === rolesToCheck;
    },

    // Initialize auth state from localStorage on app load (called in main.js or App.vue)
    // This is implicitly handled by initializing state from localStorage directly.
    // An explicit action could be:
    // initializeAuth({ commit }) {
    //     const user = JSON.parse(localStorage.getItem('user'));
    //     const token = localStorage.getItem('token');
    //     if (user && token) {
    //         commit('SET_USER', user);
    //         commit('SET_TOKEN', token);
    //     }
    // }
    // For development: Simulate login to have a user for testing UI elements
    async simulateLogin({ commit }, userDetails = { name: 'Desarrollador', role: 'Administrador', email: 'dev@example.com', id:'devUser' }) {
        commit('SET_USER', userDetails);
        commit('SET_TOKEN', 'dev-token');
         localStorage.setItem('user', JSON.stringify(userDetails));
         localStorage.setItem('token', 'dev-token');
    }
};

const mutations = {
    SET_USER(state, user) {
        state.user = user;
    },
    SET_TOKEN(state, token) {
        state.token = token;
    },
    SET_LOADING(state, isLoading) {
        state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
        state.error = error;
    },
    CLEAR_AUTH_DATA(state) {
        state.user = null;
        state.token = null;
        state.error = null;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
