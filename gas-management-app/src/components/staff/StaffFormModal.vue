<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Registrar Nuevo' }} Empleado</h3>
        <button @click="close" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="staffName">Nombre Completo:</label>
            <input type="text" id="staffName" v-model="form.name" required>
          </div>

          <div class="form-group">
            <label for="staffCargo">Cargo:</label>
            <select id="staffCargo" v-model="form.cargo" required>
              <option disabled value="">Seleccione un cargo</option>
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </div>

          <div class="form-group">
            <label for="staffContact">Datos de Contacto:</label>
            <textarea id="staffContact" v-model="form.contact" rows="3" placeholder="Ej: correo@ejemplo.com | 123-456-7890"></textarea>
            <small class="form-text text-muted">Puede incluir email, teléfono, etc. Use "|" para separar si desea.</small>
          </div>

          <div class="form-group" v-if="isEditing">
            <label for="staffStatus">Estado:</label>
            <select id="staffStatus" v-model="form.status" required>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div v-if="formError" class="alert alert-danger">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="close" class="btn">Cancelar</button>
            <button type="submit" class="btn primary" :disabled="isLoading">
              {{ isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Empleado') }}
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
  name: 'StaffFormModal',
  props: {
    visible: Boolean,
    staffData: Object, // Null when adding, populated when editing
    roles: {
        type: Array,
        default: () => ['Administrador', 'Logística', 'Ventas', 'Chofer', 'Otro']
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    const initialFormState = () => ({
      id: null,
      name: '',
      cargo: '',
      contact: '',
      status: 'Activo', // Default for new employees
    });
    const form = ref(initialFormState());
    const formError = ref('');

    const isLoading = computed(() => store.getters['staff/isLoadingStaff']);
    const isEditing = computed(() => !!(props.staffData && props.staffData.id));

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        formError.value = '';
        if (props.staffData && props.staffData.id) {
          // Editing existing staff member
          form.value = { ...props.staffData };
        } else {
          // Adding new staff member
          form.value = initialFormState();
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
      if (!form.value.name.trim() || !form.value.cargo.trim()) {
        formError.value = 'El nombre y el cargo son obligatorios.';
        return;
      }
      // Add any other specific validations here

      try {
        // The 'save' event is emitted, and the parent component (StaffView) handles the actual dispatch
        await emit('save', { ...form.value });
        // Parent component will call close() upon successful save from store
      } catch (error) {
        // This catch block might not be strictly necessary if StaffView handles errors from dispatch
        formError.value = error.message || 'Error al guardar los datos del empleado. Intente nuevamente.';
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
</style>
