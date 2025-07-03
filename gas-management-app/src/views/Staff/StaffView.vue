<template>
  <div class="staff-view container">
    <header class="view-header">
      <h1>Gestión de Personal</h1>
      <button @click="openStaffModal()" class="btn primary">Registrar Nuevo Empleado</button>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="loader"></div>
      <p>Cargando personal...</p>
    </div>

    <div v-if="error" class="alert alert-danger">
      <p>{{ error }}</p>
      <button @click="fetchStaffData" class="btn btn-sm btn-primary">Reintentar</button>
    </div>

    <section v-if="!isLoading && !error">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Listado de Empleados</h2>
          <!-- Add filters here if needed, e.g., by role or status -->
        </div>
        <div class="styled-table-container">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Datos de Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="staffMembers.length === 0">
                <td colspan="5" class="text-center">No hay personal registrado.</td>
              </tr>
              <tr v-for="member in staffMembers" :key="member.id">
                <td>{{ member.name }}</td>
                <td>{{ member.cargo }}</td>
                <td class="contact-details">{{ member.contact }}</td>
                <td><span :class="statusClass(member.status)">{{ member.status }}</span></td>
                <td class="actions">
                  <button @click="openStaffModal(member)" class="btn btn-sm accent">Editar</button>
                  <!-- Add other actions like 'Deactivate' or 'View Details' if needed -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Modal para Añadir/Editar Empleado -->
    <StaffFormModal
      v-if="showStaffFormModal"
      :visible="showStaffFormModal"
      :staff-data="editingStaffMember"
      :roles="availableRoles"
      @close="closeStaffModal"
      @save="handleStaffSave"
    />

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import StaffFormModal from '../../components/staff/StaffFormModal.vue';

// Define available roles for the form
const ROLES = ['Administrador', 'Logística', 'Ventas', 'Chofer', 'Otro'];

export default {
  name: 'StaffView',
  components: {
    StaffFormModal,
  },
  setup() {
    const store = useStore();

    const staffMembers = computed(() => store.getters['staff/allStaffMembers']);
    const isLoading = computed(() => store.getters['staff/isLoadingStaff']);
    const error = computed(() => store.getters['staff/staffError']);

    const showStaffFormModal = ref(false);
    const editingStaffMember = ref(null);
    const availableRoles = ref(ROLES);


    const fetchStaffData = () => {
      store.dispatch('staff/fetchStaff');
    };

    onMounted(() => {
      if (staffMembers.value.length === 0) {
          fetchStaffData();
      }
    });

    const openStaffModal = (member = null) => {
      editingStaffMember.value = member ? { ...member } : null;
      showStaffFormModal.value = true;
    };

    const closeStaffModal = () => {
      showStaffFormModal.value = false;
      editingStaffMember.value = null;
    };

    const handleStaffSave = async (staffData) => {
      try {
        if (staffData.id) {
          await store.dispatch('staff/updateStaffMember', staffData);
        } else {
          await store.dispatch('staff/addStaffMember', staffData);
        }
        closeStaffModal();
      } catch (err) {
        // Error should be handled by the modal or display a general error here
        console.error("Failed to save staff member:", err);
         // Optionally: use a notification system to show error to user
      }
    };

    const statusClass = (status) => {
      if (status === 'Activo') return 'status-active';
      if (status === 'Inactivo') return 'status-inactive';
      return '';
    };

    return {
      staffMembers,
      isLoading,
      error,
      fetchStaffData,
      showStaffFormModal,
      editingStaffMember,
      openStaffModal,
      closeStaffModal,
      handleStaffSave,
      statusClass,
      availableRoles,
    };
  },
};
</script>

<style scoped>
.staff-view {
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

.status-active {
  color: var(--color-success);
  font-weight: bold;
}
.status-inactive {
  color: var(--color-text-secondary); /* Or a specific color like orange/grey */
  font-weight: bold;
}
.contact-details {
  white-space: pre-line; /* Allows line breaks from data like "email | phone" */
  font-size: var(--font-size-sm);
}
</style>
