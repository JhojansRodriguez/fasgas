<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content large">
      <div class="modal-header">
        <h3 class="modal-title">{{ formTitle }}</h3>
        <button @click="closeModal" class="modal-close-button">&times;</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submitForm">
          <!-- Section: Basic Info -->
          <fieldset :disabled="isReadOnly">
            <legend>Información General</legend>
            <div class="form-row">
              <div class="form-group">
                <label for="driverId">Chofer:</label>
                <select id="driverId" v-model="form.driverId" required :disabled="isReadOnly || !isNewRecord">
                  <option disabled value="">Seleccione un chofer</option>
                  <option v-for="driver in drivers" :key="driver.id" :value="driver.id">{{ driver.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="vehicleId">Vehículo Utilizado:</label>
                <select id="vehicleId" v-model="form.vehicleId" required :disabled="isReadOnly || !isNewRecord">
                  <option disabled value="">Seleccione un vehículo</option>
                  <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} - {{ vehicle.model }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="routeId">Identificador de Ruta (Opcional):</label>
              <input type="text" id="routeId" v-model="form.routeId" :readonly="isReadOnly">
            </div>
          </fieldset>

          <!-- Section: Cylinder Movements -->
          <fieldset :disabled="isReadOnly">
            <legend>Movimiento de Garrafas</legend>
            <!-- Sold Cash -->
            <FormSectionCylinderList
              title="Garrafas Vendidas (Contado)"
              :items="form.cylindersSoldCash"
              :gas-types="gasTypes"
              :is-read-only="isReadOnly"
              @add="addItem('cylindersSoldCash')"
              @remove="removeItem('cylindersSoldCash', $event)"
            />
            <!-- Sold Credit -->
            <FormSectionCylinderList
              title="Garrafas Entregadas (Crédito)"
              :items="form.cylindersSoldCredit"
              :gas-types="gasTypes"
              :is-read-only="isReadOnly"
              item-props-definition="{ customerInfo: { label: 'Info Cliente (Crédito)', type: 'text' } }"
              @add="addItem('cylindersSoldCredit')"
              @remove="removeItem('cylindersSoldCredit', $event)"
            />
            <!-- Loaned -->
            <FormSectionCylinderList
              title="Garrafas Prestadas (Pendiente Devolución)"
              :items="form.cylindersLoaned"
              :gas-types="gasTypes"
              :is-read-only="isReadOnly"
              item-props-definition="{ customerInfo: { label: 'Info Cliente (Préstamo)', type: 'text' } }"
              @add="addItem('cylindersLoaned')"
              @remove="removeItem('cylindersLoaned', $event)"
            />
            <!-- Returned Full to Warehouse -->
            <FormSectionCylinderList
              title="Garrafas Llenas Devueltas al Almacén (No Vendidas)"
              :items="form.cylindersReturnedToWarehouseFull"
              :gas-types="gasTypes"
              :is-read-only="isReadOnly"
              @add="addItem('cylindersReturnedToWarehouseFull')"
              @remove="removeItem('cylindersReturnedToWarehouseFull', $event)"
            />
             <!-- Collected Empty -->
            <FormSectionCylinderList
              title="Garrafas Vacías Recogidas de Clientes"
              :items="form.cylindersCollectedEmpty"
              :gas-types="gasTypes"
              :is-read-only="isReadOnly"
              @add="addItem('cylindersCollectedEmpty')"
              @remove="removeItem('cylindersCollectedEmpty', $event)"
            />
          </fieldset>

          <!-- Section: Expenses -->
          <fieldset :disabled="isReadOnly">
            <legend>Detalle de Gastos</legend>
            <div v-for="(expense, index) in form.expenses" :key="index" class="form-row-expenses">
              <div class="form-group">
                <label :for="'expenseType-' + index">Tipo de Gasto:</label>
                <select :id="'expenseType-' + index" v-model="expense.type" :disabled="isReadOnly">
                  <option value="Combustible">Combustible</option>
                  <option value="Viáticos">Viáticos</option>
                  <option value="Reparaciones Menores">Reparaciones Menores</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div class="form-group">
                <label :for="'expenseAmount-' + index">Monto:</label>
                <input type="number" :id="'expenseAmount-' + index" v-model.number="expense.amount" min="0" step="0.01" :readonly="isReadOnly">
              </div>
              <div class="form-group description">
                <label :for="'expenseDesc-' + index">Descripción:</label>
                <input type="text" :id="'expenseDesc-' + index" v-model="expense.description" :readonly="isReadOnly">
              </div>
              <button type="button" @click="removeExpense(index)" v-if="!isReadOnly" class="btn btn-sm danger remove-item-btn">&times;</button>
            </div>
            <button type="button" @click="addExpense" v-if="!isReadOnly" class="btn btn-sm secondary">Añadir Gasto</button>
          </fieldset>

          <!-- Section: Financial Summary (Read-only for now, calculated by backend/store) -->
          <fieldset v-if="!isNewRecord">
              <legend>Resumen Financiero</legend>
                <div class="summary-item"><strong>Total Ventas Contado:</strong> {{ formatCurrency(form.totalCashSales) }}</div>
                <div class="summary-item"><strong>Total Ventas Crédito:</strong> {{ formatCurrency(form.totalCreditSales) }}</div>
                <div class="summary-item"><strong>Total Gastos:</strong> {{ formatCurrency(form.totalExpenses) }}</div>
                <div class="summary-item"><strong>Monto Neto a Rendir:</strong> {{ formatCurrency(form.netAmount) }}</div>
                <div class="summary-item"><strong>Estado:</strong> <span :class="statusClass(form.status)">{{ form.status }}</span></div>
                <div v-if="form.reviewerComments" class="summary-item"><strong>Comentarios Revisión:</strong> {{form.reviewerComments}}</div>
          </fieldset>


          <!-- Section: Comments -->
          <fieldset :disabled="isReadOnly">
            <legend>Comentarios Adicionales</legend>
            <div class="form-group">
              <textarea v-model="form.comments" rows="3" :readonly="isReadOnly"></textarea>
            </div>
          </fieldset>

          <div v-if="formError && !isReadOnly" class="alert alert-danger">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn"> {{ isReadOnly ? 'Cerrar' : 'Cancelar' }}</button>
            <button v-if="!isReadOnly" type="submit" class="btn primary" :disabled="isLoading">
              {{ isLoading ? 'Guardando...' : 'Enviar Rendición' }}
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
import FormSectionCylinderList from './FormSectionCylinderList.vue'; // Generic component for cylinder lists

const getDefaultForm = () => ({
  id: null,
  driverId: '',
  vehicleId: '',
  routeId: '',
  date: new Date().toISOString(),
  cylindersSoldCash: [],
  cylindersSoldCredit: [],
  cylindersLoaned: [],
  cylindersReturnedToWarehouseFull: [],
  cylindersCollectedEmpty: [],
  expenses: [],
  comments: '',
  // Totals are typically calculated by backend or getters, not directly entered
  totalCashSales: 0,
  totalCreditSales: 0,
  totalExpenses: 0,
  netAmount: 0,
  status: 'Pendiente Revisión',
  reviewerComments: '',
});

export default {
  name: 'AccountabilityFormModal',
  components: { FormSectionCylinderList },
  props: {
    visible: Boolean,
    recordData: Object, // Populated when viewing/editing an existing record
    isReadOnly: { // If true, form is for viewing only
        type: Boolean,
        default: false,
    },
    drivers: Array, // {id, name}
    vehicles: Array, // {id, plate, model}
    gasTypes: Array, // {id, name} for select options
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const store = useStore();
    const form = ref(getDefaultForm());
    const formError = ref('');

    const isLoading = computed(() => store.getters['accountability/isLoadingRecords']);
    const isNewRecord = computed(() => !(props.recordData && props.recordData.id));
    const formTitle = computed(() => props.isReadOnly ? 'Detalle de Rendición' : (isNewRecord.value ? 'Registrar Nueva Rendición' : 'Editar Rendición'));


    watch(() => props.visible, (newVal) => {
      if (newVal) {
        formError.value = '';
        if (props.recordData) {
          // Viewing or editing existing record
          form.value = JSON.parse(JSON.stringify(props.recordData)); // Deep copy
        } else {
          // Adding new record
          form.value = getDefaultForm();
        }
      }
    });

    const closeModal = () => {
      if (!isLoading.value) {
        emit('close');
      }
    };

    const addItem = (listName) => {
      form.value[listName].push({ typeId: '', quantity: 1 });
    };
    const removeItem = (listName, index) => {
      form.value[listName].splice(index, 1);
    };
    const addExpense = () => {
      form.value.expenses.push({ type: 'Combustible', amount: 0, description: '' });
    };
    const removeExpense = (index) => {
      form.value.expenses.splice(index, 1);
    };

    const submitForm = async () => {
      if (props.isReadOnly) return;
      formError.value = '';

      // Basic Validations
      if (!form.value.driverId || !form.value.vehicleId) {
        formError.value = 'Chofer y Vehículo son obligatorios.';
        return;
      }
      // Add more specific validations for quantities, expenses etc. if needed

      const payload = { ...form.value };
      // Clean up empty items from lists before sending
      payload.cylindersSoldCash = payload.cylindersSoldCash.filter(i => i.typeId && i.quantity > 0);
      payload.cylindersSoldCredit = payload.cylindersSoldCredit.filter(i => i.typeId && i.quantity > 0);
      payload.cylindersLoaned = payload.cylindersLoaned.filter(i => i.typeId && i.quantity > 0);
      payload.cylindersReturnedToWarehouseFull = payload.cylindersReturnedToWarehouseFull.filter(i => i.typeId && i.quantity > 0);
      payload.cylindersCollectedEmpty = payload.cylindersCollectedEmpty.filter(i => i.typeId && i.quantity > 0);
      payload.expenses = payload.expenses.filter(e => e.type && e.amount > 0);


      try {
        await emit('save', payload);
      } catch (error) {
        formError.value = error.message || 'Error al guardar la rendición.';
      }
    };

    const formatCurrency = (value) => {
      if (typeof value !== 'number') return 'N/A';
      return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }); // Adjust
    };

    const statusClass = (status) => {
      if (status === 'Aprobado') return 'status-approved';
      if (status === 'Pendiente Revisión') return 'status-pending';
      if (status === 'Rechazado') return 'status-rejected';
      return '';
    };


    return {
      form,
      formError,
      isLoading,
      isNewRecord,
      formTitle,
      closeModal,
      submitForm,
      addItem,
      removeItem,
      addExpense,
      removeExpense,
      formatCurrency,
      statusClass,
    };
  },
};
</script>

