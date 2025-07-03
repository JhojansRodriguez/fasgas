// src/store/modules/staff/index.js

const simulateApiCall = (data, delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
};

// Mock data for staff members
const mockStaff = [
    { id: 'emp1', name: 'Carlos Pérez', cargo: 'Chofer', contact: 'carlos.perez@example.com | 123-456-7890', status: 'Activo' },
    { id: 'emp2', name: 'Ana Gómez', cargo: 'Chofer', contact: 'ana.gomez@example.com | 987-654-3210', status: 'Activo' },
    { id: 'emp3', name: 'Luis Fernández', cargo: 'Logística', contact: 'luis.fernandez@example.com | 555-123-4567', status: 'Activo' },
    { id: 'emp4', name: 'Maria Rodríguez', cargo: 'Ventas', contact: 'maria.rodriguez@example.com | 555-987-6543', status: 'Activo' },
    { id: 'emp5', name: 'Pedro Sánchez', cargo: 'Administrador', contact: 'pedro.sanchez@example.com | 555-111-2222', status: 'Activo' },
    { id: 'emp6', name: 'Laura Jiménez', cargo: 'Chofer', contact: 'laura.jimenez@example.com | 123-123-1234', status: 'Inactivo' },
];

const state = {
    staffMembers: [],
    isLoading: false,
    error: null,
};

const getters = {
    allStaffMembers: (state) => state.staffMembers,
    getStaffMemberById: (state) => (id) => state.staffMembers.find(s => s.id === id),
    activeStaffMembers: (state) => state.staffMembers.filter(s => s.status === 'Activo'),
    drivers: (state) => state.staffMembers.filter(s => s.cargo === 'Chofer' && s.status === 'Activo'),
    isLoadingStaff: (state) => state.isLoading,
    staffError: (state) => state.error,
};

const actions = {
    async fetchStaff({ commit }) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        try {
            const data = await simulateApiCall(mockStaff);
            commit('SET_STAFF', data);
        } catch (error) {
            console.error("Error fetching staff:", error);
            commit('SET_ERROR', 'Error al cargar el personal.');
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async addStaffMember({ commit }, staffData) {
        commit('SET_LOADING', true);
        try {
            const newMember = { ...staffData, id: `emp${Date.now()}`, status: 'Activo' }; // Default status to Active
            // Simulate API call
            const createdMember = await simulateApiCall(newMember);
            commit('ADD_STAFF_MEMBER', createdMember);
            return createdMember;
        } catch (error) {
            console.error("Error adding staff member:", error);
            commit('SET_ERROR', 'Error al añadir el miembro del personal.');
            throw error; // Re-throw to be caught by component
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async updateStaffMember({ commit }, staffData) {
        commit('SET_LOADING', true);
        try {
            // Simulate API call
            const updatedMember = await simulateApiCall(staffData);
            commit('UPDATE_STAFF_MEMBER', updatedMember);
            return updatedMember;
        } catch (error) {
            console.error("Error updating staff member:", error);
            commit('SET_ERROR', 'Error al actualizar el miembro del personal.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },
    // Note: Assigning drivers to vehicles is handled in the vehicles module
    // or a future dedicated operational module. This module focuses on CRUD for staff.
};

const mutations = {
    SET_STAFF(state, staffMembers) {
        state.staffMembers = staffMembers;
    },
    ADD_STAFF_MEMBER(state, member) {
        state.staffMembers.push(member);
    },
    UPDATE_STAFF_MEMBER(state, updatedMember) {
        const index = state.staffMembers.findIndex(s => s.id === updatedMember.id);
        if (index !== -1) {
            state.staffMembers.splice(index, 1, updatedMember);
        }
    },
    SET_LOADING(state, isLoading) {
        state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
        state.error = error;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
