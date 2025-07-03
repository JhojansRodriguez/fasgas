// src/store/modules/vehicles/index.js

// Helper function to simulate API calls
const simulateApiCall = (data, delay = 500) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
};

// Mock data
const mockVehicles = [
    { id: 'veh1', plate: 'ABC-123', model: 'Toyota Hilux 2019', status: 'Disponible', driverId: null, currentLoad: [] },
    { id: 'veh2', plate: 'XYZ-789', model: 'Nissan Frontier 2021', status: 'En Ruta', driverId: 'emp2', currentLoad: [{ typeId: 'glp10', quantity: 20 }] },
    { id: 'veh3', plate: 'DEF-456', model: 'Mitsubishi L200 2020', status: 'Mantenimiento', driverId: null, currentLoad: [] },
];

const mockVehicleMovements = [
    { id: 'mov1', vehicleId: 'veh2', type: 'Salida', dateTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), driverId: 'emp2', loaded: [{ typeId: 'glp10', quantity: 20 }], returnedEmpty: [] },
    { id: 'mov2', vehicleId: 'veh1', type: 'Salida', dateTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), driverId: 'emp1', loaded: [{ typeId: 'glp10', quantity: 15 }, { typeId: 'glp15', quantity: 10 }], returnedEmpty: [] },
    { id: 'mov3', vehicleId: 'veh1', type: 'Retorno', dateTime: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), driverId: 'emp1', loaded: [], returnedEmpty: [{ typeId: 'glp10', quantity: 13 }, { typeId: 'glp15', quantity: 9 }] },
];


const state = {
    vehicles: [],
    vehicleMovements: [], // History of all vehicle movements
    isLoading: false,
    error: null,
};

const getters = {
    allVehicles: (state) => state.vehicles,
    getVehicleById: (state) => (id) => state.vehicles.find(v => v.id === id),
    availableVehicles: (state) => state.vehicles.filter(v => v.status === 'Disponible'),
    vehiclesOnRoute: (state) => state.vehicles.filter(v => v.status === 'En Ruta'),
    getMovementsByVehicleId: (state) => (vehicleId) => {
        return state.vehicleMovements.filter(m => m.vehicleId === vehicleId).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    },
    isLoadingVehicles: (state) => state.isLoading,
    vehicleError: (state) => state.error,
};

