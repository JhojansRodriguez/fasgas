<template>
  <div class="accountability-view container">
    <header class="view-header">
      <h1>Rendición de Cuentas</h1>
      <button @click="openAccountabilityModal()" class="btn primary" v-if="canSubmitNew">
        Registrar Nueva Rendición
      </button>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="loader"></div>
      <p>Cargando rendiciones...</p>
    </div>

    <div v-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
      <button @click="fetchAccountabilityData" class="btn btn-sm btn-primary">Reintentar</button>
    </div>

    <section v-if="!isLoading && !error">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h2 class="card-title">Historial de Rendiciones</h2>
          <!-- Filters can be added here: by driver, date range, status -->
        </div>
        <div class="styled-table-container">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Chofer</th>
                <th>Vehículo</th>
                <th>Ventas Efectivo</th>
                <th>Ventas Crédito</th>
                <th>Gastos</th>
                <th>Neto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="records.length === 0">
                <td colspan="9" class="text-center">No hay rendiciones registradas.</td>
              </tr>
              <tr v-for="record in records" :key="record.id">
                <td>{{ formatDateTime(record.date) }}</td>
                <td>{{ getDriverName(record.driverId) }}</td>
                <td>{{ getVehiclePlate(record.vehicleId) }}</td>
                <td>{{ formatCurrency(record.totalCashSales) }}</td>
                <td>{{ formatCurrency(record.totalCreditSales) }}</td>
                <td>{{ formatCurrency(record.totalExpenses) }}</td>
                <td>{{ formatCurrency(record.netAmount) }}</td>
                <td><span :class="statusClass(record.status)">{{ record.status }}</span></td>
                <td class="actions">
                  <button @click="openAccountabilityModal(record)" class="btn btn-sm info">Ver Detalle</button>
                  <button
                    v-if="canReview(record)"
                    @click="openReviewModal(record)"
                    class="btn btn-sm accent">
                    Revisar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Modal para Registrar/Ver Rendición -->
    <AccountabilityFormModal
      v-if="showAccountabilityFormModal"
      :visible="showAccountabilityFormModal"
      :record-data="selectedRecord"
      :is-read-only="isViewingOnly"
      :drivers="availableDrivers"
      :vehicles="availableVehiclesForForm"
      :gas-types="allGasTypesForForm"
      @close="closeAccountabilityModal"
      @save="handleAccountabilitySave"
    />

    <!-- Modal para Revisar Rendición (Admin/Logística) -->
    <AccountabilityReviewModal
        v-if="showReviewFormModal"
        :visible="showReviewFormModal"
        :record="recordForReview"
        @close="closeReviewModal"
        @submit="handleReviewSubmit"
    />

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import AccountabilityFormModal from '../../components/accountability/AccountabilityFormModal.vue';
import AccountabilityReviewModal from '../../components/accountability/AccountabilityReviewModal.vue';
// Mock data - replace with actual store access
// const MOCK_USER_ROLE = 'Administrador'; // or 'Chofer', 'Logística'

