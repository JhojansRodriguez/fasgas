<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Registrar Salida de Vehículo</h3>
        <button @click="close" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitDeparture">
          <p><strong>Vehículo:</strong> {{ vehicle.plate }} - {{ vehicle.model }}</p>

          <div class="form-group">
            <label for="driver">Chofer Asignado:</label>
            <select id="driver" v-model="departureForm.driverId" required>
              <option disabled value="">Seleccione un chofer</option>
              <option v-for="driver in drivers" :key="driver.id" :value="driver.id">
                {{ driver.name }}
              </option>
            </select>
          </div>

          <h4>Carga de Garrafas Llenas</h4>
          <div v-for="(item, index) in departureForm.itemsLoaded" :key="index" class="loaded-item-row">
            <div class="form-group item-group">
              <label :for="'gasTypeLoaded-' + index">Tipo de Garrafa:</label>
              <select :id="'gasTypeLoaded-' + index" v-model="item.typeId" @change="updateMaxQuantity(item)">
                <option disabled value="">Seleccione tipo</option>
                <option v-for="gt in availableGasTypes(item.typeId)" :key="gt.id" :value="gt.id">
                  {{ gt.name }} (Disp: {{ gt.filled }})
                </option>
              </select>
            </div>
            <div class="form-group item-group">
              <label :for="'quantityLoaded-' + index">Cantidad:</label>
              <input type="number" :id="'quantityLoaded-' + index" v-model.number="item.quantity" min="1" :max="getMaxQuantity(item.typeId)" required>
            </div>
            <button type="button" @click="removeItemLoaded(index)" class="btn btn-sm danger remove-item-btn" :disabled="departureForm.itemsLoaded.length <= 1">&times;</button>
          </div>
          <button type="button" @click="addItemLoaded" class="btn btn-sm secondary">Añadir Otro Tipo</button>

          <div v-if="formError" class="alert alert-danger mt-2">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="close" class="btn">Cancelar</button>
            <button type="submit" class="btn primary" :disabled="isLoading || !canSubmit">
              {{ isLoading ? 'Registrando...' : 'Registrar Salida' }}
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
  name: 'VehicleDepartureModal',
  props: {
    visible: Boolean,
    vehicle: Object,
    drivers: Array, // { id, name }
    gasTypes: Array, // { id, name, filled (available stock) }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    const departureForm = ref({
      vehicleId: '',
      driverId: '',
      itemsLoaded: [{ typeId: '', quantity: 1 }],
    });
    const formError = ref('');
    const isLoading = computed(() => store.getters['vehicles/isLoadingVehicles']);

    watch(() => props.visible, (newVal) => {
      if (newVal && props.vehicle) {
        formError.value = '';
        departureForm.value = {
          vehicleId: props.vehicle.id,
          driverId: '',
          itemsLoaded: [{ typeId: '', quantity: 1 }],
        };
      }
    });

    const availableGasTypes = (currentItemTypeId) => {
      // Filter out gas types already selected in other rows
      const selectedTypeIds = departureForm.value.itemsLoaded
        .map(item => item.typeId)
        .filter(id => id && id !== currentItemTypeId);
      return props.gasTypes.filter(gt => !selectedTypeIds.includes(gt.id) && gt.filled > 0);
    };

    const getMaxQuantity = (typeId) => {
      if (!typeId) return null;
      const gasType = props.gasTypes.find(gt => gt.id === typeId);
      return gasType ? gasType.filled : null;
    };

    const updateMaxQuantity = (item) => {
        const max = getMaxQuantity(item.typeId);
        if (max !== null && item.quantity > max) {
            item.quantity = max;
        } else if (item.quantity < 1 && max > 0) {
            item.quantity = 1;
        } else if (max === 0) {
            item.quantity = 0;
        }
    };


    const addItemLoaded = () => {
      if (departureForm.value.itemsLoaded.length < props.gasTypes.length) {
        departureForm.value.itemsLoaded.push({ typeId: '', quantity: 1 });
      }
    };

    const removeItemLoaded = (index) => {
      if (departureForm.value.itemsLoaded.length > 1) {
        departureForm.value.itemsLoaded.splice(index, 1);
      }
    };

    const canSubmit = computed(() => {
        if (!departureForm.value.driverId) return false;
        if (departureForm.value.itemsLoaded.length === 0) return false;
        return departureForm.value.itemsLoaded.every(item =>
            item.typeId &&
            item.quantity > 0 &&
            item.quantity <= (getMaxQuantity(item.typeId) || 0)
        );
    });

    const close = () => {
      if (!isLoading.value) {
        emit('close');
      }
    };

    const submitDeparture = async () => {
      formError.value = '';
      if (!departureForm.value.driverId) {
        formError.value = 'Debe seleccionar un chofer.';
        return;
      }
      const validItems = departureForm.value.itemsLoaded.filter(item => item.typeId && item.quantity > 0);
      if (validItems.length === 0) {
        formError.value = 'Debe cargar al menos un tipo de garrafa con cantidad válida.';
        return;
      }

      for (const item of validItems) {
        const maxQty = getMaxQuantity(item.typeId);
        if (item.quantity > maxQty) {
          const gasType = props.gasTypes.find(gt => gt.id === item.typeId);
          formError.value = `La cantidad de ${gasType.name} (${item.quantity}) excede el stock disponible (${maxQty}).`;
          return;
        }
      }

      const payload = {
        vehicleId: departureForm.value.vehicleId,
        driverId: departureForm.value.driverId,
        itemsLoaded: validItems.map(item => ({ typeId: item.typeId, quantity: item.quantity })),
      };

      try {
        await emit('save', payload);
      } catch (error) {
        formError.value = error.message || 'Error al registrar la salida. Intente nuevamente.';
      }
    };

    return {
      departureForm,
      formError,
      isLoading,
      close,
      submitDeparture,
      addItemLoaded,
      removeItemLoaded,
      availableGasTypes,
      getMaxQuantity,
      updateMaxQuantity,
      canSubmit,
    };
  },
};
</script>

<style scoped>
.loaded-item-row {
  display: flex;
  align-items: flex-end; /* Align button with bottom of inputs */
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}
.item-group {
  flex-grow: 1;
  margin-bottom: 0; /* Remove default margin from form-group */
}
.remove-item-btn {
  height: calc(2 * var(--spacing-sm) + 1rem + 2px); /* Match input height + padding + border */
  line-height: 1; /* Center icon vertically */
}
</style>
