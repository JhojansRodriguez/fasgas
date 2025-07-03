// src/store/modules/inventory/index.js
// Mock data simulating a backend API response
const mockInventoryData = {
    gasTypes: [
        { id: 'glp10', name: 'GLP 10Kg', filled: 150, empty: 30 },
        { id: 'glp15', name: 'GLP 15Kg', filled: 100, empty: 20 },
        { id: 'glp45', name: 'GLP 45Kg', filled: 50, empty: 10 },
    ],
    lastUpdated: new Date().toISOString(),
};

// Helper function to simulate API calls
const simulateApiCall = (data, delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
};

const state = {
    gasTypes: [], // Array of gas cylinder types with their counts
    isLoading: false,
    error: null,
    lastUpdated: null,
};

const getters = {
    totalFilledCylinders: (state) => {
        return state.gasTypes.reduce((total, type) => total + type.filled, 0);
    },
    totalEmptyCylinders: (state) => {
        return state.gasTypes.reduce((total, type) => total + type.empty, 0);
    },
    getInventoryByTypeId: (state) => (id) => {
        return state.gasTypes.find(type => type.id === id);
    },
    allInventory: (state) => state.gasTypes,
    isLoadingInventory: (state) => state.isLoading,
    inventoryError: (state) => state.error,
    inventoryLastUpdated: (state) => state.lastUpdated,
};

const actions = {
    async fetchInventory({ commit }) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        try {
            // Simulate API call
            const data = await simulateApiCall(mockInventoryData);
            commit('SET_INVENTORY', data.gasTypes);
            commit('SET_LAST_UPDATED', data.lastUpdated);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            commit('SET_ERROR', 'Error al cargar el inventario.');
        } finally {
            commit('SET_LOADING', false);
        }
    },

    // Action to update inventory, e.g., when a truck is loaded
    // payload: { typeId: 'glp10', filledChange: -20, emptyChange: 0 }
    async updateCylinderCount({ commit, state }, payload) {
        commit('SET_LOADING', true);
        try {
            // Simulate API call to update backend
            await simulateApiCall({ success: true, data: payload });

            const updatedGasTypes = state.gasTypes.map(type => {
                if (type.id === payload.typeId) {
                    return {
                        ...type,
                        filled: Math.max(0, type.filled + (payload.filledChange || 0)),
                        empty: Math.max(0, type.empty + (payload.emptyChange || 0)),
                    };
                }
                return type;
            });
            commit('SET_INVENTORY', updatedGasTypes);
            commit('SET_LAST_UPDATED', new Date().toISOString()); // Update timestamp
            // In a real app, you might want to refetch or get confirmation from backend
        } catch (error) {
            console.error("Error updating cylinder count:", error);
            commit('SET_ERROR', 'Error al actualizar el inventario.');
            // Potentially revert optimistic update or notify user
        } finally {
            commit('SET_LOADING', false);
        }
    },

    // Action for when vehicles return with empty cylinders
    // payload: { typeId: 'glp10', emptyCollected: 15 }
    async recordEmptyCylindersReturned({ dispatch }, payload) {
        // This is essentially an update where filled decreases (if they were from stock)
        // and empty increases.
        // For simplicity, let's assume 'emptyCollected' directly adds to empty stock for now.
        // A more complex scenario would track which filled ones became these empty ones.
        return dispatch('updateCylinderCount', {
            typeId: payload.typeId,
            emptyChange: payload.emptyCollected,
        });
    },

    // Action for when vehicles depart with filled cylinders
    // payload: { typeId: 'glp10', filledTaken: 20 }
    async recordFilledCylindersDeparted({ dispatch }, payload) {
        return dispatch('updateCylinderCount', {
            typeId: payload.typeId,
            filledChange: -payload.filledTaken,
        });
    },
     // Action to add a new gas type (for admin purposes, potentially)
    async addGasType({ commit, state }, newTypeData) {
        commit('SET_LOADING', true);
        try {
            // Simulate API call
            const createdType = await simulateApiCall({ ...newTypeData, id: `custom_${Date.now()}`, filled: parseInt(newTypeData.filled) || 0, empty: parseInt(newTypeData.empty) || 0 });
            const newGasTypes = [...state.gasTypes, createdType];
            commit('SET_INVENTORY', newGasTypes);
            commit('SET_LAST_UPDATED', new Date().toISOString());
        } catch (error) {
            console.error("Error adding gas type:", error);
            commit('SET_ERROR', 'Error al añadir nuevo tipo de garrafa.');
        } finally {
            commit('SET_LOADING', false);
        }
    },
};

const mutations = {
    SET_INVENTORY(state, gasTypes) {
        state.gasTypes = gasTypes;
    },
    SET_LOADING(state, isLoading) {
        state.isLoading = isLoading;
    },
    SET_ERROR(state, error) {
        state.error = error;
    },
    SET_LAST_UPDATED(state, timestamp) {
        state.lastUpdated = timestamp;
    },
    // Example of a direct mutation, though actions are preferred for async or complex logic
    // UPDATE_SINGLE_GAS_TYPE_COUNT(state, { typeId, filled, empty }) {
    //     const typeIndex = state.gasTypes.findIndex(type => type.id === typeId);
    //     if (typeIndex !== -1) {
    //         if (filled !== undefined) state.gasTypes[typeIndex].filled = filled;
    //         if (empty !== undefined) state.gasTypes[typeIndex].empty = empty;
    //     }
    // }
};

export default {
    namespaced: true, // Important for modular store
    state,
    getters,
    actions,
    mutations,
};
