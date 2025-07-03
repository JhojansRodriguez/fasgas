// src/store/modules/accountability/index.js

const simulateApiCall = (data, delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
};

// Mock data for accountability records
// In a real system, this would link to vehicle trips/movements and staff.
const mockAccountabilityRecords = [
    {
        id: 'acc1',
        driverId: 'emp1', // Link to staff member
        vehicleId: 'veh1', // Link to vehicle used
        routeId: 'routeA', // Potentially a route identifier
        date: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
        cylindersSoldCash: [{ typeId: 'glp10', quantity: 10 }, { typeId: 'glp15', quantity: 5 }],
        cylindersSoldCredit: [{ typeId: 'glp10', quantity: 2 }],
        cylindersLoaned: [{ typeId: 'glp10', quantity: 1, customerInfo: 'Juan Pérez, Calle Falsa 123' }],
        cylindersReturnedToWarehouseFull: [{ typeId: 'glp15', quantity: 3 }], // Unsold
        cylindersCollectedEmpty: [{ typeId: 'glp10', quantity: 13 }, { typeId: 'glp15', quantity: 5 }],
        expenses: [
            { type: 'Combustible', amount: 50.75, description: 'Llenado de tanque' },
            { type: 'Viáticos', amount: 20.00, description: 'Almuerzo' },
        ],
        comments: 'Ruta completada sin inconvenientes mayores. Un cliente solicitó garrafa a crédito.',
        totalCashSales: 150.00, // Calculated, or entered by driver & verified
        totalCreditSales: 30.00, // Calculated
        totalExpenses: 70.75, // Calculated
        netAmount: 79.25, // Cash Sales - Expenses (or more complex logic)
        status: 'Pendiente Revisión', // e.g., Pendiente Revisión, Aprobado, Rechazado
    },
    {
        id: 'acc2',
        driverId: 'emp2',
        vehicleId: 'veh2',
        routeId: 'routeB',
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        cylindersSoldCash: [{ typeId: 'glp10', quantity: 18 }],
        cylindersSoldCredit: [],
        cylindersLoaned: [],
        cylindersReturnedToWarehouseFull: [{ typeId: 'glp10', quantity: 2 }],
        cylindersCollectedEmpty: [{ typeId: 'glp10', quantity: 15 }],
        expenses: [{ type: 'Combustible', amount: 60.00, description: 'Diesel' }],
        comments: 'Todo OK.',
        totalCashSales: 200.00,
        totalCreditSales: 0,
        totalExpenses: 60.00,
        netAmount: 140.00,
        status: 'Aprobado',
    }
];

const state = {
    accountabilityRecords: [],
    isLoading: false,
    error: null,
};

const getters = {
    allAccountabilityRecords: (state) => state.accountabilityRecords.sort((a,b) => new Date(b.date) - new Date(a.date)),
    getRecordById: (state) => (id) => state.accountabilityRecords.find(r => r.id === id),
    getRecordsByDriverId: (state) => (driverId) => state.accountabilityRecords.filter(r => r.driverId === driverId).sort((a,b) => new Date(b.date) - new Date(a.date)),
    pendingReviewRecords: (state) => state.accountabilityRecords.filter(r => r.status === 'Pendiente Revisión'),
    totalLoanedCylindersPending: (state) => {
        // This is a simplified sum. Real tracking would need individual loaned items status.
        return state.accountabilityRecords.reduce((total, record) => {
            if (record.status !== 'Aprobado' || record.cylindersLoaned.length > 0) { // Crude logic for "pending"
                 total += record.cylindersLoaned.reduce((sum, item) => sum + item.quantity, 0);
            }
            return total;
        }, 0);
    },
    isLoadingRecords: (state) => state.isLoading,
    recordsError: (state) => state.error,
};

const actions = {
    async fetchAccountabilityRecords({ commit }) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        try {
            const data = await simulateApiCall(mockAccountabilityRecords);
            commit('SET_RECORDS', data);
        } catch (error) {
            console.error("Error fetching accountability records:", error);
            commit('SET_ERROR', 'Error al cargar las rendiciones.');
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async submitAccountabilityRecord({ commit, dispatch }, recordData) {
        commit('SET_LOADING', true);
        try {
            const newRecord = {
                ...recordData,
                id: `acc${Date.now()}`,
                date: new Date().toISOString(),
                status: 'Pendiente Revisión', // Initial status
                // Calculate totals server-side ideally, but can do client-side for mock
                // totalCashSales, totalCreditSales, totalExpenses, netAmount
            };
            // Simulate API call
            const createdRecord = await simulateApiCall(newRecord);
            commit('ADD_RECORD', createdRecord);

            // Potentially, after submitting accountability, update inventory
            // This logic can be complex:
            // - Cylinders sold (cash/credit) reduce 'filled' stock (already done on departure by vehicle module).
            // - Cylinders loaned reduce 'filled' stock (if not already accounted for).
            // - Cylinders returned to warehouse (full) increase 'filled' stock.
            // - Cylinders collected (empty) increase 'empty' stock (already done on return by vehicle module).

            // Example: If full cylinders are returned to warehouse (unsold from truck load)
            for (const item of newRecord.cylindersReturnedToWarehouseFull) {
                await dispatch('inventory/updateCylinderCount', {
                    typeId: item.typeId,
                    filledChange: item.quantity, // Positive change, adding back to stock
                }, { root: true });
            }
            // Loaned cylinders also need to be handled in inventory if they weren't part of the initial load adjustment.
            // This depends on how "loaned" is defined: from truck stock or a separate pool.
            // For now, assume they came from the truck's "filled" stock and are now "out".
            // If they are returned later, that's another transaction.

            return createdRecord;
        } catch (error) {
            console.error("Error submitting accountability record:", error);
            commit('SET_ERROR', 'Error al enviar la rendición.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async updateAccountabilityRecordStatus({ commit }, { recordId, status, reviewerComments = '' }) {
        commit('SET_LOADING', true);
        try {
            // Simulate API call
            const payload = { recordId, status, reviewerComments, reviewedDate: new Date().toISOString() };
            const response = await simulateApiCall({ success: true, ...payload });
            if (response.success) {
                commit('UPDATE_RECORD_STATUS', payload);
            } else {
                throw new Error("Failed to update status on server.");
            }
        } catch (error) {
            console.error("Error updating record status:", error);
            commit('SET_ERROR', 'Error al actualizar el estado de la rendición.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    }
};

const mutations = {
    SET_RECORDS(state, records) {
        state.accountabilityRecords = records;
    },
    ADD_RECORD(state, record) {
        state.accountabilityRecords.unshift(record); // Add to the beginning of the list
    },
    UPDATE_RECORD_STATUS(state, { recordId, status, reviewerComments, reviewedDate }) {
        const index = state.accountabilityRecords.findIndex(r => r.id === recordId);
        if (index !== -1) {
            state.accountabilityRecords[index].status = status;
            state.accountabilityRecords[index].reviewerComments = reviewerComments;
            state.accountabilityRecords[index].reviewedDate = reviewedDate;
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
