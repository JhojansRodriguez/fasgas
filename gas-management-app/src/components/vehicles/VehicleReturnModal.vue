<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Registrar Retorno de Vehículo</h3>
        <button @click="close" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitReturn">
          <p><strong>Vehículo:</strong> {{ vehicle.plate }} - {{ vehicle.model }}</p>
          <p><strong>Chofer:</strong> {{ getDriverName(vehicle.driverId) }}</p>

          <h4>Garrafas Vacías Recogidas</h4>
          <div v-for="(item, index) in returnForm.itemsReturnedEmpty" :key="index" class="returned-item-row">
            <div class="form-group item-group">
              <label :for="'gasTypeReturned-' + index">Tipo de Garrafa:</label>
              <select :id="'gasTypeReturned-' + index" v-model="item.typeId">
                <option disabled value="">Seleccione tipo</option>
                <option v-for="gt in availableGasTypes(item.typeId)" :key="gt.id" :value="gt.id">
                  {{ gt.name }}
                </option>
              </select>
            </div>
            <div class="form-group item-group">
              <label :for="'quantityReturned-' + index">Cantidad Vacías:</label>
              <input type="number" :id="'quantityReturned-' + index" v-model.number="item.quantity" min="0" required>
            </div>
            <button type="button" @click="removeItemReturned(index)" class="btn btn-sm danger remove-item-btn" :disabled="returnForm.itemsReturnedEmpty.length <= 1">&times;</button>
          </div>
          <button type="button" @click="addItemReturned" class="btn btn-sm secondary">Añadir Otro Tipo</button>

          <div v-if="formError" class="alert alert-danger mt-2">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="close" class="btn">Cancelar</button>
            <button type="submit" class="btn primary" :disabled="isLoading || !canSubmit">
              {{ isLoading ? 'Registrando...' : 'Registrar Retorno' }}
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

// Temporary mock, replace with actual store getter or prop
const mockStaffForModal = [
    { id: 'emp1', name: 'Carlos Pérez' },
    { id: 'emp2', name: 'Ana Gómez' },
];


export default {
  name: 'VehicleReturnModal',
  props: {
    visible: Boolean,
    vehicle: Object, // Vehicle that is returning
    // gasTypesLoaded: Array, // Array of { typeId, quantity } that were loaded on departure
    allGasTypes: Array, // All available gas types { id, name } from inventory
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    const returnForm = ref({
      vehicleId: '',
      itemsReturnedEmpty: [{ typeId: '', quantity: 0 }],
    });
    const formError = ref('');
    const isLoading = computed(() => store.getters['vehicles/isLoadingVehicles']);

    // Function to get driver name, can be passed as prop or use a global utility/store
    const getDriverName = (driverId) => {
      const driver = mockStaffForModal.find(s => s.id === driverId);
      return driver ? driver.name : 'N/A';
    };

    watch(() => props.visible, (newVal) => {
      if (newVal && props.vehicle) {
        formError.value = '';
        returnForm.value = {
          vehicleId: props.vehicle.id,
          itemsReturnedEmpty: [{ typeId: '', quantity: 0 }],
        };
      }
    });

    const availableGasTypes = (currentItemTypeId) => {
      const selectedTypeIds = returnForm.value.itemsReturnedEmpty
        .map(item => item.typeId)
        .filter(id => id && id !== currentItemTypeId);
      return props.allGasTypes.filter(gt => !selectedTypeIds.includes(gt.id));
    };

    const addItemReturned = () => {
      if (returnForm.value.itemsReturnedEmpty.length < props.allGasTypes.length) {
        returnForm.value.itemsReturnedEmpty.push({ typeId: '', quantity: 0 });
      }
    };

    const removeItemReturned = (index) => {
      if (returnForm.value.itemsReturnedEmpty.length > 1) {
        returnForm.value.itemsReturnedEmpty.splice(index, 1);
      }
    };

    const canSubmit = computed(() => {
        if (returnForm.value.itemsReturnedEmpty.length === 0) return true; // Can submit with zero returns
        return returnForm.value.itemsReturnedEmpty.every(item =>
            item.typeId &&
            item.quantity >= 0
        );
    });

    const close = () => {
      if (!isLoading.value) {
        emit('close');
      }
    };

    const submitReturn = async () => {
      formError.value = '';
      const validItems = returnForm.value.itemsReturnedEmpty.filter(item => item.typeId && item.quantity >= 0);

      // It's okay if validItems is empty, means no empty cylinders were collected
      // if (validItems.length === 0 && returnForm.value.itemsReturnedEmpty.some(i => i.typeId || i.quantity > 0) ) {
      //   formError.value = 'Debe especificar tipos de garrafa y cantidades válidas, o no ingresar items si no se recogieron vacías.';
      //   return;
      // }

      const payload = {
        vehicleId: returnForm.value.vehicleId,
        // Include itemsReturnedEmpty only if there are any with quantity > 0
        itemsReturnedEmpty: validItems.filter(item => item.quantity > 0).map(item => ({ typeId: item.typeId, quantity: item.quantity })),
      };

      try {
        await emit('save', payload);
      } catch (error) {
        formError.value = error.message || 'Error al registrar el retorno. Intente nuevamente.';
      }
    };

    return {
      returnForm,
      formError,
      isLoading,
      close,
      submitReturn,
      addItemReturned,
      removeItemReturned,
      getDriverName,
      availableGasTypes,
      canSubmit,
    };
  },
};
</script>

<style scoped>
.returned-item-row {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.item-group {
  flex-grow: 1;
  margin-bottom: 0;
}
.remove-item-btn {
  height: calc(2 * var(--spacing-sm) + 1rem + 2px);
  line-height: 1;
}
</style>
