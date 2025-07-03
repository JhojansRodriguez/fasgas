<template>
  <div class="vehicles-view container">
    <header class="view-header">
      <h1>Gestión de Vehículos</h1>
      <button @click="openVehicleModal()" class="btn primary">Registrar Nuevo Vehículo</button>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="loader"></div>
      <p>Cargando vehículos...</p>
    </div>

    <div v-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
      <button @click="fetchVehicleData" class="btn btn-sm btn-primary">Reintentar</button>
    </div>

    <section v-if="!isLoading && !error">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Listado de Vehículos</h2>
        </div>
        <div class="styled-table-container">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Estado</th>
                <th>Chofer Asignado</th>
                <th>Carga Actual</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="vehicles.length === 0">
                <td colspan="6" class="text-center">No hay vehículos registrados.</td>
              </tr>
              <tr v-for="vehicle in vehicles" :key="vehicle.id">
                <td>{{ vehicle.plate }}</td>
                <td>{{ vehicle.model }}</td>
                <td><span :class="statusClass(vehicle.status)">{{ vehicle.status }}</span></td>
                <td>{{ getDriverName(vehicle.driverId) }}</td>
                <td>
                  <ul v-if="vehicle.currentLoad && vehicle.currentLoad.length > 0" class="compact-list">
                    <li v-for="item in vehicle.currentLoad" :key="item.typeId">
                      {{ getGasTypeName(item.typeId) }}: {{ item.quantity }}
                    </li>
                  </ul>
                  <span v-else>-</span>
                </td>
                <td class="actions">
                  <button @click="openVehicleModal(vehicle)" class="btn btn-sm accent">Editar</button>
                  <button @click="openDepartureModal(vehicle)" class="btn btn-sm primary" :disabled="vehicle.status !== 'Disponible'">Registrar Salida</button>
                  <button @click="openReturnModal(vehicle)" class="btn btn-sm secondary" :disabled="vehicle.status !== 'En Ruta'">Registrar Retorno</button>
                  <button @click="viewVehicleHistory(vehicle)" class="btn btn-sm info">Historial</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Modal para Añadir/Editar Vehículo -->
    <VehicleFormModal
      v-if="showVehicleFormModal"
      :visible="showVehicleFormModal"
      :vehicle-data="editingVehicle"
      @close="closeVehicleModal"
      @save="handleVehicleSave"
    />

    <!-- Modal para Registrar Salida de Vehículo -->
    <VehicleDepartureModal
      v-if="showDepartureFormModal"
      :visible="showDepartureFormModal"
      :vehicle="selectedVehicleForMovement"
      :drivers="availableDrivers"
      :gas-types="gasTypesForForm"
      @close="closeDepartureModal"
      @save="handleDepartureSave"
    />

    <!-- Modal para Registrar Retorno de Vehículo -->
    <VehicleReturnModal
      v-if="showReturnFormModal"
      :visible="showReturnFormModal"
      :vehicle="selectedVehicleForMovement"
      :gas-types-loaded="selectedVehicleForMovement ? selectedVehicleForMovement.currentLoad : []"
      :all-gas-types="gasTypesForForm"
      @close="closeReturnModal"
      @save="handleReturnSave"
    />

    <!-- Modal para Historial de Vehículo -->
    <VehicleHistoryModal
      v-if="showHistoryModal"
      :visible="showHistoryModal"
      :vehicle="selectedVehicleForHistory"
      :movements="vehicleMovements"
      :get-driver-name="getDriverName"
      :get-gas-type-name="getGasTypeName"
      @close="closeHistoryModal"
    />

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import VehicleFormModal from '../../components/vehicles/VehicleFormModal.vue';
import VehicleDepartureModal from '../../components/vehicles/VehicleDepartureModal.vue';
import VehicleReturnModal from '../../components/vehicles/VehicleReturnModal.vue';
import VehicleHistoryModal from '../../components/vehicles/VehicleHistoryModal.vue';
// Mock staff data for driver names - will be replaced by actual staff module later
const mockStaff = [
    { id: 'emp1', name: 'Carlos Pérez', cargo: 'Chofer' },
    { id: 'emp2', name: 'Ana Gómez', cargo: 'Chofer' },
    { id: 'emp3', name: 'Luis Fernández', cargo: 'Logística' },
];


