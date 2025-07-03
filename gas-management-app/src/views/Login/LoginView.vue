<template>
  <div class="login-container">
    <div class="login-card card">
      <div class="card-header text-center">
        <h1 class="card-title">GasControl ERP</h1>
        <p>Iniciar Sesión</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Correo Electrónico:</label>
          <input type="email" id="email" v-model="credentials.email" required autofocus>
        </div>
        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input type="password" id="password" v-model="credentials.password" required>
        </div>

        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="submit" class="btn primary btn-block" :disabled="isLoading">
            {{ isLoading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </div>
         <div class="mock-login-info mt-3">
            <p class="text-secondary"><strong>Usuarios de prueba (contraseña: password):</strong></p>
            <ul>
                <li>admin@example.com (Administrador)</li>
                <li>logistica@example.com (Logística)</li>
                <li>ventas@example.com (Ventas)</li>
                <li>chofer@example.com (Chofer)</li>
            </ul>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const credentials = ref({
      email: '',
      password: '',
    });

    const isLoading = computed(() => store.getters['auth/isLoadingAuth']);
    const error = computed(() => store.getters['auth/authError']);

    const handleLogin = async () => {
      try {
        await store.dispatch('auth/login', credentials.value);
        // Redirect to dashboard or intended page after successful login
        const redirectPath = route.query.redirect || '/dashboard'; // Default to dashboard
        router.push(redirectPath);
      } catch (err) {
        // Error is already set in the store, template will display it
        console.error("Login failed:", err);
      }
    };

    return {
      credentials,
      isLoading,
      error,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* Full viewport height */
  background-color: var(--color-background-light);
  padding: var(--spacing-md);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-lg);
}

.card-title {
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: var(--spacing-xs);
}
.card-header p {
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
}

.btn-block {
  width: 100%;
}
.mock-login-info {
    font-size: var(--font-size-sm);
    background-color: #f8f9fa;
    padding: var(--spacing-sm);
    border-radius: var(--border-radius);
}
.mock-login-info ul {
    padding-left: var(--spacing-md);
    margin-bottom: 0;
}
</style>