<style scoped>
.modal-content.large {
  max-width: 900px; /* Wider modal for this complex form */
}
.modal-body {
  max-height: 75vh;
  overflow-y: auto;
}
fieldset {
  border: 1px solid var(--color-border);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius);
}
legend {
  padding: 0 var(--spacing-sm);
  font-weight: bold;
  color: var(--color-primary);
}
.form-row {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}
.form-row-expenses {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  align-items: flex-end;
  margin-bottom: var(--spacing-sm);
}
.form-row-expenses .form-group {
    margin-bottom: 0;
}
.form-row-expenses .form-group.description {
    grid-column: span 2; /* Make description wider if space allows */
}
@media (max-width: 768px) {
    .form-row-expenses .form-group.description {
        grid-column: span 1;
    }
}


.form-row-expenses .remove-item-btn {
  margin-bottom: 0; /* Align with inputs */
  height: calc(2 * var(--spacing-sm) + 1rem + 2px);
}
.summary-item {
    padding: var(--spacing-xs) 0;
    font-size: var(--font-size-base);
}
.summary-item strong {
    color: var(--color-text-secondary);
}
.status-approved { color: var(--color-success); font-weight: bold; }
.status-pending { color: var(--color-warning); font-weight: bold; }
.status-rejected { color: var(--color-error); font-weight: bold; }
</style>