export default {
  name: 'VehiclesView',
  components: {
    VehicleFormModal,
    VehicleDepartureModal,
    VehicleReturnModal,
    VehicleHistoryModal,
  },
  setup() {
    const store = useStore();

    const vehicles = computed(() => store.getters['vehicles/allVehicles']);
    const isLoading = computed(() => store.getters['vehicles/isLoadingVehicles'] || store.getters['inventory/isLoadingInventory']);
    const error = computed(() => store.getters['vehicles/vehicleError'] || store.getters['inventory/inventoryError']);
    const gasTypes = computed(() => store.getters['inventory/allInventory']);
    // Replace with actual staff store data when available
    const staff = ref(mockStaff);
    const availableDrivers = computed(() => staff.value.filter(s => s.cargo === 'Chofer'));

    const showVehicleFormModal = ref(false);
    const editingVehicle = ref(null);

    const showDepartureFormModal = ref(false);
    const showReturnFormModal = ref(false);
    const selectedVehicleForMovement = ref(null);

    const showHistoryModal = ref(false);
    const selectedVehicleForHistory = ref(null);
    const vehicleMovements = ref([]);


    const fetchVehicleData = () => {
      store.dispatch('vehicles/fetchVehicles');
    };
    const fetchInventoryData = () => {
      store.dispatch('inventory/fetchInventory');
    };

    onMounted(() => {
      fetchVehicleData();
      if (gasTypes.value.length === 0) {
        fetchInventoryData();
      }
      // Fetch staff data here when staff module is ready
      // store.dispatch('staff/fetchStaff');
    });

    const getDriverName = (driverId) => {
      if (!driverId) return 'N/A';
      const driver = staff.value.find(s => s.id === driverId);
      return driver ? driver.name : 'Desconocido';
    };

    const getGasTypeName = (typeId) => {
      const gasType = gasTypes.value.find(gt => gt.id === typeId);
      return gasType ? gasType.name : 'Desconocido';
    };

    const gasTypesForForm = computed(() => gasTypes.value.map(gt => ({id: gt.id, name: gt.name, filled: gt.filled })));


    const openVehicleModal = (vehicle = null) => {
      editingVehicle.value = vehicle ? { ...vehicle } : null;
      showVehicleFormModal.value = true;
    };
    const closeVehicleModal = () => {
      showVehicleFormModal.value = false;
      editingVehicle.value = null;
    };
    const handleVehicleSave = async (vehicleData) => {
      try {
        if (vehicleData.id) {
          await store.dispatch('vehicles/updateVehicle', vehicleData);
        } else {
          await store.dispatch('vehicles/addVehicle', vehicleData);
        }
        closeVehicleModal();
      } catch (err) {
        // Error should be handled by the modal, or display a general error here
        console.error("Failed to save vehicle:", err);
        // Optionally: show a notification to the user
      }
    };

    const openDepartureModal = (vehicle) => {
      selectedVehicleForMovement.value = vehicle;
      showDepartureFormModal.value = true;
    };
    const closeDepartureModal = () => {
      showDepartureFormModal.value = false;
      selectedVehicleForMovement.value = null;
    };
    const handleDepartureSave = async (departureData) => {
      try {
        await store.dispatch('vehicles/recordVehicleDeparture', departureData);
        closeDepartureModal();
        fetchVehicleData(); // Re-fetch to update vehicle list and status
        fetchInventoryData(); // Re-fetch to update inventory counts
      } catch (err) {
        console.error("Failed to save departure:", err);
      }
    };

    const openReturnModal = (vehicle) => {
      selectedVehicleForMovement.value = vehicle;
      showReturnFormModal.value = true;
    };
    const closeReturnModal = () => {
      showReturnFormModal.value = false;
      selectedVehicleForMovement.value = null;
    };
    const handleReturnSave = async (returnData) => {
       try {
        await store.dispatch('vehicles/recordVehicleReturn', returnData);
        closeReturnModal();
        fetchVehicleData(); // Re-fetch to update vehicle list and status
        fetchInventoryData(); // Re-fetch to update inventory counts
      } catch (err) {
        console.error("Failed to save return:", err);
      }
    };

    const viewVehicleHistory = async (vehicle) => {
      selectedVehicleForHistory.value = vehicle;
      // In a real app, you might fetch specific history if it's paginated or large
      // For now, we assume all movements are in the store or fetched with allVehicles
      vehicleMovements.value = store.getters['vehicles/getMovementsByVehicleId'](vehicle.id);
      showHistoryModal.value = true;
    };
    const closeHistoryModal = () => {
      showHistoryModal.value = false;
      selectedVehicleForHistory.value = null;
      vehicleMovements.value = [];
    };

    const statusClass = (status) => {
      if (status === 'Disponible') return 'status-available';
      if (status === 'En Ruta') return 'status-onroute';
      if (status === 'Mantenimiento') return 'status-maintenance';
      return '';
    };

    return {
      vehicles,
      isLoading,
      error,
      fetchVehicleData,
      showVehicleFormModal,
      editingVehicle,
      openVehicleModal,
      closeVehicleModal,
      handleVehicleSave,
      getDriverName,
      getGasTypeName,
      statusClass,
      availableDrivers,
      gasTypesForForm,
      showDepartureFormModal,
      openDepartureModal,
      closeDepartureModal,
      handleDepartureSave,
      selectedVehicleForMovement,
      showReturnFormModal,
      openReturnModal,
      closeReturnModal,
      handleReturnSave,
      showHistoryModal,
      selectedVehicleForHistory,
      vehicleMovements,
      viewVehicleHistory,
      closeHistoryModal,
    };
  },
};
</script>

<style scoped>
.vehicles-view {
  padding-top: var(--spacing-lg);
}
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}
.view-header h1 {
  margin-top: 0;
}

.status-available {
  color: var(--color-success);
  font-weight: bold;
}
.status-onroute {
  color: var(--color-accent);
  font-weight: bold;
}
.status-maintenance {
  color: var(--color-error);
  font-weight: bold;
}

.styled-table .actions button {
  margin-bottom: var(--spacing-xs); /* Add some space between buttons if they wrap */
}

ul.compact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--font-size-sm);
}
ul.compact-list li {
  line-height: 1.3;
}

/* Ensure modals are imported or their styles are available globally */
</style>
