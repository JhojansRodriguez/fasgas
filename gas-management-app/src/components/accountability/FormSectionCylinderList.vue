<template>
  <div class="cylinder-list-section">
    <h4>{{ title }}</h4>
    <div v-if="items && items.length > 0">
      <div v-for="(item, index) in items" :key="index" class="cylinder-item-row">
        <div class="form-group">
          <label :for="`${sectionId}-type-${index}`">Tipo Garrafa:</label>
          <select :id="`${sectionId}-type-${index}`" v-model="item.typeId" :disabled="isReadOnly" @change="validateItem(item)">
            <option disabled value="">Seleccione tipo</option>
            <option v-for="gt in availableGasTypes(item.typeId)" :key="gt.id" :value="gt.id">
              {{ gt.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label :for="`${sectionId}-qty-${index}`">Cantidad:</label>
          <input type="number" :id="`${sectionId}-qty-${index}`" v-model.number="item.quantity" min="1" :readonly="isReadOnly" @change="validateItem(item)">
        </div>

        <!-- Dynamically add extra props based on itemPropsDefinition -->
        <div v-for="(propDef, propKey) in parsedItemProps" :key="propKey" class="form-group">
            <label :for="`${sectionId}-${propKey}-${index}`">{{ propDef.label }}:</label>
            <input
                v_if="propDef.type === 'text'"
                type="text"
                :id="`${sectionId}-${propKey}-${index}`"
                v-model="item[propKey]"
                :readonly="isReadOnly">
            <!-- Add other input types here if needed: number, select, etc. -->
        </div>

        <button type="button" @click="$emit('remove', index)" v-if="!isReadOnly" class="btn btn-sm danger remove-item-btn">&times;</button>
      </div>
    </div>
    <p v-else-if="isReadOnly && (!items || items.length === 0)" class="text-muted"><em>No hay items en esta sección.</em></p>
    <button type="button" @click="$emit('add')" v-if="!isReadOnly" class="btn btn-sm secondary">Añadir Item</button>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'FormSectionCylinderList',
  props: {
    title: String,
    items: Array, // Array of { typeId, quantity, ...otherProps }
    gasTypes: Array, // All available gas types { id, name }
    isReadOnly: Boolean,
    itemPropsDefinition: { // Optional: defines extra properties for items in this list
        type: String, // JSON string: e.g., '{ "customerInfo": { "label": "Cliente", "type": "text" } }'
        default: '{}'
    }
  },
  emits: ['add', 'remove', 'update:items'], // Although items are mutated directly for simplicity here
  setup(props) {
    const sectionId = computed(() => props.title.toLowerCase().replace(/\s+/g, '-'));

    const parsedItemProps = computed(() => {
        try {
            return JSON.parse(props.itemPropsDefinition);
        } catch (e) {
            console.error("Error parsing itemPropsDefinition JSON:", e);
            return {};
        }
    });

    const availableGasTypes = (currentItemTypeId) => {
      if (!props.items || !props.gasTypes) return props.gasTypes;
      const selectedTypeIdsInThisList = props.items
        .map(item => item.typeId)
        .filter(id => id && id !== currentItemTypeId); // Exclude the current item itself for its own dropdown
      return props.gasTypes.filter(gt => !selectedTypeIdsInThisList.includes(gt.id));
    };

    const validateItem = (item) => {
      // Basic validation, can be expanded
      if (item.quantity < 1 && item.typeId) {
        item.quantity = 1;
      }
    };

    return {
      sectionId,
      availableGasTypes,
      validateItem,
      parsedItemProps,
    };
  }
};
</script>

<style scoped>
.cylinder-list-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: #fdfdfd; /* Slightly off-white for sections */
}
.cylinder-list-section h4 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-size: 1.1rem;
  color: var(--color-secondary);
}
.cylinder-item-row {
  display: grid;
  /* Adjust grid to accommodate more fields if itemPropsDefinition is used */
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  align-items: flex-end;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px dashed var(--color-border);
}
.cylinder-item-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.cylinder-item-row .form-group {
  margin-bottom: 0;
}
.remove-item-btn {
  height: calc(2 * var(--spacing-sm) + 1rem + 2px); /* Match input height */
  justify-self: end; /* Push button to the right in its grid cell */
}
.text-muted {
    color: var(--color-text-secondary);
    font-style: italic;
}
</style>