export default {
  name: 'AccountabilityView',
  components: {
    AccountabilityFormModal,
    AccountabilityReviewModal,
  },
  setup() {
    const store = useStore();

    // --- State from Vuex ---
    const records = computed(() => store.getters['accountability/allAccountabilityRecords']);
    const isLoading = computed(() => store.getters['accountability/isLoadingRecords'] || store.getters['staff/isLoadingStaff'] || store.getters['vehicles/isLoadingVehicles'] || store.getters['inventory/isLoadingInventory']);
    const error = computed(() => store.getters['accountability/recordsError'] || store.getters['staff/staffError'] || store.getters['vehicles/vehicleError'] || store.getters['inventory/inventoryError']);

    const staffMembers = computed(() => store.getters['staff/allStaffMembers']);
    const vehicles = computed(() => store.getters['vehicles/allVehicles']);
    const gasTypes = computed(() => store.getters['inventory/allInventory']);
    // This would come from an auth module
    const currentUserRole = computed(() => store.state.auth?.user?.role || 'Chofer'); // Mock default for now


    // --- Local State for Modals ---
    const showAccountabilityFormModal = ref(false);
    const selectedRecord = ref(null);
    const isViewingOnly = ref(false);

    const showReviewFormModal = ref(false);
    const recordForReview = ref(null);

    // --- Computed properties for forms ---
    const availableDrivers = computed(() =>
        staffMembers.value.filter(s => s.cargo === 'Chofer' && s.status === 'Activo')
                        .map(d => ({ id: d.id, name: d.name }))
    );
    const availableVehiclesForForm = computed(() =>
        vehicles.value.filter(v => v.status === 'Disponible' || v.status === 'En Ruta') // Or just all vehicles
                     .map(v => ({ id: v.id, plate: v.plate, model: v.model }))
    );
    const allGasTypesForForm = computed(() =>
        gasTypes.value.map(gt => ({ id: gt.id, name: gt.name }))
    );


    // --- Methods ---
    const fetchAllData = () => {
      store.dispatch('accountability/fetchAccountabilityRecords');
      if(staffMembers.value.length === 0) store.dispatch('staff/fetchStaff');
      if(vehicles.value.length === 0) store.dispatch('vehicles/fetchVehicles');
      if(gasTypes.value.length === 0) store.dispatch('inventory/fetchInventory');
    };

    onMounted(fetchAllData);


    const getDriverName = (driverId) => {
      const driver = staffMembers.value.find(s => s.id === driverId);
      return driver ? driver.name : 'N/A';
    };

    const getVehiclePlate = (vehicleId) => {
      const vehicle = vehicles.value.find(v => v.id === vehicleId);
      return vehicle ? vehicle.plate : 'N/A';
    };

    const formatDateTime = (isoString) => {
      if (!isoString) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(isoString).toLocaleDateString(undefined, options);
    };

    const formatCurrency = (value) => {
      if (typeof value !== 'number') return 'N/A';
      return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }); // Adjust currency as needed
    };

    const openAccountabilityModal = (record = null) => {
      selectedRecord.value = record ? { ...record } : null;
      isViewingOnly.value = !!record; // If there's a record, open in read-only mode initially
      showAccountabilityFormModal.value = true;
    };

    const closeAccountabilityModal = () => {
      showAccountabilityFormModal.value = false;
      selectedRecord.value = null;
      isViewingOnly.value = false;
    };

    const handleAccountabilitySave = async (formData) => {
      try {
        // In this setup, the form modal is only for new submissions.
        // Edits would require more complex logic or a different flow.
        await store.dispatch('accountability/submitAccountabilityRecord', formData);
        closeAccountabilityModal();
        fetchAllData(); // Refresh list
      } catch (err) {
        console.error("Failed to save accountability record:", err);
        // Error should be handled by the modal or display a general error here
      }
    };

    const openReviewModal = (record) => {
        recordForReview.value = record;
        showReviewFormModal.value = true;
    };
    const closeReviewModal = () => {
        showReviewFormModal.value = false;
        recordForReview.value = null;
    };
    const handleReviewSubmit = async ({ recordId, status, comments }) => {
        try {
            await store.dispatch('accountability/updateAccountabilityRecordStatus', {
                recordId,
                status,
                reviewerComments: comments,
            });
            closeReviewModal();
            fetchAllData(); // Refresh list
        } catch (err) {
            console.error("Failed to submit review:", err);
        }
    };

    const statusClass = (status) => {
      if (status === 'Aprobado') return 'status-approved';
      if (status === 'Pendiente Revisión') return 'status-pending';
      if (status === 'Rechazado') return 'status-rejected';
      return '';
    };

    // Permissions (simplified based on mock role)
    const canSubmitNew = computed(() => ['Chofer', 'Administrador'].includes(currentUserRole.value));
    const canReview = (record) => {
        return ['Administrador', 'Logística'].includes(currentUserRole.value) && record.status === 'Pendiente Revisión';
    };


    return {
      records,
      isLoading,
      error,
      fetchAccountabilityData: fetchAllData, // Renamed for clarity
      showAccountabilityFormModal,
      selectedRecord,
      isViewingOnly,
      openAccountabilityModal,
      closeAccountabilityModal,
      handleAccountabilitySave,
      getDriverName,
      getVehiclePlate,
      formatDateTime,
      formatCurrency,
      statusClass,
      availableDrivers,
      availableVehiclesForForm,
      allGasTypesForForm,
      canSubmitNew,
      canReview,
      showReviewFormModal,
      recordForReview,
      openReviewModal,
      closeReviewModal,
      handleReviewSubmit,
    };
  },
};
</script>

<style scoped>
.accountability-view {
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

.status-approved {
  color: var(--color-success);
  font-weight: bold;
}
.status-pending {
  color: var(--color-warning); /* Using warning for pending */
  font-weight: bold;
}
.status-rejected {
  color: var(--color-error);
  font-weight: bold;
}
.styled-table .actions button {
  margin-bottom: var(--spacing-xs);
}
</style>
