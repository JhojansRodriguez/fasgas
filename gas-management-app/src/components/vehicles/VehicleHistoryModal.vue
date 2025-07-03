<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content large">
      <div class="modal-header">
        <h3 class="modal-title">Historial de Movimientos del Vehículo: {{ vehicle ? vehicle.plate : '' }}</h3>
        <button @click="close" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="!movements || movements.length === 0" class="alert alert-info">
          No hay movimientos registrados para este vehículo.
        </div>
        <div v-else class="styled-table-container">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Tipo</th>
                <th>Chofer</th>
                <th>Garrafas Llenas Cargadas</th>
                <th>Garrafas Vacías Recogidas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="movement in movements" :key="movement.id">
                <td>{{ formatDateTime(movement.dateTime) }}</td>
                <td>
                  <span :class="movementTypeClass(movement.type)">{{ movement.type }}</span>
                </td>
                <td>{{ getDriverName(movement.driverId) }}</td>
                <td>
                  <ul v-if="movement.loaded && movement.loaded.length > 0" class="compact-list">
                    <li v-for="item in movement.loaded" :key="item.typeId + '_loaded'">
                      {{ getGasTypeName(item.typeId) }}: {{ item.quantity }}
                    </li>
                  </ul>
                  <span v-else>-</span>
                </td>
                <td>
                  <ul v-if="movement.returnedEmpty && movement.returnedEmpty.length > 0" class="compact-list">
                    <li v-for="item in movement.returnedEmpty" :key="item.typeId + '_empty'">
                      {{ getGasTypeName(item.typeId) }}: {{ item.quantity }}
                    </li>
                  </ul>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" @click="close" class="btn">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VehicleHistoryModal',
  props: {
    visible: Boolean,
    vehicle: Object,
    movements: Array, // Array of movement objects for this vehicle
    getDriverName: Function, // Passed from parent to resolve driver names
    getGasTypeName: Function, // Passed from parent to resolve gas type names
  },
  emits: ['close'],
  setup(props, { emit }) {
    const close = () => {
      emit('close');
    };

    const formatDateTime = (isoString) => {
      if (!isoString) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(isoString).toLocaleDateString(undefined, options);
    };

    const movementTypeClass = (type) => {
      if (type === 'Salida') return 'text-accent';
      if (type === 'Retorno') return 'text-success';
      return '';
    };

    return {
      close,
      formatDateTime,
      movementTypeClass,
    };
  },
};
</script>

<style scoped>
.modal-content.large {
  max-width: 800px; /* Or even wider for history tables */
}
.modal-body {
  max-height: 60vh; /* Allow scrolling for long histories */
  overflow-y: auto;
}
.styled-table th, .styled-table td {
  white-space: normal; /* Allow text wrapping for details */
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
.text-accent {
  color: var(--color-accent);
  font-weight: bold;
}
.text-success {
  color: var(--color-success);
  font-weight: bold;
}
</style>
