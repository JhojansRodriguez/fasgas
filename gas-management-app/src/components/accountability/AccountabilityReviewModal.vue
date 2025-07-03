<template>
  <div v-if="visible && record" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Revisar Rendición de Cuentas</h3>
        <button @click="closeModal" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <h4>Detalles de la Rendición:</h4>
        <p><strong>Chofer:</strong> {{ getDriverName(record.driverId) }}</p>
        <p><strong>Vehículo:</strong> {{ getVehiclePlate(record.vehicleId) }}</p>
        <p><strong>Fecha:</strong> {{ formatDateTime(record.date) }}</p>
        <p><strong>Monto Neto Rendido:</strong> {{ formatCurrency(record.netAmount) }}</p>
        <p><strong>Comentarios del Chofer:</strong> {{ record.comments || 'N/A' }}</p>

        <hr>

        <form @submit.prevent="submitReviewForm">
          <div class="form-group">
            <label for="reviewStatus">Estado de la Revisión:</label>
            <select id="reviewStatus" v-model="reviewForm.status" required>
              <option value="Aprobado">Aprobar</option>
              <option value="Rechazado">Rechazar</option>
              <!-- <option value="Pendiente Información">Pendiente Información</option> -->
            </select>
          </div>
          <div class="form-group">
            <label for="reviewerComments">Comentarios de la Revisión (Opcional):</label>
            <textarea id="reviewerComments" v-model="reviewForm.comments" rows="3"></textarea>
          </div>

          <div v-if="formError" class="alert alert-danger">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn">Cancelar</button>
            <button type="submit" class="btn primary" :disabled="isLoading">
              {{ isLoading ? 'Procesando...' : 'Confirmar Revisión' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AccountabilityReviewModal',
  props: {
    visible: Boolean,
    record: Object, // The accountability record to be reviewed
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const store = useStore();
    const reviewForm = ref({
      status: 'Aprobado', // Default to approve
      comments: '',
    });
    const formError = ref('');

    const isLoading = computed(() => store.getters['accountability/isLoadingRecords']);
    // These would ideally come from the parent or a shared utility/store getters
    const staffMembers = computed(() => store.getters['staff/allStaffMembers'] || []);
    const vehicles = computed(() => store.getters['vehicles/allVehicles'] || []);


    watch(() => props.visible, (newVal) => {
      if (newVal && props.record) {
        formError.value = '';
        reviewForm.value = {
          status: 'Aprobado', // Reset to default when modal opens
          comments: '',
        };
      }
    });

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
      return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }); // Adjust
    };


    const closeModal = () => {
      if (!isLoading.value) {
        emit('close');
      }
    };

    const submitReviewForm = async () => {
      formError.value = '';
      if (!reviewForm.value.status) {
        formError.value = 'Debe seleccionar un estado para la revisión.';
        return;
      }
      if (reviewForm.value.status === 'Rechazado' && !reviewForm.value.comments.trim()) {
        formError.value = 'Debe ingresar un comentario si rechaza la rendición.';
        return;
      }

      try {
        emit('submit', {
          recordId: props.record.id,
          status: reviewForm.value.status,
          comments: reviewForm.value.comments,
        });
      } catch (error) {
        formError.value = error.message || 'Error al procesar la revisión.';
      }
    };

    return {
      reviewForm,
      formError,
      isLoading,
      closeModal,
      submitReviewForm,
      getDriverName,
      getVehiclePlate,
      formatDateTime,
      formatCurrency,
    };
  },
};
</script>

<style scoped>
/* Modal styles are largely inherited */
.modal-body h4 {
    margin-top: 0;
    color: var(--color-primary);
}
.modal-body p {
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-sm);
}
.modal-body hr {
    margin-top: var(--spacing-md);
    margin-bottom: var(--spacing-md);
}
</style>