const actions = {
    async fetchVehicles({ commit }) {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        try {
            const data = await simulateApiCall({ vehicles: mockVehicles, movements: mockVehicleMovements });
            commit('SET_VEHICLES', data.vehicles);
            commit('SET_VEHICLE_MOVEMENTS', data.movements);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            commit('SET_ERROR', 'Error al cargar los vehículos.');
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async addVehicle({ commit, state }, vehicleData) {
        commit('SET_LOADING', true);
        try {
            const newVehicle = { ...vehicleData, id: `veh${Date.now()}`, status: 'Disponible', currentLoad: [] };
            // Simulate API call
            const createdVehicle = await simulateApiCall(newVehicle);
            commit('ADD_VEHICLE', createdVehicle);
        } catch (error) {
            console.error("Error adding vehicle:", error);
            commit('SET_ERROR', 'Error al añadir el vehículo.');
            throw error; // Re-throw to be caught by component
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async updateVehicle({ commit }, vehicleData) {
        commit('SET_LOADING', true);
        try {
            // Simulate API call
            const updatedVehicle = await simulateApiCall(vehicleData);
            commit('UPDATE_VEHICLE', updatedVehicle);
        } catch (error) {
            console.error("Error updating vehicle:", error);
            commit('SET_ERROR', 'Error al actualizar el vehículo.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },

    // dispatch from inventory module when processing vehicle departures/returns
    // This action assumes inventory module handles actual stock changes.
    // This module just records the movement and updates vehicle status/load.
    async recordVehicleDeparture({ commit, rootState, dispatch }, { vehicleId, driverId, itemsLoaded }) {
        // itemsLoaded: [{ typeId: 'glp10', quantity: 20 }, ...]
        commit('SET_LOADING', true);
        try {
            const vehicle = rootState.vehicles.vehicles.find(v => v.id === vehicleId);
            if (!vehicle) throw new Error("Vehículo no encontrado");

            const movement = {
                id: `mov${Date.now()}`,
                vehicleId,
                type: 'Salida',
                dateTime: new Date().toISOString(),
                driverId,
                loaded: itemsLoaded, // Garrafas llenas cargadas
                returnedEmpty: [] // No aplica en salida
            };
            // Simulate API call
            const recordedMovement = await simulateApiCall(movement);
            commit('ADD_VEHICLE_MOVEMENT', recordedMovement);

            // Update vehicle status and current load
            const updatedVehicleData = {
                ...vehicle,
                status: 'En Ruta',
                driverId: driverId,
                currentLoad: itemsLoaded
            };
            commit('UPDATE_VEHICLE', updatedVehicleData);

            // Dispatch actions to inventory module to update stock
            // This is crucial for automatic inventory updates
            for (const item of itemsLoaded) {
                await dispatch('inventory/recordFilledCylindersDeparted', {
                    typeId: item.typeId,
                    filledTaken: item.quantity,
                }, { root: true });
            }

        } catch (error) {
            console.error("Error recording vehicle departure:", error);
            commit('SET_ERROR', 'Error al registrar la salida del vehículo.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },

    async recordVehicleReturn({ commit, rootState, dispatch }, { vehicleId, itemsReturnedEmpty }) {
        // itemsReturnedEmpty: [{ typeId: 'glp10', quantity: 18 }, ...]
        commit('SET_LOADING', true);
        try {
            const vehicle = rootState.vehicles.vehicles.find(v => v.id === vehicleId);
            if (!vehicle) throw new Error("Vehículo no encontrado");

            const movement = {
                id: `mov${Date.now()}`,
                vehicleId,
                type: 'Retorno',
                dateTime: new Date().toISOString(),
                driverId: vehicle.driverId, // Should be same driver or updated if changed
                loaded: [], // No aplica en retorno de esta forma
                returnedEmpty: itemsReturnedEmpty, // Garrafas vacías recogidas
            };
            // Simulate API call
            const recordedMovement = await simulateApiCall(movement);
            commit('ADD_VEHICLE_MOVEMENT', recordedMovement);

            // Update vehicle status and clear load
            const updatedVehicleData = {
                ...vehicle,
                status: 'Disponible', // Or 'Requiere Limpieza/Revisión'
                driverId: null, // Clear driver or handle differently
                currentLoad: [] // Clear load
            };
            commit('UPDATE_VEHICLE', updatedVehicleData);

            // Dispatch actions to inventory module to update stock
            for (const item of itemsReturnedEmpty) {
                await dispatch('inventory/recordEmptyCylindersReturned', {
                    typeId: item.typeId,
                    emptyCollected: item.quantity,
                }, { root: true });
            }

        } catch (error) {
            console.error("Error recording vehicle return:", error);
            commit('SET_ERROR', 'Error al registrar el retorno del vehículo.');
            throw error;
        } finally {
            commit('SET_LOADING', false);
        }
    },
};

const mutations = {
    SET_VEHICLES(state, vehicles) {
        state.vehicles = vehicles;
    },
    ADD_VEHICLE(state, vehicle) {
        state.vehicles.push(vehicle);
    },
    UPDATE_VEHICLE(state, updatedVehicle) {
        const index = state.vehicles.findIndex(v => v.id === updatedVehicle.id);
        if (index !== -1) {
            state.vehicles.splice(index, 1, updatedVehicle);
        }
    },
    SET_VEHICLE_MOVEMENTS(state, movements) {
        state.vehicleMovements = movements;
    },
    ADD_VEHICLE_MOVEMENT(state, movement) {
        state.vehicleMovements.push(movement);
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
