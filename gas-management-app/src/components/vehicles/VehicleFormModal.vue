<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Registrar Nuevo' }} Vehículo</h3>
        <button @click="close" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="plate">Placa:</label>
            <input type="text" id="plate" v-model="form.plate" required :disabled="isEditing">
            <small v-if="isEditing" class="form-text text-muted">La placa no se puede cambiar una vez registrada.</small>
          </div>
          <div class="form-group">
            <label for="model">Modelo:</label>
            <input type="text" id="model" v-model="form.model" required>
          </div>
          <div class="form-group">
            <label for="status">Estado:</label>
            <select id="status" v-model="form.status" required>
              <option value="Disponible">Disponible</option>
              <option value="En Ruta" :disabled="!isEditing || (vehicleData && vehicleData.status !== 'En Ruta')">En Ruta</option> <!-- Can only be set by departure/return actions -->
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
            <small v-if="form.status === 'En Ruta'" class="form-text text-muted">El estado "En Ruta" se gestiona automáticamente con las salidas/retornos.</small>
          </div>

          <div v-if="formError" class="alert alert-danger">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="close" class="btn">Cancelar</button>
            <button type="submit" class="btn primary" :disabled="isLoading">{{ isLoading ? 'Guardando...' : 'Guardar Vehículo' }}</button>
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
  name: 'VehicleFormModal',
  props: {
    visible: Boolean,
    vehicleData: Object, // Null when adding, populated when editing
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    const form = ref({
      id: null,
      plate: '',
      model: '',
      status: 'Disponible', // Default status
    });
    const formError = ref('');
    const isLoading = computed(() => store.getters['vehicles/isLoadingVehicles']);

    const isEditing = computed(() => !!(props.vehicleData && props.vehicleData.id));

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        formError.value = '';
        if (props.vehicleData && props.vehicleData.id) {
          // Editing existing vehicle
          form.value = { ...props.vehicleData };
        } else {
          // Adding new vehicle
          form.value = { id: null, plate: '', model: '', status: 'Disponible' };
        }
      }
    });

    const close = () => {
      if (!isLoading.value) {
        emit('close');
      }
    };

    const submitForm = async () => {
      formError.value = '';
      if (!form.value.plate.trim() || !form.value.model.trim()) {
        formError.value = 'La placa y el modelo son obligatorios.';
        return;
      }
      // Basic plate format validation (3 letters, hyphen, 3 numbers) - can be improved
      const plateRegex = /^[A-Z]{3}-\d{3,4}$/i;
      if (!plateRegex.test(form.value.plate.trim())) {
          formError.value = 'Formato de placa inválido. Ej: ABC-123 o ABC-1234.';
          return;
      }

      try {
        await emit('save', { ...form.value, plate: form.value.plate.toUpperCase() });
        // The 'close' will be called by the parent component on successful save from store
      } catch (error) {
        formError.value = error.message || 'Error al guardar el vehículo. Intente nuevamente.';
      }
    };

    return {
      form,
      isEditing,
      close,
      submitForm,
      formError,
      isLoading,
    };
  },
};
</script>

<style scoped>
/* Modal styles are largely inherited from global.css */
.form-text.text-muted {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}
/* Add any specific styling for this modal if needed */
</style>
